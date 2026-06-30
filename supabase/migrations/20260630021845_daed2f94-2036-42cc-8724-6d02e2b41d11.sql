
-- 1) Newsletter: remove anon INSERT; all subscriptions must go through the
--    subscribe-newsletter edge function (service role) which enforces rate limits.
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;

-- 2) Store product files: add defense-in-depth SELECT for verified buyers
--    (auth.users.email matches a paid order containing the product directly
--    or via a purchased bundle). Founder admin policy already exists.
CREATE POLICY "Buyers can read purchased product files"
ON public.store_product_files
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.status = 'paid'
      AND lower(o.customer_email) = lower((auth.jwt() ->> 'email'))
      AND (
        store_product_files.product_id = ANY(o.product_ids)
        OR EXISTS (
          SELECT 1 FROM public.store_bundles b
          WHERE b.id = ANY(o.bundle_ids)
            AND store_product_files.product_id = ANY(b.included_product_ids)
        )
      )
  )
);

-- 3) Storage: add buyer SELECT policy on product-files bucket as defense-in-depth
--    alongside signed-URL delivery from edge functions. File path convention is
--    "<product_id>/...", so we match the first path segment to a purchased product.
DROP POLICY IF EXISTS "Buyers can read purchased product files storage" ON storage.objects;
CREATE POLICY "Buyers can read purchased product files storage"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-files'
  AND EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.status = 'paid'
      AND lower(o.customer_email) = lower((auth.jwt() ->> 'email'))
      AND (
        (split_part(storage.objects.name, '/', 1))::uuid = ANY(o.product_ids)
        OR EXISTS (
          SELECT 1 FROM public.store_bundles b
          WHERE b.id = ANY(o.bundle_ids)
            AND (split_part(storage.objects.name, '/', 1))::uuid = ANY(b.included_product_ids)
        )
      )
  )
);
