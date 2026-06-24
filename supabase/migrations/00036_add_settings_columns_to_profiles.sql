
-- Add personalisation columns to profiles for all settings pages
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS founder_prefs        jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS workspace_settings   jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS opportunity_prefs    jsonb NOT NULL DEFAULT '{}';

-- Back-fill existing rows
UPDATE public.profiles
SET
  founder_prefs      = '{}',
  workspace_settings = '{}',
  opportunity_prefs  = '{}'
WHERE founder_prefs IS NULL
   OR workspace_settings IS NULL
   OR opportunity_prefs IS NULL;
