
-- ============ Catalog ============
CREATE TABLE public.store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'draft', -- draft | published | archived
  hero_emoji text DEFAULT '📋',
  short_description text,
  long_description text,
  bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  whats_inside jsonb NOT NULL DEFAULT '[]'::jsonb,
  who_its_for jsonb NOT NULL DEFAULT '[]'::jsonb,
  uds_framing text,
  included_file_paths text[] NOT NULL DEFAULT '{}',
  sample_preview_url text,
  stripe_product_id text,
  stripe_price_id text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.store_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  short_description text,
  long_description text,
  hero_emoji text DEFAULT '🎁',
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'draft',
  included_product_ids uuid[] NOT NULL DEFAULT '{}',
  stripe_product_id text,
  stripe_price_id text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads published products" ON public.store_products
  FOR SELECT USING (status = 'published');
CREATE POLICY "Founder admins manage products" ON public.store_products
  FOR ALL TO authenticated
  USING (is_founder_admin(auth.uid()))
  WITH CHECK (is_founder_admin(auth.uid()));

CREATE POLICY "Anyone reads published bundles" ON public.store_bundles
  FOR SELECT USING (status = 'published');
CREATE POLICY "Founder admins manage bundles" ON public.store_bundles
  FOR ALL TO authenticated
  USING (is_founder_admin(auth.uid()))
  WITH CHECK (is_founder_admin(auth.uid()));

CREATE TRIGGER trg_store_products_updated_at BEFORE UPDATE ON public.store_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_store_bundles_updated_at BEFORE UPDATE ON public.store_bundles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Orders ============
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text UNIQUE,
  stripe_payment_intent_id text,
  customer_email text NOT NULL,
  product_ids uuid[] NOT NULL DEFAULT '{}',
  bundle_ids uuid[] NOT NULL DEFAULT '{}',
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending', -- pending | paid | refunded | failed
  download_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.download_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  downloaded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founder admins read orders" ON public.orders
  FOR SELECT TO authenticated USING (is_founder_admin(auth.uid()));
CREATE POLICY "Founder admins read download log" ON public.download_log
  FOR SELECT TO authenticated USING (is_founder_admin(auth.uid()));

-- ============ Storage bucket (private) ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-files', 'product-files', false)
ON CONFLICT (id) DO NOTHING;

-- Founder admins can manage files in the bucket
CREATE POLICY "Founder admins manage product files"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'product-files' AND is_founder_admin(auth.uid()))
WITH CHECK (bucket_id = 'product-files' AND is_founder_admin(auth.uid()));
