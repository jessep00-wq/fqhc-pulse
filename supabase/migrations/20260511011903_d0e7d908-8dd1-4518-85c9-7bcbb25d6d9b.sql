
ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS buyer_guidance text,
  ADD COLUMN IF NOT EXISTS preview_image_urls text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.store_bundles
  ADD COLUMN IF NOT EXISTS buyer_guidance text,
  ADD COLUMN IF NOT EXISTS preview_image_urls text[] NOT NULL DEFAULT '{}';

UPDATE public.store_products SET buyer_guidance = CASE slug
  WHEN 'uds-measure-template-pack' THEN 'Best if you''re behind on a clinical measure'
  WHEN 'qi-committee-packet' THEN 'Best if your QI meetings feel unstructured'
  WHEN 'board-quality-report' THEN 'Best for your next board quarterly'
  WHEN 'hypertension-pdsa-bundle' THEN 'Best if hypertension control is stuck'
  WHEN 'diabetes-a1c-pdsa-bundle' THEN 'Best if A1c poor control is stuck'
  ELSE buyer_guidance
END
WHERE slug IN ('uds-measure-template-pack','qi-committee-packet','board-quality-report','hypertension-pdsa-bundle','diabetes-a1c-pdsa-bundle');

UPDATE public.store_bundles SET buyer_guidance = CASE slug
  WHEN 'governance-bundle' THEN 'Best for new QI Directors stepping into the role'
  WHEN 'pdsa-improvement-bundle' THEN 'Best when you have 60 days to move a measure'
  ELSE buyer_guidance
END
WHERE slug IN ('governance-bundle','pdsa-improvement-bundle');

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-previews', 'product-previews', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view product previews" ON storage.objects;
CREATE POLICY "Anyone can view product previews"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-previews');

DROP POLICY IF EXISTS "Founder admins upload product previews" ON storage.objects;
CREATE POLICY "Founder admins upload product previews"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-previews' AND public.is_founder_admin(auth.uid()));

DROP POLICY IF EXISTS "Founder admins update product previews" ON storage.objects;
CREATE POLICY "Founder admins update product previews"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-previews' AND public.is_founder_admin(auth.uid()));

DROP POLICY IF EXISTS "Founder admins delete product previews" ON storage.objects;
CREATE POLICY "Founder admins delete product previews"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-previews' AND public.is_founder_admin(auth.uid()));
