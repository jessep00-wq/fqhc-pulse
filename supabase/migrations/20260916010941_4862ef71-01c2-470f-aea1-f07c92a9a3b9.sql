-- =========================================================
-- AI Quality Operations — Phase 2 schema
-- =========================================================

-- ---------- pdsa_cycles: structured measurement fields ----------
ALTER TABLE public.pdsa_cycles
  ADD COLUMN IF NOT EXISTS structured_measures jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS measurement_source text;

COMMENT ON COLUMN public.pdsa_cycles.structured_measures IS
  'Explicit numerator, denominator, process measure, and balancing measure for the cycle.';

-- ---------- barriers ----------
CREATE TABLE public.barriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  affected_measure_id text,
  affected_site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  related_pdsa_ids uuid[] DEFAULT '{}'::uuid[],
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','mitigated','escalated')),
  owner_user_id uuid,
  first_seen date NOT NULL DEFAULT CURRENT_DATE,
  detected_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_barriers_org ON public.barriers(organization_id, status, created_at DESC);
CREATE INDEX idx_barriers_measure ON public.barriers(organization_id, affected_measure_id);
CREATE INDEX idx_barriers_site ON public.barriers(organization_id, affected_site_id);
CREATE INDEX idx_barriers_pdsa ON public.barriers USING GIN (related_pdsa_ids);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.barriers TO authenticated;
GRANT ALL ON public.barriers TO service_role;

ALTER TABLE public.barriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "barriers_select_own_org" ON public.barriers FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));

CREATE POLICY "barriers_insert_own_org" ON public.barriers FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));

CREATE POLICY "barriers_update_own_org" ON public.barriers FOR UPDATE TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()))
WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));

CREATE POLICY "barriers_delete_own_org" ON public.barriers FOR DELETE TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));

CREATE TRIGGER trg_barriers_updated_at BEFORE UPDATE ON public.barriers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- ai_executive_summaries ----------
CREATE TABLE public.ai_executive_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ai_run_id uuid REFERENCES public.ai_runs(id) ON DELETE SET NULL,
  period_start date,
  period_end date,
  summary text NOT NULL,
  highlights text[] NOT NULL DEFAULT '{}'::text[],
  risks text[] NOT NULL DEFAULT '{}'::text[],
  evidence_state text NOT NULL DEFAULT 'inferred',
  source_references jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_exec_summaries_org ON public.ai_executive_summaries(organization_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_executive_summaries TO authenticated;
GRANT ALL ON public.ai_executive_summaries TO service_role;

ALTER TABLE public.ai_executive_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_exec_summaries_select_own_org" ON public.ai_executive_summaries FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));

CREATE POLICY "ai_exec_summaries_insert_own_org" ON public.ai_executive_summaries FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));

CREATE POLICY "ai_exec_summaries_update_own_org" ON public.ai_executive_summaries FOR UPDATE TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()))
WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));

CREATE TRIGGER trg_ai_exec_summaries_updated_at BEFORE UPDATE ON public.ai_executive_summaries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- ai_prompt_versions ----------
CREATE TABLE public.ai_prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL,
  version integer NOT NULL,
  prompt_text text NOT NULL,
  system_text text,
  model_name text,
  model_provider text,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_ai_prompt_active ON public.ai_prompt_versions(flag_key) WHERE is_active = true;
CREATE INDEX idx_ai_prompt_flag ON public.ai_prompt_versions(flag_key, version DESC);

GRANT SELECT ON public.ai_prompt_versions TO authenticated;
GRANT ALL ON public.ai_prompt_versions TO service_role;

ALTER TABLE public.ai_prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_prompt_versions_select_all" ON public.ai_prompt_versions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "ai_prompt_versions_write_founder" ON public.ai_prompt_versions FOR ALL TO authenticated
USING (public.is_founder_admin(auth.uid()))
WITH CHECK (public.is_founder_admin(auth.uid()));

CREATE TRIGGER trg_ai_prompt_versions_updated_at BEFORE UPDATE ON public.ai_prompt_versions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- ai_audit_log: safety_event_type ----------
ALTER TABLE public.ai_audit_log
  ADD COLUMN IF NOT EXISTS safety_event_type text;

COMMENT ON COLUMN public.ai_audit_log.safety_event_type IS
  'Classifies AI safety events: phi_detected, malformed_output, provider_error, rate_limited, user_flagged.';

-- ---------- measure_signals: scope ----------
ALTER TABLE public.measure_signals
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'single_pdsa'
  CHECK (scope IN ('single_pdsa','measure','site','organization'));

-- ---------- ai_org_limits ----------
CREATE TABLE public.ai_org_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  daily_run_cap integer NOT NULL DEFAULT 100,
  hard_cap boolean NOT NULL DEFAULT true,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_ai_org_limits_org ON public.ai_org_limits(organization_id);

GRANT SELECT ON public.ai_org_limits TO authenticated;
GRANT ALL ON public.ai_org_limits TO service_role;

ALTER TABLE public.ai_org_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_org_limits_select_own_org" ON public.ai_org_limits FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));

CREATE POLICY "ai_org_limits_write_founder" ON public.ai_org_limits FOR ALL TO authenticated
USING (public.is_founder_admin(auth.uid()))
WITH CHECK (public.is_founder_admin(auth.uid()));

CREATE TRIGGER trg_ai_org_limits_updated_at BEFORE UPDATE ON public.ai_org_limits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- feature flags: enable Sentinel and Copilot globally ----------
INSERT INTO public.feature_flags (flag_key, organization_id, enabled, notes) VALUES
  ('ai_evidence_auditor', NULL, true, 'Evidence Auditor — enabled'),
  ('ai_measure_sentinel', NULL, true, 'Measure Sentinel — enabled in Phase 2'),
  ('ai_action_copilot', NULL, true, 'Action Copilot — enabled in Phase 2'),
  ('ai_executive_summary', NULL, false, 'Executive Summary — scaffolded, expose when ready')
ON CONFLICT (flag_key) WHERE organization_id IS NULL
DO UPDATE SET enabled = EXCLUDED.enabled, notes = EXCLUDED.notes;

-- Backfill existing global rows to enable sentinel/copilot if already present
UPDATE public.feature_flags
SET enabled = true,
    notes = CASE
      WHEN flag_key = 'ai_measure_sentinel' THEN 'Measure Sentinel — enabled in Phase 2'
      WHEN flag_key = 'ai_action_copilot' THEN 'Action Copilot — enabled in Phase 2'
      ELSE notes
    END
WHERE organization_id IS NULL
  AND flag_key IN ('ai_measure_sentinel', 'ai_action_copilot');

-- ---------- backfill utility: seed barriers from existing root_cause text ----------
CREATE OR REPLACE FUNCTION public.backfill_barriers_from_cycles(_org_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inserted integer := 0;
  rec record;
BEGIN
  IF NOT public.is_founder_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: founder admin only' USING ERRCODE = '42501';
  END IF;

  FOR rec IN
    SELECT id, root_cause, uds_measure, site_id, created_at
    FROM public.pdsa_cycles
    WHERE organization_id = _org_id
      AND deleted_at IS NULL
      AND root_cause IS NOT NULL
      AND length(trim(root_cause)) > 5
  LOOP
    INSERT INTO public.barriers (
      organization_id, title, description, affected_measure_id,
      affected_site_id, related_pdsa_ids, status, first_seen, detected_by
    )
    VALUES (
      _org_id,
      left(rec.root_cause, 120),
      rec.root_cause,
      rec.uds_measure,
      rec.site_id,
      ARRAY[rec.id],
      'open',
      rec.created_at::date,
      'phase_2_backfill'
    )
    ON CONFLICT DO NOTHING;
    inserted := inserted + 1;
  END LOOP;

  RETURN inserted;
END;
$$;

-- Limit who can invoke the backfill function
REVOKE EXECUTE ON FUNCTION public.backfill_barriers_from_cycles(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_barriers_from_cycles(uuid) TO service_role;
