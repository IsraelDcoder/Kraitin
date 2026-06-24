
-- ── affiliates ──────────────────────────────────────────────────────────────
-- One row per affiliate account (linked to auth.users)
CREATE TABLE affiliates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code       text UNIQUE NOT NULL,
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','active','suspended')),
  total_clicks        integer NOT NULL DEFAULT 0,
  total_signups       integer NOT NULL DEFAULT 0,
  total_trials        integer NOT NULL DEFAULT 0,
  total_paid          integer NOT NULL DEFAULT 0,
  total_commission    numeric(10,2) NOT NULL DEFAULT 0,
  lifetime_earnings   numeric(10,2) NOT NULL DEFAULT 0,
  conversion_rate     numeric(5,2) NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- ── referral_events ─────────────────────────────────────────────────────────
-- Every tracked event for an affiliate's link
CREATE TABLE referral_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id    uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  event_type      text NOT NULL
                    CHECK (event_type IN ('click','signup','trial','paid','churned')),
  referred_user   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount          numeric(10,2),          -- commission amount if event_type='paid'
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── payouts ──────────────────────────────────────────────────────────────────
-- Monthly payout records
CREATE TABLE payouts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id    uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount          numeric(10,2) NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','paid','failed')),
  period_start    date NOT NULL,
  period_end      date NOT NULL,
  paid_at         timestamptz,
  payment_method  text,
  transaction_id  text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── updated_at triggers ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER affiliates_updated_at
  BEFORE UPDATE ON affiliates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER payouts_updated_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE affiliates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts          ENABLE ROW LEVEL SECURITY;

-- affiliates: own row only
CREATE POLICY "affiliates_select_own"  ON affiliates FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "affiliates_insert_own"  ON affiliates FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "affiliates_update_own"  ON affiliates FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- referral_events: read own events via affiliate_id
CREATE OR REPLACE FUNCTION get_affiliate_id_for_user(uid uuid)
RETURNS uuid LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id FROM affiliates WHERE user_id = uid LIMIT 1;
$$;

CREATE POLICY "events_select_own" ON referral_events FOR SELECT TO authenticated
  USING (affiliate_id = get_affiliate_id_for_user(auth.uid()));

-- payouts: read own payouts
CREATE POLICY "payouts_select_own" ON payouts FOR SELECT TO authenticated
  USING (affiliate_id = get_affiliate_id_for_user(auth.uid()));

-- anon: no access
CREATE POLICY "affiliates_anon_none"      ON affiliates       FOR ALL TO anon USING (false);
CREATE POLICY "events_anon_none"          ON referral_events  FOR ALL TO anon USING (false);
CREATE POLICY "payouts_anon_none"         ON payouts          FOR ALL TO anon USING (false);

-- ── seed demo data (no personal info) ───────────────────────────────────────
-- Demo payouts will be inserted per-user at runtime; seed only referral_event structure is documented.
