-- 1) New fields on barriers (additive; existing rows keep their data)
ALTER TABLE public.barriers
  ADD COLUMN IF NOT EXISTS symptom text,
  ADD COLUMN IF NOT EXISTS est_patients integer,
  ADD COLUMN IF NOT EXISTS period text DEFAULT 'this_month',
  ADD COLUMN IF NOT EXISTS reasons text[] NOT NULL DEFAULT ARRAY['not_yet_known']::text[],
  ADD COLUMN IF NOT EXISTS owner_role text,
  ADD COLUMN IF NOT EXISTS change_made text,
  ADD COLUMN IF NOT EXISTS closed_reason text;

ALTER TABLE public.barriers
  ADD CONSTRAINT barriers_symptom_check CHECK (symptom IS NULL OR symptom IN (
    'test_not_completed','missed_no_show','referral_not_completed','done_elsewhere_not_credited','declined')),
  ADD CONSTRAINT barriers_period_check CHECK (period IS NULL OR period IN ('this_month','this_quarter')),
  ADD CONSTRAINT barriers_est_patients_check CHECK (est_patients IS NULL OR est_patients >= 0),
  ADD CONSTRAINT barriers_reasons_check CHECK (
    cardinality(reasons) >= 1 AND reasons <@ ARRAY[
      'transportation','cost_insurance','fear_stigma','language_literacy','physical_limitations',
      'not_reached','scheduling_access','team_workflow','abnormal_followup','referral_loop','documentation_gap',
      'specialty_resource_access','not_yet_known']::text[]),
  ADD CONSTRAINT barriers_closed_reason_check CHECK (closed_reason IS NULL OR closed_reason IN (
    'resource_unavailable','decided_not_to_pursue','replaced_by_other_barrier'));

-- Status: allow the new lifecycle. 'escalated' stays allowed until existing rows are mapped.
ALTER TABLE public.barriers DROP CONSTRAINT IF EXISTS barriers_status_check;
ALTER TABLE public.barriers ADD CONSTRAINT barriers_status_check CHECK (status IN (
  'open','decision_requested','in_progress','waiting_outside','mitigated','closed_unresolved','escalated'));

-- 2) Decisions requested on a barrier
CREATE TABLE public.barrier_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  barrier_id uuid NOT NULL REFERENCES public.barriers(id) ON DELETE CASCADE,
  decision_needed text NOT NULL,
  already_tried text,
  decider_user_id uuid NOT NULL,
  backup_user_id uuid,
  due_date date NOT NULL DEFAULT (CURRENT_DATE + 7),
  accepted_at timestamptz,
  redirected_to_user_id uuid,
  redirect_note text,
  decision_made text,
  action_owner_user_id uuid,
  action_due_date date,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX barrier_decisions_barrier_idx ON public.barrier_decisions(barrier_id);
CREATE INDEX barrier_decisions_decider_idx ON public.barrier_decisions(decider_user_id) WHERE accepted_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.barrier_decisions TO authenticated;
GRANT ALL ON public.barrier_decisions TO service_role;
ALTER TABLE public.barrier_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY barrier_decisions_select_own_org ON public.barrier_decisions FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));
CREATE POLICY barrier_decisions_insert_own_org ON public.barrier_decisions FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));
CREATE POLICY barrier_decisions_update_own_org ON public.barrier_decisions FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()))
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));
CREATE POLICY barrier_decisions_delete_own_org ON public.barrier_decisions FOR DELETE TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));

-- 3) Many-to-many link between barriers and PDSA cycles
CREATE TABLE public.barrier_cycles (
  barrier_id uuid NOT NULL REFERENCES public.barriers(id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES public.pdsa_cycles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (barrier_id, cycle_id)
);
CREATE INDEX barrier_cycles_cycle_idx ON public.barrier_cycles(cycle_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.barrier_cycles TO authenticated;
GRANT ALL ON public.barrier_cycles TO service_role;
ALTER TABLE public.barrier_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY barrier_cycles_select_own_org ON public.barrier_cycles FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));
CREATE POLICY barrier_cycles_insert_own_org ON public.barrier_cycles FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));
CREATE POLICY barrier_cycles_delete_own_org ON public.barrier_cycles FOR DELETE TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));

-- Both ends of a link must belong to the link's workspace
CREATE OR REPLACE FUNCTION public.validate_barrier_cycle_org()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.barriers WHERE id = NEW.barrier_id AND organization_id = NEW.organization_id)
     OR NOT EXISTS (SELECT 1 FROM public.pdsa_cycles WHERE id = NEW.cycle_id AND organization_id = NEW.organization_id) THEN
    RAISE EXCEPTION 'Barrier and cycle must belong to the same workspace';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER barrier_cycles_validate_org BEFORE INSERT OR UPDATE ON public.barrier_cycles
  FOR EACH ROW EXECUTE FUNCTION public.validate_barrier_cycle_org();

CREATE OR REPLACE FUNCTION public.validate_barrier_decision_org()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.barriers WHERE id = NEW.barrier_id AND organization_id = NEW.organization_id) THEN
    RAISE EXCEPTION 'Decision must belong to the barrier''s workspace';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER barrier_decisions_validate_org BEFORE INSERT OR UPDATE ON public.barrier_decisions
  FOR EACH ROW EXECUTE FUNCTION public.validate_barrier_decision_org();

-- Backfill links from the existing related_pdsa_ids array (kept in place)
INSERT INTO public.barrier_cycles (barrier_id, cycle_id, organization_id)
SELECT b.id, c.id, b.organization_id
FROM public.barriers b
CROSS JOIN LATERAL unnest(coalesce(b.related_pdsa_ids, '{}'::uuid[])) AS rid(cycle_id)
JOIN public.pdsa_cycles c ON c.id = rid.cycle_id AND c.organization_id = b.organization_id
ON CONFLICT DO NOTHING;

-- 4) Change idea library (shared reference list)
CREATE TABLE public.change_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reason text NOT NULL CHECK (reason IN (
    'transportation','cost_insurance','fear_stigma','language_literacy','physical_limitations',
    'not_reached','scheduling_access','team_workflow','abnormal_followup','referral_loop','documentation_gap',
    'specialty_resource_access','not_yet_known')),
  measure_code text,
  title text NOT NULL,
  template_id text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reason, title)
);

GRANT SELECT ON public.change_ideas TO authenticated;
GRANT ALL ON public.change_ideas TO service_role;
ALTER TABLE public.change_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY change_ideas_read_authenticated ON public.change_ideas FOR SELECT TO authenticated USING (true);
CREATE POLICY change_ideas_founder_write ON public.change_ideas FOR ALL TO authenticated
  USING (public.is_founder_admin(auth.uid())) WITH CHECK (public.is_founder_admin(auth.uid()));