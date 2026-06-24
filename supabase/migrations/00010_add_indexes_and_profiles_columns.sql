
-- ── Opportunity query performance indexes ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_opportunities_category
  ON public.opportunities (category);

CREATE INDEX IF NOT EXISTS idx_opportunities_opportunity_score
  ON public.opportunities (opportunity_score DESC);

CREATE INDEX IF NOT EXISTS idx_opportunities_growth_percent
  ON public.opportunities (growth_percent DESC);

CREATE INDEX IF NOT EXISTS idx_opportunities_is_hidden_gem
  ON public.opportunities (is_hidden_gem)
  WHERE is_hidden_gem = true;

CREATE INDEX IF NOT EXISTS idx_opportunities_created_at
  ON public.opportunities (created_at DESC);

-- ── Reports user query index ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reports_user_id
  ON public.reports (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_type
  ON public.reports (user_id, type);

-- ── Affiliate performance indexes ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_referral_events_affiliate_id
  ON public.referral_events (affiliate_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payouts_affiliate_id
  ON public.payouts (affiliate_id, created_at DESC);

-- ── Market analysis user index ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_market_analysis_user_id
  ON public.market_analysis (user_id);

-- ── Saved items user index ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id
  ON public.saved_items (user_id, item_type);

-- ── Add missing profile columns ───────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS linkedin text,
  ADD COLUMN IF NOT EXISTS twitter text;

-- ── Add unique constraint on subscriptions.user_id if not present ─────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_user_id_key'
      AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END
$$;
