
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS guide_seen boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.guide_seen IS 'True once the user has dismissed/completed the first-time onboarding guide. Synced across devices.';
