
-- Create UDS targets table for measure goal tracking
CREATE TABLE public.uds_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  measure_id TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (organization_id, measure_id)
);

-- Enable RLS
ALTER TABLE public.uds_targets ENABLE ROW LEVEL SECURITY;

-- Policies scoped to organization
CREATE POLICY "Users can read org targets"
  ON public.uds_targets FOR SELECT
  TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can insert org targets"
  ON public.uds_targets FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can update org targets"
  ON public.uds_targets FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()))
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can delete org targets"
  ON public.uds_targets FOR DELETE
  TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
