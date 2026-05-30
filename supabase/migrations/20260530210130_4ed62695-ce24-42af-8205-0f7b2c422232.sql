
-- 1. Create store_product_files (admin/server only)
CREATE TABLE public.store_product_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.store_products(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_product_files TO authenticated;
GRANT ALL ON public.store_product_files TO service_role;

ALTER TABLE public.store_product_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founder admins manage product files"
  ON public.store_product_files
  FOR ALL
  TO authenticated
  USING (public.is_founder_admin(auth.uid()))
  WITH CHECK (public.is_founder_admin(auth.uid()));

CREATE INDEX store_product_files_product_id_idx ON public.store_product_files(product_id);

-- 2. Migrate existing data
INSERT INTO public.store_product_files (product_id, file_path, sort_order)
SELECT id, path, ord
FROM public.store_products,
     LATERAL unnest(included_file_paths) WITH ORDINALITY AS u(path, ord)
WHERE included_file_paths IS NOT NULL AND array_length(included_file_paths, 1) > 0;

-- 3. Add public-safe file_count
ALTER TABLE public.store_products ADD COLUMN file_count int NOT NULL DEFAULT 0;
UPDATE public.store_products
  SET file_count = COALESCE(array_length(included_file_paths, 1), 0);

-- 4. Keep file_count in sync via trigger
CREATE OR REPLACE FUNCTION public.sync_store_product_file_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid uuid;
BEGIN
  pid := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.store_products
    SET file_count = (SELECT count(*) FROM public.store_product_files WHERE product_id = pid)
  WHERE id = pid;
  RETURN NULL;
END;
$$;

CREATE TRIGGER store_product_files_count_sync
AFTER INSERT OR DELETE OR UPDATE OF product_id ON public.store_product_files
FOR EACH ROW EXECUTE FUNCTION public.sync_store_product_file_count();

-- 5. Drop the publicly readable column
ALTER TABLE public.store_products DROP COLUMN included_file_paths;

-- 6. Restrict organizations UPDATE to owner only
DROP POLICY IF EXISTS "Users can update own org" ON public.organizations;
CREATE POLICY "Org owners can update own org"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 7. Remove duplicate public-role policy on account_health_snapshots
DROP POLICY IF EXISTS "org members can read own snapshots" ON public.account_health_snapshots;
