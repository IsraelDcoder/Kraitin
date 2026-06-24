
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_email_sent boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.welcome_email_sent IS 'True once the one-time welcome email has been sent after guide completion. Prevents duplicate sends.';
