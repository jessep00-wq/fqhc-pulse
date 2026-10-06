DROP POLICY IF EXISTS "Anyone can submit a playbook lead" ON public.playbook_leads;
CREATE POLICY "Anyone can submit a playbook lead" ON public.playbook_leads
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(full_name)) BETWEEN 1 AND 200
  AND length(work_email) BETWEEN 3 AND 320
  AND work_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(btrim(health_center_name)) BETWEEN 1 AND 300
  AND length(btrim(role)) BETWEEN 1 AND 200
  AND length(source) <= 100
  AND notes IS NULL
  AND nurture_step = 0
  AND welcome_sent_at IS NULL AND reminder_sent_at IS NULL AND last_nurture_sent_at IS NULL
);

DROP POLICY IF EXISTS "Public can read content icons" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product previews" ON storage.objects;
DROP POLICY IF EXISTS "Public read email-assets" ON storage.objects;
CREATE POLICY "Founders can list public asset buckets" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id IN ('content-icons','product-previews','email-assets') AND public.is_founder_admin(auth.uid()));