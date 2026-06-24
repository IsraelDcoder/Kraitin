
-- 1. Add digest opt-in column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS digest_emails boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.digest_emails IS 'Whether the user receives the daily 7am trending opportunities digest email.';

-- 2. Enable pg_cron extension (safe if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Enable pg_net extension for HTTP calls from cron
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 4. Schedule daily digest at 07:00 UTC every day
-- Remove existing job first to avoid duplicates on re-run
SELECT cron.unschedule('kraitin-daily-digest') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'kraitin-daily-digest'
);

SELECT cron.schedule(
  'kraitin-daily-digest',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url    := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/daily-digest',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body   := '{"scheduled":true}'::jsonb
  );
  $$
);
