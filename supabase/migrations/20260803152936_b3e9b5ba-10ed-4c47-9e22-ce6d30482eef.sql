ALTER TABLE public.pdsa_cycles ADD COLUMN IF NOT EXISTS focus_area text;

CREATE OR REPLACE FUNCTION public.compute_pdsa_completeness()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  s integer := 0;
BEGIN
  IF NEW.owner_user_id IS NOT NULL THEN s := s + 10; END IF;
  IF NEW.start_date IS NOT NULL THEN s := s + 10; END IF;
  IF (NEW.uds_measure IS NOT NULL AND length(NEW.uds_measure) > 0)
     OR (NEW.focus_area IS NOT NULL AND length(btrim(NEW.focus_area)) > 0) THEN s := s + 15; END IF;
  IF NEW.baseline_rate IS NOT NULL THEN s := s + 10; END IF;
  IF NEW.predicted_outcome IS NOT NULL AND length(NEW.predicted_outcome) > 0 THEN s := s + 10; END IF;
  IF NEW.intervention_description IS NOT NULL AND length(NEW.intervention_description) > 0 THEN s := s + 10; END IF;
  IF NEW.aim_statement IS NOT NULL AND length(NEW.aim_statement) > 0 THEN s := s + 5; END IF;
  IF NEW.measurement_plan IS NOT NULL AND length(NEW.measurement_plan) > 0 THEN s := s + 5; END IF;
  IF NEW.status = 'completed' THEN
    IF NEW.actual_outcome IS NOT NULL AND length(NEW.actual_outcome) > 0 THEN s := s + 12; END IF;
    IF NEW.next_cycle_decision IS NOT NULL THEN s := s + 13; END IF;
  ELSE
    s := s + 25;
  END IF;
  IF s > 100 THEN s := 100; END IF;
  NEW.completeness_score := s;
  RETURN NEW;
END;
$function$;