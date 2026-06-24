
-- 1. Add weekly digest opt-in column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_digest_emails boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.weekly_digest_emails IS 'Whether the user receives the Sunday weekly recap email.';

-- 2. Schedule weekly digest every Sunday at 07:00 UTC
SELECT cron.unschedule('kraitin-weekly-digest') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'kraitin-weekly-digest'
);

SELECT cron.schedule(
  'kraitin-weekly-digest',
  '0 7 * * 0',
  $$
  SELECT net.http_post(
    url    := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/weekly-digest',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body   := '{"scheduled":true}'::jsonb
  );
  $$
);
