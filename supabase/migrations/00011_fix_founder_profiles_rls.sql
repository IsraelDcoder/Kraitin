
-- Ensure founder_profiles exists in public schema with correct RLS
CREATE TABLE IF NOT EXISTS public.founder_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interests text[] NOT NULL DEFAULT '{}',
  founder_type text NOT NULL DEFAULT '',
  primary_goal text NOT NULL DEFAULT '',
  experience_level text NOT NULL DEFAULT 'beginner',
  launch_budget text NOT NULL DEFAULT '',
  build_preference text NOT NULL DEFAULT '',
  biggest_struggle text NOT NULL DEFAULT '',
  founder_archetype text NOT NULL DEFAULT '',
  strengths text[] NOT NULL DEFAULT '{}',
  weaknesses text[] NOT NULL DEFAULT '{}',
  recommended_categories text[] NOT NULL DEFAULT '{}',
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS (idempotent)
ALTER TABLE public.founder_profiles ENABLE ROW LEVEL SECURITY;

-- Drop + recreate policies to ensure clean state
DROP POLICY IF EXISTS "Users can manage own founder profile" ON public.founder_profiles;
DROP POLICY IF EXISTS "founder_profiles_all_authenticated" ON public.founder_profiles;

CREATE POLICY "founder_profiles_all_authenticated"
  ON public.founder_profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Ensure updated_at trigger exists
CREATE OR REPLACE FUNCTION public.update_founder_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS founder_profiles_updated_at ON public.founder_profiles;
CREATE TRIGGER founder_profiles_updated_at
  BEFORE UPDATE ON public.founder_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_founder_profiles_updated_at();

-- Index for fast user lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_founder_profiles_user_id
  ON public.founder_profiles (user_id);
