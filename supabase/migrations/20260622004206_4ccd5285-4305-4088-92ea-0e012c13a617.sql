
-- 1) Allow org members to delete their org's financial records
CREATE POLICY "Org members can delete their org financials"
ON public.org_financials
FOR DELETE
TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()));

-- 2) Allow org members to update files in pdsa-evidence bucket (scoped to org folder)
CREATE POLICY "Org members can update pdsa-evidence files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pdsa-evidence'
  AND (storage.foldername(name))[1] = public.get_user_org_id(auth.uid())::text
)
WITH CHECK (
  bucket_id = 'pdsa-evidence'
  AND (storage.foldername(name))[1] = public.get_user_org_id(auth.uid())::text
);

-- 3) Explicit service_role policy on subscriptions for Stripe webhook writes
CREATE POLICY "Service role manages subscriptions"
ON public.subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
