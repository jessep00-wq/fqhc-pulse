-- 1. New columns on pdsa_cycles
ALTER TABLE public.pdsa_cycles
  ADD COLUMN IF NOT EXISTS opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS target_end_date date,
  ADD COLUMN IF NOT EXISTS doc_version integer NOT NULL DEFAULT 0;

UPDATE public.pdsa_cycles SET opened_at = created_at WHERE opened_at IS NULL;

-- 2. Immutable revision log
CREATE TABLE IF NOT EXISTS public.record_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  record_type text NOT NULL CHECK (record_type IN ('pdsa_cycle','task')),
  record_id uuid NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS record_revisions_record_idx
  ON public.record_revisions (record_type, record_id, created_at DESC);
CREATE INDEX IF NOT EXISTS record_revisions_org_idx
  ON public.record_revisions (organization_id, created_at DESC);

GRANT SELECT ON public.record_revisions TO authenticated;
GRANT ALL ON public.record_revisions TO service_role;

ALTER TABLE public.record_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read their record history"
  ON public.record_revisions FOR SELECT TO authenticated
  USING (
    organization_id = public.get_user_org_id(auth.uid())
    OR public.is_founder_admin(auth.uid())
  );

-- No INSERT/UPDATE/DELETE policies: rows are written only by the
-- SECURITY DEFINER trigger below and can never be altered afterwards.

-- 3. Generic field-diff trigger
CREATE OR REPLACE FUNCTION public.log_record_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec_type text := TG_ARGV[0];
  tracked text[] := string_to_array(TG_ARGV[1], ',');
  f text;
  old_j jsonb;
  new_j jsonb;
  ov text;
  nv text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.record_revisions
      (organization_id, record_type, record_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.organization_id, rec_type, NEW.id, '__created__', NULL, NEW.title, auth.uid());
    RETURN NEW;
  END IF;

  old_j := to_jsonb(OLD);
  new_j := to_jsonb(NEW);

  FOREACH f IN ARRAY tracked LOOP
    ov := old_j ->> f;
    nv := new_j ->> f;
    IF ov IS DISTINCT FROM nv THEN
      INSERT INTO public.record_revisions
        (organization_id, record_type, record_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.organization_id, rec_type, NEW.id, f, ov, nv, auth.uid());
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pdsa_cycles_revision_log ON public.pdsa_cycles;
CREATE TRIGGER pdsa_cycles_revision_log
AFTER INSERT OR UPDATE ON public.pdsa_cycles
FOR EACH ROW EXECUTE FUNCTION public.log_record_revision(
  'pdsa_cycle',
  'title,status,uds_measure,focus_area,root_cause,target_goal,clinical_workflow_impact,aim_statement,prediction,predicted_outcome,measurement_plan,baseline_rate,test_description,intervention_description,study_results,analysis_summary,actual_outcome,what_worked,what_didnt_work,act_next_steps,decision,next_cycle_decision,owner_user_id,start_date,opened_at,target_end_date,improvement_pct'
);

DROP TRIGGER IF EXISTS tasks_revision_log ON public.tasks;
CREATE TRIGGER tasks_revision_log
AFTER INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.log_record_revision(
  'task',
  'title,status,assigned_role,due_date,priority,acknowledged'
);

-- 4. Backfill synthetic creation entries for existing records
INSERT INTO public.record_revisions
  (organization_id, record_type, record_id, field_name, old_value, new_value, changed_by, created_at)
SELECT c.organization_id, 'pdsa_cycle', c.id, '__created__', NULL, c.title, NULL, c.created_at
FROM public.pdsa_cycles c
WHERE NOT EXISTS (
  SELECT 1 FROM public.record_revisions r
  WHERE r.record_type = 'pdsa_cycle' AND r.record_id = c.id AND r.field_name = '__created__'
);

INSERT INTO public.record_revisions
  (organization_id, record_type, record_id, field_name, old_value, new_value, changed_by, created_at)
SELECT t.organization_id, 'task', t.id, '__created__', NULL, t.title, NULL, t.created_at
FROM public.tasks t
WHERE NOT EXISTS (
  SELECT 1 FROM public.record_revisions r
  WHERE r.record_type = 'task' AND r.record_id = t.id AND r.field_name = '__created__'
);