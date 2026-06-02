
-- =========================================================
-- AI Governance module
-- =========================================================

-- ai_tools: model inventory
CREATE TABLE public.ai_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  vendor text,
  purpose text,
  ai_category text NOT NULL DEFAULT 'clinical', -- clinical | operational | administrative
  user_role text,
  workflow_location text,
  patient_impact text NOT NULL DEFAULT 'none', -- none | low | moderate | high
  data_accessed text[] NOT NULL DEFAULT '{}',
  handles_phi boolean NOT NULL DEFAULT false,
  risk_tier integer NOT NULL DEFAULT 3, -- 1 | 2 | 3
  date_adopted date,
  vendor_agreement_status text NOT NULL DEFAULT 'none', -- none | requested | signed | expired
  is_shadow_ai boolean NOT NULL DEFAULT false,
  reported_by uuid,
  internal_owner_user_id uuid,
  status text NOT NULL DEFAULT 'active', -- active | paused | retired
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_tools TO authenticated;
GRANT ALL ON public.ai_tools TO service_role;

ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read ai_tools" ON public.ai_tools FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members insert ai_tools" ON public.ai_tools FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members update ai_tools" ON public.ai_tools FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members delete ai_tools" ON public.ai_tools FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Founder admins manage ai_tools" ON public.ai_tools FOR ALL TO authenticated
  USING (is_founder_admin(auth.uid())) WITH CHECK (is_founder_admin(auth.uid()));

CREATE TRIGGER ai_tools_updated_at BEFORE UPDATE ON public.ai_tools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ai_vendor_reviews
CREATE TABLE public.ai_vendor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  ai_tool_id uuid NOT NULL,
  review_date date NOT NULL DEFAULT CURRENT_DATE,
  next_review_date date,
  baa_signed boolean NOT NULL DEFAULT false,
  baa_file_path text,
  data_retention_terms text,
  model_update_notification text,
  audit_rights text,
  indemnification text,
  known_limitations text,
  signed_agreement_path text,
  reviewer_user_id uuid,
  status text NOT NULL DEFAULT 'draft', -- draft | approved
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_vendor_reviews TO authenticated;
GRANT ALL ON public.ai_vendor_reviews TO service_role;

ALTER TABLE public.ai_vendor_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read ai_vendor_reviews" ON public.ai_vendor_reviews FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members insert ai_vendor_reviews" ON public.ai_vendor_reviews FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members update ai_vendor_reviews" ON public.ai_vendor_reviews FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members delete ai_vendor_reviews" ON public.ai_vendor_reviews FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Founder admins manage ai_vendor_reviews" ON public.ai_vendor_reviews FOR ALL TO authenticated
  USING (is_founder_admin(auth.uid())) WITH CHECK (is_founder_admin(auth.uid()));

CREATE TRIGGER ai_vendor_reviews_updated_at BEFORE UPDATE ON public.ai_vendor_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ai_vendor_reviews_tool ON public.ai_vendor_reviews(ai_tool_id);

-- ai_incidents
CREATE TABLE public.ai_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  ai_tool_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  reported_by uuid,
  incident_type text NOT NULL DEFAULT 'unexpected_output',
  description text NOT NULL,
  patient_impact boolean NOT NULL DEFAULT false,
  patient_impact_detail text,
  corrective_action text,
  resolution_status text NOT NULL DEFAULT 'open', -- open | investigating | resolved | escalated
  resolved_at timestamptz,
  qi_committee_reviewed boolean NOT NULL DEFAULT false,
  qi_review_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_incidents TO authenticated;
GRANT ALL ON public.ai_incidents TO service_role;

ALTER TABLE public.ai_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read ai_incidents" ON public.ai_incidents FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members insert ai_incidents" ON public.ai_incidents FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members update ai_incidents" ON public.ai_incidents FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members delete ai_incidents" ON public.ai_incidents FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Founder admins manage ai_incidents" ON public.ai_incidents FOR ALL TO authenticated
  USING (is_founder_admin(auth.uid())) WITH CHECK (is_founder_admin(auth.uid()));

CREATE TRIGGER ai_incidents_updated_at BEFORE UPDATE ON public.ai_incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ai_review_events (human-in-the-loop audit trail)
CREATE TABLE public.ai_review_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  ai_tool_id uuid,
  reviewer_user_id uuid,
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  output_category text NOT NULL DEFAULT 'other',
  output_summary text,
  action_taken text NOT NULL DEFAULT 'accepted', -- accepted | modified | rejected | escalated
  patient_reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_review_events TO authenticated;
GRANT ALL ON public.ai_review_events TO service_role;

ALTER TABLE public.ai_review_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read ai_review_events" ON public.ai_review_events FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members insert ai_review_events" ON public.ai_review_events FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members update ai_review_events" ON public.ai_review_events FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members delete ai_review_events" ON public.ai_review_events FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Founder admins manage ai_review_events" ON public.ai_review_events FOR ALL TO authenticated
  USING (is_founder_admin(auth.uid())) WITH CHECK (is_founder_admin(auth.uid()));

-- ai_policies
CREATE TABLE public.ai_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  title text NOT NULL DEFAULT 'AI Governance Policy',
  body_md text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft', -- draft | in_review | approved | active | retired
  cmo_approved_by uuid,
  cmo_approved_at timestamptz,
  ceo_approved_by uuid,
  ceo_approved_at timestamptz,
  board_chair_approved_by uuid,
  board_chair_approved_at timestamptz,
  activated_at timestamptz,
  next_review_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_policies TO authenticated;
GRANT ALL ON public.ai_policies TO service_role;

ALTER TABLE public.ai_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read ai_policies" ON public.ai_policies FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members insert ai_policies" ON public.ai_policies FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members update ai_policies" ON public.ai_policies FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members delete ai_policies" ON public.ai_policies FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Founder admins manage ai_policies" ON public.ai_policies FOR ALL TO authenticated
  USING (is_founder_admin(auth.uid())) WITH CHECK (is_founder_admin(auth.uid()));

CREATE TRIGGER ai_policies_updated_at BEFORE UPDATE ON public.ai_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-set next_review_date when policy activated
CREATE OR REPLACE FUNCTION public.set_ai_policy_review_date()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.activated_at IS NOT NULL
     AND (NEW.next_review_date IS NULL OR OLD.status IS DISTINCT FROM 'active') THEN
    NEW.next_review_date := (NEW.activated_at + INTERVAL '12 months')::date;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ai_policies_next_review BEFORE INSERT OR UPDATE ON public.ai_policies
  FOR EACH ROW EXECUTE FUNCTION public.set_ai_policy_review_date();
