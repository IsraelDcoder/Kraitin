
-- ─── 1. profiles: add referred_by to track who referred this user ───────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by TEXT DEFAULT NULL;

-- ─── 2. referral_events: add stripe_invoice_id for idempotency ───────────────
ALTER TABLE public.referral_events
  ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT DEFAULT NULL;

-- ─── 3. affiliates: add pending_earnings column ──────────────────────────────
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS pending_earnings NUMERIC DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS paid_earnings    NUMERIC DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS mrr_generated    NUMERIC DEFAULT 0 NOT NULL;

-- ─── 4. payouts: add approved/rejected statuses via check constraint update ──
-- Drop old constraint if any, recreate with full status set
ALTER TABLE public.payouts
  DROP CONSTRAINT IF EXISTS payouts_status_check;

ALTER TABLE public.payouts
  ADD CONSTRAINT payouts_status_check
  CHECK (status IN ('pending','approved','processing','paid','rejected','failed'));

-- ─── 5. referral_events: add cancelled/refunded event types ─────────────────
ALTER TABLE public.referral_events
  DROP CONSTRAINT IF EXISTS referral_events_event_type_check;

ALTER TABLE public.referral_events
  ADD CONSTRAINT referral_events_event_type_check
  CHECK (event_type IN ('click','signup','trial','paid','churned','cancelled','refunded'));

-- ─── 6. Performance indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS affiliates_referral_code_idx
  ON public.affiliates (referral_code);

CREATE INDEX IF NOT EXISTS affiliates_user_id_idx
  ON public.affiliates (user_id);

CREATE INDEX IF NOT EXISTS referral_events_affiliate_id_idx
  ON public.referral_events (affiliate_id);

CREATE INDEX IF NOT EXISTS referral_events_referred_user_idx
  ON public.referral_events (referred_user);

CREATE UNIQUE INDEX IF NOT EXISTS referral_events_invoice_idempotency_idx
  ON public.referral_events (stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL AND event_type = 'paid';

CREATE INDEX IF NOT EXISTS payouts_affiliate_id_idx
  ON public.payouts (affiliate_id);

CREATE INDEX IF NOT EXISTS profiles_referred_by_idx
  ON public.profiles (referred_by)
  WHERE referred_by IS NOT NULL;

-- ─── 7. RLS: service-role writes to referral_events + affiliates ─────────────
-- Service role bypasses RLS by default, but ensure authenticated can't self-insert
-- commissions (only edge functions via service role should insert paid events).

-- Affiliates: admin can view all
CREATE POLICY affiliates_admin_all ON public.affiliates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Payouts: admin can update (approve/reject)
CREATE POLICY payouts_admin_all ON public.payouts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Referral events: admin read
CREATE POLICY events_admin_all ON public.referral_events
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
