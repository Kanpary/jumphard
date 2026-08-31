ALTER TABLE public.financial_settings
  ADD COLUMN IF NOT EXISTS rollover_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rollover_multiplier numeric NOT NULL DEFAULT 1;

ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS rollover_required numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rollover_progress numeric NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS custom_rtp numeric,
  ADD COLUMN IF NOT EXISTS custom_rollover_multiplier numeric;