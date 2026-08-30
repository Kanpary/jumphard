-- 1) Data API grants (RLS policies already exist, but no privileges were granted)
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.wallets TO authenticated;
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT SELECT ON public.deposits TO authenticated;
GRANT SELECT ON public.withdrawals TO authenticated;
GRANT SELECT ON public.game_sessions TO authenticated;
GRANT SELECT ON public.affiliate_commissions TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.admin_logs TO authenticated;
GRANT SELECT ON public.webhook_logs TO authenticated;

GRANT SELECT ON public.banners TO anon, authenticated;
GRANT SELECT ON public.game_settings TO anon, authenticated;
GRANT SELECT ON public.character_settings TO anon, authenticated;
GRANT SELECT ON public.financial_settings TO anon, authenticated;
GRANT SELECT ON public.commission_settings TO anon, authenticated;
GRANT SELECT ON public.influencer_settings TO anon, authenticated;
GRANT SELECT ON public.onixpay_config TO anon, authenticated;

GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.wallets TO service_role;
GRANT ALL ON public.wallet_transactions TO service_role;
GRANT ALL ON public.deposits TO service_role;
GRANT ALL ON public.withdrawals TO service_role;
GRANT ALL ON public.game_sessions TO service_role;
GRANT ALL ON public.affiliate_commissions TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.admin_logs TO service_role;
GRANT ALL ON public.webhook_logs TO service_role;
GRANT ALL ON public.banners TO service_role;
GRANT ALL ON public.game_settings TO service_role;
GRANT ALL ON public.character_settings TO service_role;
GRANT ALL ON public.financial_settings TO service_role;
GRANT ALL ON public.commission_settings TO service_role;
GRANT ALL ON public.influencer_settings TO service_role;
GRANT ALL ON public.onixpay_config TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 2) Singleton configuration rows (column defaults only, no fictitious data)
INSERT INTO public.game_settings DEFAULT VALUES;
INSERT INTO public.character_settings DEFAULT VALUES;
INSERT INTO public.financial_settings DEFAULT VALUES;
INSERT INTO public.commission_settings DEFAULT VALUES;
INSERT INTO public.influencer_settings DEFAULT VALUES;
INSERT INTO public.onixpay_config DEFAULT VALUES;