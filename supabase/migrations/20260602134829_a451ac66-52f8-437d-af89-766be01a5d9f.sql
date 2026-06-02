
CREATE POLICY "Org members read ai-governance evidence" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'ai-governance-evidence'
  AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
);

CREATE POLICY "Org members upload ai-governance evidence" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'ai-governance-evidence'
  AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
);

CREATE POLICY "Org members update ai-governance evidence" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'ai-governance-evidence'
  AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
);

CREATE POLICY "Org members delete ai-governance evidence" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'ai-governance-evidence'
  AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
);

CREATE POLICY "Founder admins all ai-governance evidence" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'ai-governance-evidence' AND is_founder_admin(auth.uid()))
WITH CHECK (bucket_id = 'ai-governance-evidence' AND is_founder_admin(auth.uid()));
