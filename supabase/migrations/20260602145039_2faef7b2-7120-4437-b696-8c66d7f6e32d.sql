
-- ============= qi_reports =============
CREATE TABLE public.qi_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  period_label text NOT NULL,
  period_start date,
  period_end date,
  report_type text NOT NULL DEFAULT 'quarterly',
  status text NOT NULL DEFAULT 'draft',
  committee_sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  board_sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_draft_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence_document_id uuid,
  generated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, period_label)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qi_reports TO authenticated;
GRANT ALL ON public.qi_reports TO service_role;

ALTER TABLE public.qi_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founder admins manage qi_reports" ON public.qi_reports
  FOR ALL TO authenticated
  USING (is_founder_admin(auth.uid()))
  WITH CHECK (is_founder_admin(auth.uid()));

CREATE POLICY "Org members read qi_reports" ON public.qi_reports
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members insert qi_reports" ON public.qi_reports
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members update qi_reports" ON public.qi_reports
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members delete qi_reports" ON public.qi_reports
  FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE TRIGGER qi_reports_updated_at
  BEFORE UPDATE ON public.qi_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= qi_report_approvals =============
CREATE TABLE public.qi_report_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.qi_reports(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  role text NOT NULL,
  approver_user_id uuid,
  approver_name_snapshot text,
  approver_title_snapshot text,
  decision text NOT NULL,
  decision_note text,
  decided_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX qi_report_approvals_report_id_idx ON public.qi_report_approvals(report_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qi_report_approvals TO authenticated;
GRANT ALL ON public.qi_report_approvals TO service_role;

ALTER TABLE public.qi_report_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founder admins manage qi_report_approvals" ON public.qi_report_approvals
  FOR ALL TO authenticated
  USING (is_founder_admin(auth.uid()))
  WITH CHECK (is_founder_admin(auth.uid()));

CREATE POLICY "Org members read qi_report_approvals" ON public.qi_report_approvals
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members insert qi_report_approvals" ON public.qi_report_approvals
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members delete qi_report_approvals" ON public.qi_report_approvals
  FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

-- ============= qi_report_board_actions =============
CREATE TABLE public.qi_report_board_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.qi_reports(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'awareness',
  title text NOT NULL,
  detail text,
  owner_user_id uuid,
  due_date date,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX qi_report_board_actions_report_id_idx ON public.qi_report_board_actions(report_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qi_report_board_actions TO authenticated;
GRANT ALL ON public.qi_report_board_actions TO service_role;

ALTER TABLE public.qi_report_board_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founder admins manage qi_report_board_actions" ON public.qi_report_board_actions
  FOR ALL TO authenticated
  USING (is_founder_admin(auth.uid()))
  WITH CHECK (is_founder_admin(auth.uid()));

CREATE POLICY "Org members read qi_report_board_actions" ON public.qi_report_board_actions
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members insert qi_report_board_actions" ON public.qi_report_board_actions
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members update qi_report_board_actions" ON public.qi_report_board_actions
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members delete qi_report_board_actions" ON public.qi_report_board_actions
  FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
