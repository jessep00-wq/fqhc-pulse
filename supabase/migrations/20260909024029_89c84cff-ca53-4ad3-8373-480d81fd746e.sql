CREATE TABLE public.store_waitlist_signups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  product_slug text NOT NULL,
  intent text NOT NULL DEFAULT 'waitlist',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.store_waitlist_signups TO anon;
GRANT SELECT, INSERT ON public.store_waitlist_signups TO authenticated;
GRANT ALL ON public.store_waitlist_signups TO service_role;

ALTER TABLE public.store_waitlist_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can sign up for a product waitlist"
  ON public.store_waitlist_signups FOR INSERT TO anon, authenticated
  WITH CHECK (email <> '' AND product_slug <> '');

CREATE POLICY "Founder admins can read waitlist signups"
  ON public.store_waitlist_signups FOR SELECT TO authenticated
  USING (public.is_founder_admin(auth.uid()));

CREATE INDEX store_waitlist_signups_slug_idx ON public.store_waitlist_signups (product_slug, created_at DESC);

ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS sample_file_url text,
  ADD COLUMN IF NOT EXISTS faqs jsonb NOT NULL DEFAULT '[]'::jsonb;