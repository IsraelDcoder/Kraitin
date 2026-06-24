CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tier           subscription_tier := 'free'::subscription_tier;
  v_status         text              := 'expired';
  v_reports_limit  int               := 3;
  v_username       text              := NEW.raw_user_meta_data->>'username';
  v_founder_emails text[]            := ARRAY['eazy50099@gmail.com', 'theonyekachithompson@gmail.com'];
BEGIN
  -- Upsert profile row (username from signup metadata)
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (NEW.id, NEW.email, v_username, 'user'::user_role)
  ON CONFLICT (id) DO UPDATE
    SET email    = EXCLUDED.email,
        username = COALESCE(EXCLUDED.username, profiles.username);

  -- Founder tier for whitelisted emails
  IF NEW.email = ANY(v_founder_emails) THEN
    v_tier          := 'founder'::subscription_tier;
    v_status        := 'active';
    v_reports_limit := 99999;
  END IF;

  -- Upsert subscription row
  INSERT INTO public.subscriptions (user_id, tier, status, reports_limit)
  VALUES (NEW.id, v_tier, v_status, v_reports_limit)
  ON CONFLICT (user_id) DO UPDATE
    SET tier          = EXCLUDED.tier,
        status        = EXCLUDED.status,
        reports_limit = EXCLUDED.reports_limit,
        updated_at    = now();

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but never block signup
    RAISE WARNING 'handle_new_user failed for user %: % %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;