-- Persist username from auth metadata into profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tier          text    := 'free';
  v_status        text    := 'expired';
  v_reports_limit int     := 3;
  v_username      text    := NEW.raw_user_meta_data->>'username';
  v_founder_emails text[] := ARRAY['eazy50099@gmail.com', 'theonyekachithompson@gmail.com'];
BEGIN
  -- Upsert profile with real username
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (NEW.id, NEW.email, v_username, 'user')
  ON CONFLICT (id) DO UPDATE
    SET email    = EXCLUDED.email,
        username = COALESCE(EXCLUDED.username, public.profiles.username);

  -- Founder tier for whitelisted emails
  IF NEW.email = ANY(v_founder_emails) THEN
    v_tier          := 'founder';
    v_status        := 'active';
    v_reports_limit := 99999;
  END IF;

  INSERT INTO public.subscriptions (user_id, tier, status, reports_limit)
  VALUES (NEW.id, v_tier, v_status, v_reports_limit)
  ON CONFLICT (user_id) DO UPDATE
    SET tier          = EXCLUDED.tier,
        status        = EXCLUDED.status,
        reports_limit = EXCLUDED.reports_limit;

  RETURN NEW;
END;
$$;