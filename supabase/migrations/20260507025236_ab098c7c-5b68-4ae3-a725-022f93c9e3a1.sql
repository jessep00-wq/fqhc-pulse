-- Revoke EXECUTE on SECURITY DEFINER functions from anon and public
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_founder_admin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_org_id(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.prevent_org_id_change() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_org_subscription() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.seed_demo_data(uuid) FROM anon, public;

-- Fix overly permissive INSERT on organizations (WITH CHECK true → owner must be caller)
DROP POLICY IF EXISTS "Users can create orgs" ON public.organizations;
CREATE POLICY "Users can create orgs"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Add SELECT policy for org members on usage_events
CREATE POLICY "Org members can read own usage events"
ON public.usage_events
FOR SELECT
TO authenticated
USING (organization_id = get_user_org_id(auth.uid()));