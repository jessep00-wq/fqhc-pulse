
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  cover_emoji TEXT DEFAULT '📋',
  content_md TEXT NOT NULL DEFAULT '',
  read_time_minutes INTEGER NOT NULL DEFAULT 5,
  author_name TEXT NOT NULL DEFAULT 'Jessica Smith, RN, BSN',
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published blog posts"
ON public.blog_posts FOR SELECT
TO public
USING (status = 'published' AND published_at IS NOT NULL);

CREATE POLICY "Founder admins manage blog posts"
ON public.blog_posts FOR ALL
TO authenticated
USING (is_founder_admin(auth.uid()))
WITH CHECK (is_founder_admin(auth.uid()));

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_blog_posts_published ON public.blog_posts(status, published_at DESC);
