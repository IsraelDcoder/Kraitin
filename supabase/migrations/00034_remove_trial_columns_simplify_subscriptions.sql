
-- Remove trial-related columns from subscriptions
ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS trial_ends_at,
  DROP COLUMN IF EXISTS trial_reminder_sent;

-- Ensure status enum no longer allows 'trialing' — update any trialing rows to 'active'
UPDATE public.subscriptions SET status = 'active' WHERE status = 'trialing';

-- Add credits_limit column if missing (alias for monthly_credits in PRD)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS credits_limit integer NOT NULL DEFAULT 500;

-- Sync credits_limit from monthly_credits where it exists
UPDATE public.subscriptions SET credits_limit = monthly_credits WHERE monthly_credits IS NOT NULL AND monthly_credits > 0;
