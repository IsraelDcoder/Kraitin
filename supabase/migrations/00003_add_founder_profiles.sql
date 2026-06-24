
-- Founder onboarding profiles table
CREATE TABLE founder_profiles (
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
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add onboarding_completed flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- RLS
ALTER TABLE founder_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own founder profile"
  ON founder_profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_founder_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER founder_profiles_updated_at
  BEFORE UPDATE ON founder_profiles
  FOR EACH ROW EXECUTE FUNCTION update_founder_profiles_updated_at();
