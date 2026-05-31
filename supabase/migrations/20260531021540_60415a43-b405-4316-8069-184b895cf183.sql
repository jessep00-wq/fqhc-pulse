
CREATE TABLE public.waitlist_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- contact
  name text NOT NULL,
  title text NOT NULL,
  organization text NOT NULL,
  state text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  -- org profile
  sites integer,
  ehr text,
  org_type text NOT NULL,
  -- urgency
  prompt_now text NOT NULL,
  -- qualifier
  primary_concern text,
  timing text,
  investment text,
  -- pipeline
  status text NOT NULL DEFAULT 'new',
  sequence_step integer NOT NULL DEFAULT 0,
  last_sequence_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_name_len   CHECK (char_length(name) BETWEEN 2 AND 160),
  CONSTRAINT waitlist_title_len  CHECK (char_length(title) BETWEEN 2 AND 160),
  CONSTRAINT waitlist_org_len    CHECK (char_length(organization) BETWEEN 2 AND 200),
  CONSTRAINT waitlist_state_len  CHECK (char_length(state) BETWEEN 2 AND 80),
  CONSTRAINT waitlist_email_fmt  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND char_length(email) <= 255),
  CONSTRAINT waitlist_phone_len  CHECK (char_length(phone) BETWEEN 7 AND 40),
  CONSTRAINT waitlist_prompt_len CHECK (char_length(prompt_now) BETWEEN 10 AND 4000),
  CONSTRAINT waitlist_status_enum CHECK (status IN ('new','contacted','declined','won')),
  CONSTRAINT waitlist_step_range CHECK (sequence_step BETWEEN 0 AND 10)
);

CREATE INDEX waitlist_applications_created_idx ON public.waitlist_applications (created_at DESC);
CREATE INDEX waitlist_applications_nurture_idx ON public.waitlist_applications (status, sequence_step);

GRANT INSERT ON public.waitlist_applications TO anon;
GRANT INSERT ON public.waitlist_applications TO authenticated;
GRANT ALL ON public.waitlist_applications TO service_role;

ALTER TABLE public.waitlist_applications ENABLE ROW LEVEL SECURITY;

-- Public can submit applications
CREATE POLICY "Anyone can submit a waitlist application"
  ON public.waitlist_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only founder admin can read/update/delete
CREATE POLICY "Founder admin can view waitlist applications"
  ON public.waitlist_applications
  FOR SELECT
  TO authenticated
  USING (public.is_founder_admin(auth.uid()));

CREATE POLICY "Founder admin can update waitlist applications"
  ON public.waitlist_applications
  FOR UPDATE
  TO authenticated
  USING (public.is_founder_admin(auth.uid()))
  WITH CHECK (public.is_founder_admin(auth.uid()));

CREATE POLICY "Founder admin can delete waitlist applications"
  ON public.waitlist_applications
  FOR DELETE
  TO authenticated
  USING (public.is_founder_admin(auth.uid()));

CREATE TRIGGER update_waitlist_applications_updated_at
  BEFORE UPDATE ON public.waitlist_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
