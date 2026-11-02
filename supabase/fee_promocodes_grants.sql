-- ============================================================================
-- Migration: Ensure full permissions on public.fee_promocodes
-- ============================================================================

GRANT ALL ON TABLE public.fee_promocodes TO anon, authenticated, service_role;
