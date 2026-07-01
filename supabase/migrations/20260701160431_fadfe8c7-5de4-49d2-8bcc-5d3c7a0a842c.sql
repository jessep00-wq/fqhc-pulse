
ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS hero_image_url text;
ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS hero_icon text;
ALTER TABLE public.store_bundles ADD COLUMN IF NOT EXISTS hero_image_url text;
ALTER TABLE public.store_bundles ADD COLUMN IF NOT EXISTS hero_icon text;
