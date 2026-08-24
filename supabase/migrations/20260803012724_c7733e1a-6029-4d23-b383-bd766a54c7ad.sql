CREATE TABLE public.pdsa_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  pdsa_cycle_id uuid,
  status text NOT NULL DEFAULT 'draft',
  current_step text NOT NULL DEFAULT 'template',
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdsa_drafts TO authenticated;
GRANT ALL ON public.pdsa_drafts TO service_role;

ALTER TABLE public.pdsa_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own PDSA drafts"
  ON public.pdsa_drafts FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Users can create their own PDSA drafts"
  ON public.pdsa_drafts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Users can update their own PDSA drafts"
  ON public.pdsa_drafts FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND organization_id = public.get_user_org_id(auth.uid()))
  WITH CHECK (user_id = auth.uid() AND organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Users can delete their own PDSA drafts"
  ON public.pdsa_drafts FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND organization_id = public.get_user_org_id(auth.uid()));

CREATE INDEX idx_pdsa_drafts_user_status ON public.pdsa_drafts (user_id, status, updated_at DESC);

CREATE TRIGGER update_pdsa_drafts_updated_at
  BEFORE UPDATE ON public.pdsa_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();