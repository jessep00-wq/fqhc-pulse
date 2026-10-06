CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  organization_name text,
  role text,
  fqhc_size text,
  number_of_sites text,
  emr text,
  timeline text,
  interests text[] NOT NULL DEFAULT '{}',
  message text,
  topic text,
  admin_email_status text,
  confirmation_email_status text,
  nurture_step integer NOT NULL DEFAULT 0,
  last_nurture_sent_at timestamptz,
  unsubscribed_at timestamptz,
  followed_up_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.contact_submissions TO authenticated;
GRANT ALL ON public.contact_submissions TO service_role;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Founder admins can view contact submissions" ON public.contact_submissions FOR SELECT TO authenticated USING (public.is_founder_admin(auth.uid()));
CREATE POLICY "Founder admins can update contact submissions" ON public.contact_submissions FOR UPDATE TO authenticated USING (public.is_founder_admin(auth.uid())) WITH CHECK (public.is_founder_admin(auth.uid()));
CREATE INDEX contact_submissions_created_idx ON public.contact_submissions (created_at DESC);
CREATE INDEX contact_submissions_email_idx ON public.contact_submissions (lower(email));