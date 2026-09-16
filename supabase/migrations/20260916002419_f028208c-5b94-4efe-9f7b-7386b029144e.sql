
-- =========================================================
-- AI Quality Operations — Phase 1 schema
-- =========================================================

-- ---------- ai_runs ----------
CREATE TABLE public.ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  user_id uuid,
  feature_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  model_provider text,
  model_name text,
  model_version text,
  prompt_version text,
  input_hash text,
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  latency_ms integer,
  token_usage jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_cost numeric,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_runs_org ON public.ai_runs(organization_id, created_at DESC);
CREATE INDEX idx_ai_runs_entity ON public.ai_runs(entity_type, entity_id);
GRANT SELECT ON public.ai_runs TO authenticated;
GRANT ALL ON public.ai_runs TO service_role;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_runs_select_own_org" ON public.ai_runs FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));

-- ---------- ai_findings ----------
CREATE TABLE public.ai_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ai_run_id uuid REFERENCES public.ai_runs(id) ON DELETE SET NULL,
  entity_type text NOT NULL DEFAULT 'pdsa_cycle',
  entity_id uuid NOT NULL,
  entity_version integer,
  finding_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  explanation text,
  detection_rule text,
  evidence_state text NOT NULL DEFAULT 'organizational_data',
  source_references jsonb NOT NULL DEFAULT '[]'::jsonb,
  affected_field text,
  recommended_action text,
  status text NOT NULL DEFAULT 'open',
  resolved_by uuid,
  resolved_at timestamptz,
  dismissal_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_findings_entity ON public.ai_findings(entity_type, entity_id, status);
CREATE INDEX idx_ai_findings_org ON public.ai_findings(organization_id);
GRANT SELECT, INSERT, UPDATE ON public.ai_findings TO authenticated;
GRANT ALL ON public.ai_findings TO service_role;
ALTER TABLE public.ai_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_findings_select_own_org" ON public.ai_findings FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));
CREATE POLICY "ai_findings_update_own_org" ON public.ai_findings FOR UPDATE TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()))
WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));

-- ---------- ai_recommendations ----------
CREATE TABLE public.ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ai_run_id uuid REFERENCES public.ai_runs(id) ON DELETE SET NULL,
  related_finding_id uuid REFERENCES public.ai_findings(id) ON DELETE CASCADE,
  related_signal_id uuid,
  recommendation_type text NOT NULL DEFAULT 'action_option',
  title text NOT NULL,
  rationale text,
  proposed_owner_role text,
  proposed_process_measure text,
  proposed_balancing_measure text,
  proposed_duration text,
  proposed_evidence text,
  implementation_risks text,
  evidence_state text NOT NULL DEFAULT 'inferred',
  status text NOT NULL DEFAULT 'proposed',
  selected_by uuid,
  selected_at timestamptz,
  created_pdsa_id uuid REFERENCES public.pdsa_cycles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_recs_org ON public.ai_recommendations(organization_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.ai_recommendations TO authenticated;
GRANT ALL ON public.ai_recommendations TO service_role;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_recs_select_own_org" ON public.ai_recommendations FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));
CREATE POLICY "ai_recs_update_own_org" ON public.ai_recommendations FOR UPDATE TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()))
WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));

-- ---------- measure_signals ----------
CREATE TABLE public.measure_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  measure_id text,
  pdsa_id uuid REFERENCES public.pdsa_cycles(id) ON DELETE CASCADE,
  signal_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  detection_rule text NOT NULL,
  underlying_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  explanation text,
  detected_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  snoozed_until timestamptz,
  dismissed_by uuid,
  dismissal_reason text,
  confirmed_cause text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_measure_signals_org ON public.measure_signals(organization_id, status, detected_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.measure_signals TO authenticated;
GRANT ALL ON public.measure_signals TO service_role;
ALTER TABLE public.measure_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "measure_signals_select_own_org" ON public.measure_signals FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));
CREATE POLICY "measure_signals_insert_own_org" ON public.measure_signals FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "measure_signals_update_own_org" ON public.measure_signals FOR UPDATE TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()))
WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));

-- ---------- ai_feedback ----------
CREATE TABLE public.ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  ai_run_id uuid REFERENCES public.ai_runs(id) ON DELETE SET NULL,
  finding_id uuid REFERENCES public.ai_findings(id) ON DELETE CASCADE,
  recommendation_id uuid REFERENCES public.ai_recommendations(id) ON DELETE CASCADE,
  rating text,
  feedback_type text,
  comments text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_feedback_org ON public.ai_feedback(organization_id, created_at DESC);
GRANT SELECT, INSERT ON public.ai_feedback TO authenticated;
GRANT ALL ON public.ai_feedback TO service_role;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_feedback_select_own_org" ON public.ai_feedback FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));
CREATE POLICY "ai_feedback_insert_self" ON public.ai_feedback FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND organization_id = public.get_user_org_id(auth.uid()));

-- ---------- ai_source_documents ----------
CREATE TABLE public.ai_source_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  source_type text NOT NULL,
  issuing_authority text,
  version text,
  effective_date date,
  expiration_date date,
  status text NOT NULL DEFAULT 'draft',
  storage_reference text,
  content_hash text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_sources_org ON public.ai_source_documents(organization_id, status);
GRANT SELECT, INSERT, UPDATE ON public.ai_source_documents TO authenticated;
GRANT ALL ON public.ai_source_documents TO service_role;
ALTER TABLE public.ai_source_documents ENABLE ROW LEVEL SECURITY;
-- Global sources (organization_id IS NULL) are readable by everyone, writable only by founder admins.
CREATE POLICY "ai_sources_select" ON public.ai_source_documents FOR SELECT TO authenticated
USING (
  organization_id IS NULL
  OR organization_id = public.get_user_org_id(auth.uid())
  OR public.is_founder_admin(auth.uid())
);
CREATE POLICY "ai_sources_insert_org_admin" ON public.ai_source_documents FOR INSERT TO authenticated
WITH CHECK (
  (organization_id IS NOT NULL
    AND organization_id = public.get_user_org_id(auth.uid())
    AND public.is_org_admin(auth.uid()))
  OR public.is_founder_admin(auth.uid())
);
CREATE POLICY "ai_sources_update_org_admin" ON public.ai_source_documents FOR UPDATE TO authenticated
USING (
  (organization_id IS NOT NULL
    AND organization_id = public.get_user_org_id(auth.uid())
    AND public.is_org_admin(auth.uid()))
  OR public.is_founder_admin(auth.uid())
)
WITH CHECK (
  (organization_id IS NOT NULL
    AND organization_id = public.get_user_org_id(auth.uid())
    AND public.is_org_admin(auth.uid()))
  OR public.is_founder_admin(auth.uid())
);

-- ---------- ai_audit_log ----------
CREATE TABLE public.ai_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_audit_org ON public.ai_audit_log(organization_id, created_at DESC);
GRANT SELECT, INSERT ON public.ai_audit_log TO authenticated;
GRANT ALL ON public.ai_audit_log TO service_role;
ALTER TABLE public.ai_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_audit_select_own_org" ON public.ai_audit_log FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));
CREATE POLICY "ai_audit_insert_own_org" ON public.ai_audit_log FOR INSERT TO authenticated
WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) AND (user_id = auth.uid() OR user_id IS NULL));

-- ---------- feature_flags ----------
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  min_plan text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_feature_flags_global ON public.feature_flags(flag_key) WHERE organization_id IS NULL;
CREATE UNIQUE INDEX idx_feature_flags_org ON public.feature_flags(flag_key, organization_id) WHERE organization_id IS NOT NULL;
GRANT SELECT ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feature_flags_select" ON public.feature_flags FOR SELECT TO authenticated
USING (organization_id IS NULL OR organization_id = public.get_user_org_id(auth.uid()) OR public.is_founder_admin(auth.uid()));
CREATE POLICY "feature_flags_write_founder" ON public.feature_flags FOR ALL TO authenticated
USING (public.is_founder_admin(auth.uid()))
WITH CHECK (public.is_founder_admin(auth.uid()));

-- ---------- updated_at triggers ----------
CREATE TRIGGER trg_ai_findings_updated BEFORE UPDATE ON public.ai_findings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ai_recs_updated BEFORE UPDATE ON public.ai_recommendations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_measure_signals_updated BEFORE UPDATE ON public.measure_signals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ai_sources_updated BEFORE UPDATE ON public.ai_source_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_feature_flags_updated BEFORE UPDATE ON public.feature_flags
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- default feature flags ----------
INSERT INTO public.feature_flags (flag_key, organization_id, enabled, notes) VALUES
  ('ai_evidence_auditor', NULL, true,  'Evidence Auditor — enabled for initial testing'),
  ('ai_measure_sentinel', NULL, false, 'Measure Sentinel — built, disabled'),
  ('ai_action_copilot',   NULL, false, 'Action Copilot — built, disabled'),
  ('ai_executive_summary',NULL, false, 'Executive summary — scaffolded, not exposed');
