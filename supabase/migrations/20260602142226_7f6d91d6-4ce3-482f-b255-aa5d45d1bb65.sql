
CREATE POLICY "Org members read evidence-binder files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evidence-binder' AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text);

CREATE POLICY "Org members upload evidence-binder files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence-binder' AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text);

CREATE POLICY "Org members update evidence-binder files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'evidence-binder' AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text);

CREATE POLICY "Org members delete evidence-binder files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'evidence-binder' AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text);

CREATE POLICY "Founder admins manage evidence-binder files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'evidence-binder' AND is_founder_admin(auth.uid()))
  WITH CHECK (bucket_id = 'evidence-binder' AND is_founder_admin(auth.uid()));
