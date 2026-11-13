CREATE OR REPLACE FUNCTION public.org_workspace_readable(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _org_id IS NOT NULL
    AND _org_id = public.get_user_org_id(auth.uid())
    AND (
      public.org_access_status(_org_id) <> 'locked'
      OR EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE organization_id = _org_id
          AND plan <> 'free'
          AND status = 'canceled'
          AND current_period_end IS NOT NULL
          AND current_period_end > now()
      )
    );
$$;

REVOKE EXECUTE ON FUNCTION public.org_workspace_readable(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.org_workspace_readable(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can read org cycles" ON public.pdsa_cycles;
CREATE POLICY "Users can read org cycles" ON public.pdsa_cycles
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()) AND public.org_workspace_readable(organization_id));

DROP POLICY IF EXISTS "Users can read org tasks" ON public.tasks;
CREATE POLICY "Users can read org tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()) AND public.org_workspace_readable(organization_id));

DROP POLICY IF EXISTS "Users can read org sites" ON public.sites;
CREATE POLICY "Users can read org sites" ON public.sites
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()) AND public.org_workspace_readable(organization_id));