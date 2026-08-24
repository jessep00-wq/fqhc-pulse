CREATE TABLE public.osv_quiz_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  organization text NOT NULL,
  job_title text NOT NULL,
  phone text,
  consent boolean NOT NULL DEFAULT false,
  score int NOT NULL,
  tier text NOT NULL CHECK (tier IN ('red','yellow','green')),
  answers jsonb NOT NULL,
  page_url text,
  utm jsonb,
  user_agent text
);
GRANT INSERT ON public.osv_quiz_leads TO anon, authenticated;
GRANT SELECT ON public.osv_quiz_leads TO authenticated;
GRANT ALL ON public.osv_quiz_leads TO service_role;
ALTER TABLE public.osv_quiz_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon and auth can insert osv quiz leads" ON public.osv_quiz_leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "founder admin can read osv quiz leads" ON public.osv_quiz_leads
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'founder_admin'));
CREATE INDEX osv_quiz_leads_created_at_idx ON public.osv_quiz_leads (created_at DESC);
CREATE INDEX osv_quiz_leads_email_idx ON public.osv_quiz_leads (email);