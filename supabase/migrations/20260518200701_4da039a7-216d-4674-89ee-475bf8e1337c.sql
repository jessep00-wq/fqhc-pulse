CREATE TABLE public.playbook_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  work_email text NOT NULL,
  health_center_name text NOT NULL,
  role text NOT NULL,
  source text NOT NULL DEFAULT 'AthenaOne Playbook',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_playbook_leads_source_created ON public.playbook_leads (source, created_at DESC);

ALTER TABLE public.playbook_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a playbook lead"
  ON public.playbook_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Founder admins can read playbook leads"
  ON public.playbook_leads FOR SELECT
  TO authenticated
  USING (public.is_founder_admin(auth.uid()));