CREATE TABLE public.marketing_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL DEFAULT 'linkedin',
  topic text NOT NULL,
  hook text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  link_url text,
  hashtags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ready','posted','archived')),
  posted_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_posts TO authenticated;
GRANT ALL ON public.marketing_posts TO service_role;
ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Founder admins manage marketing posts" ON public.marketing_posts
  FOR ALL TO authenticated
  USING (public.is_founder_admin(auth.uid()))
  WITH CHECK (public.is_founder_admin(auth.uid()));
CREATE TRIGGER marketing_posts_updated_at BEFORE UPDATE ON public.marketing_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();