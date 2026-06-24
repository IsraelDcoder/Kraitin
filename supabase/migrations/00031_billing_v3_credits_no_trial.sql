
-- Add credits + period_start columns to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS monthly_credits   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_remaining INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;

-- Seed existing free users: status=active, no credits
UPDATE subscriptions
SET status = 'active', monthly_credits = 0, credits_remaining = 0
WHERE tier = 'free' OR tier IS NULL;

-- Seed existing pro/founder/starter users: 500 credits
UPDATE subscriptions
SET monthly_credits = 500, credits_remaining = 500
WHERE tier IN ('pro','founder','starter') AND credits_remaining = 0;

-- Ensure new signups always get free plan with active status
-- (handle_new_user trigger already inserts a row; update it to match new schema)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, onboarding_completed, onboarding_step)
  VALUES (NEW.id, NEW.email, false, 1)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscriptions (
    user_id, tier, status, monthly_credits, credits_remaining,
    reports_used_this_month, reports_limit
  ) VALUES (
    NEW.id, 'free', 'active', 0, 0, 0, 0
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
