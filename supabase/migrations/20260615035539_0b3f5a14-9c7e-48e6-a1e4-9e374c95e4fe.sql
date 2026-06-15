-- HRSA SVP Readiness Score submissions: public lead-magnet capture.
CREATE TABLE public.readiness_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text NOT NULL,
  health_center text,
  state text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer NOT NULL,
  tier text NOT NULL,
  source text,
  user_agent text,
  email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Required grants — public can INSERT (anon lead capture), only admins SELECT.
GRANT INSERT ON public.readiness_submissions TO anon, authenticated;
GRANT SELECT, UPDATE ON public.readiness_submissions TO authenticated;
GRANT ALL ON public.readiness_submissions TO service_role;

ALTER TABLE public.readiness_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can insert a submission.
CREATE POLICY "Anyone can submit a readiness assessment"
  ON public.readiness_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(email) > 3
    AND char_length(first_name) > 0
    AND char_length(first_name) <= 80
    AND score >= 0 AND score <= 100
    AND tier IN ('at_risk','building','audit_ready')
  );

-- Only founder admins can read leads.
CREATE POLICY "Founder admins can read submissions"
  ON public.readiness_submissions
  FOR SELECT
  TO authenticated
  USING (public.is_founder_admin(auth.uid()));

-- Only founder admins can update (e.g. mark email_sent_at).
CREATE POLICY "Founder admins can update submissions"
  ON public.readiness_submissions
  FOR UPDATE
  TO authenticated
  USING (public.is_founder_admin(auth.uid()))
  WITH CHECK (public.is_founder_admin(auth.uid()));

CREATE INDEX idx_readiness_submissions_created ON public.readiness_submissions (created_at DESC);
CREATE INDEX idx_readiness_submissions_tier ON public.readiness_submissions (tier);
CREATE INDEX idx_readiness_submissions_email ON public.readiness_submissions (lower(email));