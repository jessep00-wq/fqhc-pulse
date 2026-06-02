
-- 1. Extend pdsa_cycles
ALTER TABLE public.pdsa_cycles
  ADD COLUMN IF NOT EXISTS owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS baseline_rate numeric,
  ADD COLUMN IF NOT EXISTS predicted_outcome text,
  ADD COLUMN IF NOT EXISTS intervention_description text,
  ADD COLUMN IF NOT EXISTS actual_outcome text,
  ADD COLUMN IF NOT EXISTS next_cycle_decision text,
  ADD COLUMN IF NOT EXISTS next_cycle_id uuid,
  ADD COLUMN IF NOT EXISTS previous_cycle_id uuid,
  ADD COLUMN IF NOT EXISTS completeness_score integer NOT NULL DEFAULT 0;

ALTER TABLE public.pdsa_cycles
  DROP CONSTRAINT IF EXISTS pdsa_cycles_next_decision_chk;
ALTER TABLE public.pdsa_cycles
  ADD CONSTRAINT pdsa_cycles_next_decision_chk
  CHECK (next_cycle_decision IS NULL OR next_cycle_decision IN ('adapt','adopt','abandon'));

-- 2. Completeness trigger
CREATE OR REPLACE FUNCTION public.compute_pdsa_completeness()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  s integer := 0;
BEGIN
  IF NEW.owner_user_id IS NOT NULL THEN s := s + 10; END IF;
  IF NEW.start_date IS NOT NULL THEN s := s + 10; END IF;
  IF NEW.uds_measure IS NOT NULL AND length(NEW.uds_measure) > 0 THEN s := s + 15; END IF;
  IF NEW.baseline_rate IS NOT NULL THEN s := s + 10; END IF;
  IF NEW.predicted_outcome IS NOT NULL AND length(NEW.predicted_outcome) > 0 THEN s := s + 10; END IF;
  IF NEW.intervention_description IS NOT NULL AND length(NEW.intervention_description) > 0 THEN s := s + 10; END IF;
  IF NEW.aim_statement IS NOT NULL AND length(NEW.aim_statement) > 0 THEN s := s + 5; END IF;
  IF NEW.measurement_plan IS NOT NULL AND length(NEW.measurement_plan) > 0 THEN s := s + 5; END IF;
  IF NEW.status = 'completed' THEN
    IF NEW.actual_outcome IS NOT NULL AND length(NEW.actual_outcome) > 0 THEN s := s + 12; END IF;
    IF NEW.next_cycle_decision IS NOT NULL THEN s := s + 13; END IF;
  ELSE
    -- pro-rate close-out so in-flight cycles can still reach 100
    s := s + 25;
  END IF;
  IF s > 100 THEN s := 100; END IF;
  NEW.completeness_score := s;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pdsa_completeness_trg ON public.pdsa_cycles;
CREATE TRIGGER pdsa_completeness_trg
BEFORE INSERT OR UPDATE ON public.pdsa_cycles
FOR EACH ROW EXECUTE FUNCTION public.compute_pdsa_completeness();

-- Backfill scores
UPDATE public.pdsa_cycles SET title = title;

-- 3. Evidence table
CREATE TABLE IF NOT EXISTS public.pdsa_evidence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pdsa_cycle_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  note text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdsa_evidence TO authenticated;
GRANT ALL ON public.pdsa_evidence TO service_role;

ALTER TABLE public.pdsa_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read evidence"
  ON public.pdsa_evidence FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert evidence"
  ON public.pdsa_evidence FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update evidence"
  ON public.pdsa_evidence FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()))
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete evidence"
  ON public.pdsa_evidence FOR DELETE TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Founder admins manage all evidence"
  ON public.pdsa_evidence FOR ALL TO authenticated
  USING (public.is_founder_admin(auth.uid()))
  WITH CHECK (public.is_founder_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_pdsa_evidence_cycle ON public.pdsa_evidence(pdsa_cycle_id);
CREATE INDEX IF NOT EXISTS idx_pdsa_evidence_org ON public.pdsa_evidence(organization_id);

-- 4. Storage policies for pdsa-evidence bucket (created via tool)
CREATE POLICY "Org members read pdsa evidence files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'pdsa-evidence'
    AND (storage.foldername(name))[1] = public.get_user_org_id(auth.uid())::text
  );

CREATE POLICY "Org members upload pdsa evidence files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'pdsa-evidence'
    AND (storage.foldername(name))[1] = public.get_user_org_id(auth.uid())::text
  );

CREATE POLICY "Org members delete pdsa evidence files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'pdsa-evidence'
    AND (storage.foldername(name))[1] = public.get_user_org_id(auth.uid())::text
  );
