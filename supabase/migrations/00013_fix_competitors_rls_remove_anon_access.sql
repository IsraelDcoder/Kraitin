
-- Remove any existing anon/public read policies on competitors table
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'competitors' AND schemaname = 'public'
      AND (roles @> ARRAY['anon']::name[] OR roles @> ARRAY['public']::name[])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.competitors', pol.policyname);
  END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

-- Authenticated users with active subscription can read competitors
DROP POLICY IF EXISTS "competitors_select_subscribed" ON public.competitors;
CREATE POLICY "competitors_select_subscribed" ON public.competitors
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = auth.uid()
        AND s.status IN ('active', 'trialing')
    )
  );

-- Service role can do everything (for edge functions / admin)
DROP POLICY IF EXISTS "competitors_all_service" ON public.competitors;
CREATE POLICY "competitors_all_service" ON public.competitors
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Deny all anon access explicitly
DROP POLICY IF EXISTS "competitors_deny_anon" ON public.competitors;
CREATE POLICY "competitors_deny_anon" ON public.competitors
  FOR ALL TO anon
  USING (false)
  WITH CHECK (false);
