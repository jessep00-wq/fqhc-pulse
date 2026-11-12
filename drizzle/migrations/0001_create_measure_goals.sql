CREATE TABLE public.measure_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  measure_id text NOT NULL,
  measurement_year integer NOT NULL,
  goal_value numeric NOT NULL CHECK (goal_value BETWEEN 0 AND 100),
  set_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT measure_goals_org_measure_year_key UNIQUE (organization_id, measure_id, measurement_year)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.measure_goals TO authenticated;
GRANT ALL ON public.measure_goals TO service_role;

ALTER TABLE public.measure_goals ENABLE ROW LEVEL SECURITY;

-- Who may write goals for an org: a member of that org who is an org_admin or
-- whose staff role is QI Manager / Quality Director; founder_admin always.
CREATE OR REPLACE FUNCTION public.can_edit_measure_goals(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'founder_admin')
    OR (
      _org_id = public.get_user_org_id(_user_id)
      AND (
        public.has_role(_user_id, 'org_admin')
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = _user_id
            AND p.staff_role IN ('QI Manager', 'Quality Director')
        )
      )
    );
$$;

CREATE POLICY "Org members can read measure goals"
  ON public.measure_goals FOR SELECT TO authenticated
  USING (
    organization_id = public.get_user_org_id(auth.uid())
    OR public.is_founder_admin(auth.uid())
  );

CREATE POLICY "Goal editors can insert measure goals"
  ON public.measure_goals FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_measure_goals(auth.uid(), organization_id));

CREATE POLICY "Goal editors can update measure goals"
  ON public.measure_goals FOR UPDATE TO authenticated
  USING (public.can_edit_measure_goals(auth.uid(), organization_id))
  WITH CHECK (public.can_edit_measure_goals(auth.uid(), organization_id));

CREATE POLICY "Goal editors can delete measure goals"
  ON public.measure_goals FOR DELETE TO authenticated
  USING (public.can_edit_measure_goals(auth.uid(), organization_id));

CREATE TRIGGER update_measure_goals_updated_at
  BEFORE UPDATE ON public.measure_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.log_measure_goal_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.record_revisions
      (organization_id, record_type, record_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.organization_id, 'measure_goal', NEW.id, 'goal_value', NULL, NEW.goal_value::text, auth.uid());
  ELSIF OLD.goal_value IS DISTINCT FROM NEW.goal_value THEN
    INSERT INTO public.record_revisions
      (organization_id, record_type, record_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.organization_id, 'measure_goal', NEW.id, 'goal_value', OLD.goal_value::text, NEW.goal_value::text, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER measure_goals_revision_log
  AFTER INSERT OR UPDATE ON public.measure_goals
  FOR EACH ROW EXECUTE FUNCTION public.log_measure_goal_revision();