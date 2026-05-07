-- Allow org members to read profiles within their organization
CREATE POLICY "Org members can read co-worker profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));