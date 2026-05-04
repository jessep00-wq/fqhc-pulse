-- Allow org members to update their organization
CREATE POLICY "Users can update own org"
  ON public.organizations FOR UPDATE TO authenticated
  USING (id = get_user_org_id(auth.uid()))
  WITH CHECK (id = get_user_org_id(auth.uid()));

-- Allow org members to update their UDS trends
CREATE POLICY "Users can update org trends"
  ON public.uds_trends FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()))
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

-- Allow org members to delete their UDS trends
CREATE POLICY "Users can delete org trends"
  ON public.uds_trends FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));