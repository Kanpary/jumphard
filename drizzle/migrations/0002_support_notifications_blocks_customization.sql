-- 1. Perfis: tipo de conta, bloqueio e dados extras
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'player',
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS block_mode TEXT,
  ADD COLUMN IF NOT EXISTS block_reason TEXT,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_by UUID,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS pix_key TEXT,
  ADD COLUMN IF NOT EXISTS pix_key_type TEXT,
  ADD COLUMN IF NOT EXISTS last_ip TEXT,
  ADD COLUMN IF NOT EXISTS risk_score NUMERIC NOT NULL DEFAULT 0;

-- 2. Configurações financeiras: taxa de depósito
ALTER TABLE public.financial_settings
  ADD COLUMN IF NOT EXISTS deposit_fee_percent NUMERIC NOT NULL DEFAULT 0;

-- 3. Jogo: modo bônus, sons e valores fixos de aposta
ALTER TABLE public.game_settings
  ADD COLUMN IF NOT EXISTS bonus_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS bonus_trigger_chance NUMERIC NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS bonus_duration_seconds NUMERIC NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS bonus_multiplier NUMERIC NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS bonus_min_coins INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS bet_options JSONB NOT NULL DEFAULT
    '[0.10,0.20,0.40,0.60,0.80,1.00,1.50,2.00,3.00,5.00,10.00,20.00,50.00,100.00,200.00,400.00]'::jsonb,
  ADD COLUMN IF NOT EXISTS sounds_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS animations_enabled BOOLEAN NOT NULL DEFAULT true;

-- 4. Personalização do frontend
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT NOT NULL DEFAULT 'Jump Cash',
  tagline TEXT NOT NULL DEFAULT 'Pule, colete e ganhe',
  hero_title TEXT NOT NULL DEFAULT 'Jump Cash',
  hero_subtitle TEXT NOT NULL DEFAULT '',
  hero_image_url TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '0 72% 42%',
  background_color TEXT NOT NULL DEFAULT '0 0% 5%',
  accent_color TEXT NOT NULL DEFAULT '0 72% 42%',
  cta_primary_label TEXT NOT NULL DEFAULT 'Criar conta',
  cta_secondary_label TEXT NOT NULL DEFAULT 'Entrar',
  footer_text TEXT NOT NULL DEFAULT '',
  support_enabled BOOLEAN NOT NULL DEFAULT true,
  support_welcome_message TEXT NOT NULL DEFAULT 'Olá! Como podemos ajudar?',
  show_landing_preview BOOLEAN NOT NULL DEFAULT true,
  custom_css TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS site_settings_read ON public.site_settings;
CREATE POLICY site_settings_read ON public.site_settings FOR SELECT USING (true);
DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Suporte ao vivo
DO $$ BEGIN
  CREATE TYPE public.support_status AS ENUM ('open','pending','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject TEXT NOT NULL DEFAULT 'Atendimento',
  status public.support_status NOT NULL DEFAULT 'open',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unread_for_admin INTEGER NOT NULL DEFAULT 0,
  unread_for_user INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_tickets_user_idx ON public.support_tickets(user_id);
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS support_tickets_select ON public.support_tickets;
CREATE POLICY support_tickets_select ON public.support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
DROP TRIGGER IF EXISTS support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.support_messages (
  id BIGSERIAL PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL DEFAULT 'user',
  sender_id UUID,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_messages_ticket_idx ON public.support_messages(ticket_id, created_at);
GRANT SELECT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS support_messages_select ON public.support_messages;
CREATE POLICY support_messages_select ON public.support_messages FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()
  ));

-- 6. Notificações administrativas
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  user_id UUID,
  metadata JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_notifications_created_idx ON public.admin_notifications(created_at DESC);
GRANT SELECT ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_notifications_admin_read ON public.admin_notifications;
CREATE POLICY admin_notifications_admin_read ON public.admin_notifications FOR SELECT TO authenticated
  USING (public.is_admin());

-- 7. Alertas de movimentações suspeitas
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  kind TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL,
  metadata JSONB,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS security_alerts_created_idx ON public.security_alerts(created_at DESC);
GRANT SELECT ON public.security_alerts TO authenticated;
GRANT ALL ON public.security_alerts TO service_role;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS security_alerts_admin_read ON public.security_alerts;
CREATE POLICY security_alerts_admin_read ON public.security_alerts FOR SELECT TO authenticated
  USING (public.is_admin());

-- 8. Realtime
ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;