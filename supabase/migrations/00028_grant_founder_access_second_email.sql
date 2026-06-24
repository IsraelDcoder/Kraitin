-- Update handle_new_user to cover both founder emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tier          text := 'free';
  v_status        text := 'expired';
  v_reports_limit int  := 3;
  v_founder_emails text[] := ARRAY['eazy50099@gmail.com', 'theonyekachithompson@gmail.com'];
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;

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

-- Grant immediate access if the account already exists
DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'theonyekachithompson@gmail.com' LIMIT 1;
  IF v_uid IS NOT NULL THEN
    UPDATE public.subscriptions
    SET tier = 'founder', status = 'active', reports_limit = 99999, updated_at = now()
    WHERE user_id = v_uid;
    UPDATE public.profiles SET role = 'admin', updated_at = now() WHERE id = v_uid;
  END IF;
END $$;