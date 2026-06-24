-- 1. Update handle_new_user to auto-grant founder tier for the founder email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tier text := 'free';
  v_status text := 'active';
  v_reports_limit int := 3;
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;

  -- Founder email gets unlimited active subscription
  IF NEW.email = 'eazy50099@gmail.com' THEN
    v_tier           := 'founder';
    v_status         := 'active';
    v_reports_limit  := 99999;
  ELSE
    v_status := 'expired';
  END IF;

  INSERT INTO public.subscriptions (user_id, tier, status, reports_limit)
  VALUES (NEW.id, v_tier, v_status, v_reports_limit)
  ON CONFLICT (user_id) DO UPDATE
    SET tier           = EXCLUDED.tier,
        status         = EXCLUDED.status,
        reports_limit  = EXCLUDED.reports_limit;

  RETURN NEW;
END;
$$;

-- 2. Create a function to upsert founder access (used below and callable anytime)
CREATE OR REPLACE FUNCTION public.grant_founder_access(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
  IF v_user_id IS NULL THEN RETURN; END IF;

  UPDATE public.subscriptions
  SET tier          = 'founder',
      status        = 'active',
      reports_limit = 99999,
      updated_at    = now()
  WHERE user_id = v_user_id;

  UPDATE public.profiles
  SET role = 'admin', updated_at = now()
  WHERE id = v_user_id;
END;
$$;