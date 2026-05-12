
-- Add image url columns
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE public.newsletters ADD COLUMN IF NOT EXISTS hero_image_url text;

-- Create public storage bucket for content icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-icons', 'content-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can read content icons"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-icons');

CREATE POLICY "Founder admins can upload content icons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content-icons' AND public.is_founder_admin(auth.uid()));

CREATE POLICY "Founder admins can update content icons"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'content-icons' AND public.is_founder_admin(auth.uid()));

CREATE POLICY "Founder admins can delete content icons"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'content-icons' AND public.is_founder_admin(auth.uid()));
