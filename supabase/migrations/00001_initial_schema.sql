
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Subscription tiers
CREATE TYPE public.subscription_tier AS ENUM ('free', 'starter', 'pro', 'founder');

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier public.subscription_tier NOT NULL DEFAULT 'free',
  reports_used_this_month integer NOT NULL DEFAULT 0,
  reports_limit integer NOT NULL DEFAULT 3,
  billing_cycle_start timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Opportunities table
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'AI',
  description text,
  revenue_estimate text,
  downloads text,
  growth_velocity text,
  growth_percent numeric,
  competition_score integer,
  opportunity_score integer,
  market_size text,
  tags text[] DEFAULT '{}',
  is_hidden_gem boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Competitors table
CREATE TABLE public.competitors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  category text,
  revenue_estimate text,
  downloads text,
  pricing text,
  monthly_traffic text,
  growth_percent numeric,
  seo_score integer,
  tiktok_followers text,
  youtube_subs text,
  instagram_followers text,
  ad_spend_estimate text,
  website_url text,
  app_store_url text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Market analysis table
CREATE TABLE public.market_analysis (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  query text NOT NULL,
  result_text text,
  sources jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Reports table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL, -- 'research','validation','competitor','mvp','launch'
  content jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Validation reports table
CREATE TABLE public.validation_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  idea text NOT NULL,
  demand_score integer,
  pain_score integer,
  competition_score integer,
  monetization_score integer,
  overall_score integer,
  recommendation text,
  pain_points jsonb DEFAULT '[]',
  feature_requests jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- MVP plans table
CREATE TABLE public.mvp_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  idea text NOT NULL,
  mvp_scope text,
  features jsonb DEFAULT '[]',
  user_stories jsonb DEFAULT '[]',
  db_schema text,
  tech_stack jsonb DEFAULT '[]',
  timeline_weeks integer,
  sprints jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Launch plans table
CREATE TABLE public.launch_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  idea text NOT NULL,
  seo_strategy text,
  content_ideas jsonb DEFAULT '[]',
  aso_keywords jsonb DEFAULT '[]',
  growth_loops jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Saved items table
CREATE TABLE public.saved_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL, -- 'opportunity','report','competitor'
  item_id uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Activity logs table
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== TRIGGERS =====

-- Auto-sync new users to profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  
  -- Create free subscription for new user
  INSERT INTO public.subscriptions (user_id, tier, reports_limit)
  VALUES (NEW.id, 'free', 3);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== RLS =====
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mvp_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.launch_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper: get user role
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS public.user_role
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM profiles WHERE id = uid; $$;

-- Profiles policies
CREATE POLICY "Admins full access profiles" ON public.profiles
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM get_user_role(auth.uid()));

-- Subscriptions policies
CREATE POLICY "Users view own subscription" ON public.subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own subscription" ON public.subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins full access subscriptions" ON public.subscriptions
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Opportunities - public read, admin write
CREATE POLICY "Anyone reads opportunities" ON public.opportunities
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon reads opportunities" ON public.opportunities
  FOR SELECT TO anon USING (true);
CREATE POLICY "Admins manage opportunities" ON public.opportunities
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Competitors - public read, admin write
CREATE POLICY "Anyone reads competitors" ON public.competitors
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon reads competitors" ON public.competitors
  FOR SELECT TO anon USING (true);
CREATE POLICY "Admins manage competitors" ON public.competitors
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Market analysis - user's own
CREATE POLICY "Users manage own market analysis" ON public.market_analysis
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Reports - user's own
CREATE POLICY "Users manage own reports" ON public.reports
  FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all reports" ON public.reports
  FOR SELECT TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Validation reports
CREATE POLICY "Users manage own validation reports" ON public.validation_reports
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- MVP plans
CREATE POLICY "Users manage own mvp plans" ON public.mvp_plans
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Launch plans
CREATE POLICY "Users manage own launch plans" ON public.launch_plans
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Saved items
CREATE POLICY "Users manage own saved items" ON public.saved_items
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Activity logs
CREATE POLICY "Users view own activity" ON public.activity_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own activity" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ===== SEED DATA =====

-- Seed opportunities
INSERT INTO public.opportunities (title, category, description, revenue_estimate, downloads, growth_velocity, growth_percent, competition_score, opportunity_score, market_size, tags, is_hidden_gem) VALUES
('AI Meal Scanner', 'AI', 'Scan food and get instant nutrition insights, meal plans, and calorie tracking using AI.', '$2.1M MRR', '450K', 'Explosive', 47.3, 32, 91, '$8.2B', ARRAY['AI','Health','Food'], true),
('Voice Study Coach', 'Education', 'An AI voice coach that quizzes students, adapts difficulty, and tracks learning progress.', '$850K MRR', '210K', 'Rising', 38.1, 41, 83, '$4.5B', ARRAY['Education','AI','Voice'], true),
('Legal Document AI', 'B2B SaaS', 'Automate contract review, clause extraction, and compliance checks for SMBs.', '$5.4M MRR', '87K', 'Steady', 22.6, 58, 76, '$12.8B', ARRAY['Legal','B2B SaaS','AI'], false),
('AI Companion App', 'Consumer', 'Emotional support and daily check-in companion powered by personalized AI.', '$3.2M MRR', '680K', 'Explosive', 62.4, 45, 88, '$6.1B', ARRAY['AI','Consumer','Mental Health'], true),
('B2B Cold Outreach AI', 'B2B SaaS', 'Generate hyper-personalized cold emails and LinkedIn messages at scale.', '$1.8M MRR', '42K', 'Rising', 29.7, 63, 74, '$3.4B', ARRAY['B2B SaaS','AI','Sales'], false),
('AI Fitness Coach', 'Health', 'Real-time form correction, adaptive workout plans, and recovery optimization.', '$4.1M MRR', '520K', 'Explosive', 54.2, 39, 87, '$9.7B', ARRAY['Health','AI','Fitness'], false),
('Productivity OS', 'Productivity', 'All-in-one workspace combining tasks, notes, calendar, and AI assistance.', '$7.3M MRR', '310K', 'Steady', 18.4, 72, 71, '$15.2B', ARRAY['Productivity','SaaS','AI'], false),
('AI Sleep Optimizer', 'Health', 'Track, analyze, and improve sleep quality with personalized AI recommendations.', '$920K MRR', '290K', 'Rising', 33.8, 36, 82, '$5.8B', ARRAY['Health','AI','Sleep'], true);

-- Seed competitors
INSERT INTO public.competitors (name, category, revenue_estimate, downloads, pricing, monthly_traffic, growth_percent, seo_score, tiktok_followers, youtube_subs, instagram_followers, ad_spend_estimate, website_url) VALUES
('Cal AI', 'Health', '$2.1M MRR', '4.2M', '$9.99/mo', '1.8M', 18.3, 72, '890K', '245K', '420K', '$85K/mo', 'https://cal.ai'),
('Bible Chat', 'Consumer', '$450K MRR', '1.8M', '$7.99/mo', '620K', 12.1, 58, '234K', '89K', '156K', '$22K/mo', 'https://biblechat.app'),
('BitePal', 'Health', '$320K MRR', '890K', 'Free + $4.99', '280K', 24.7, 45, '445K', '34K', '198K', '$41K/mo', 'https://bitepal.app'),
('Replika', 'Consumer', '$8.2M MRR', '18.5M', '$19.99/mo', '4.2M', 8.6, 84, '1.2M', '567K', '890K', '$210K/mo', 'https://replika.com'),
('Notion AI', 'Productivity', '$83M MRR', '35M', '$10/mo add-on', '28.4M', 22.3, 96, '2.4M', '1.1M', '1.8M', '$890K/mo', 'https://notion.so'),
('Duolingo', 'Education', '$214M MRR', '520M', '$7.99/mo', '98.3M', 14.2, 98, '8.7M', '4.2M', '6.1M', '$2.1M/mo', 'https://duolingo.com');
