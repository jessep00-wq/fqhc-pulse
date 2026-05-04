
-- Team invitations table
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Members of the org can view invitations
CREATE POLICY "Org members can view invitations"
  ON public.team_invitations FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Members of the org can create invitations
CREATE POLICY "Org members can create invitations"
  ON public.team_invitations FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Create a function to seed demo data for a new organization
CREATE OR REPLACE FUNCTION public.seed_demo_data(org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cycle_id_1 UUID;
  cycle_id_2 UUID;
  cycle_id_3 UUID;
BEGIN
  -- Insert sample PDSA cycles
  cycle_id_1 := gen_random_uuid();
  cycle_id_2 := gen_random_uuid();
  cycle_id_3 := gen_random_uuid();

  INSERT INTO pdsa_cycles (id, organization_id, title, status, uds_measure, root_cause, target_goal, clinical_workflow_impact, assigned_staff, improvement_pct)
  VALUES
    (cycle_id_1, org_id, 'Improve Cervical Cancer Screening Rate', 'do', 'CMS124: Cervical Cancer Screening', 'Lack of automated patient outreach for overdue Pap smears.', 'Increase screening rate from 52% to 70%', 'Add pre-visit planning checklist, modify MA rooming workflow', ARRAY['MA/RN','Front Desk','Provider'], 12),
    (cycle_id_2, org_id, 'Reduce HbA1c Poor Control Rate', 'plan', 'CMS122: Diabetes HbA1c Poor Control', 'Inconsistent follow-up scheduling for diabetic patients.', 'Reduce poor control rate from 38% to 25%', 'Implement standing lab orders, add diabetic care protocol', ARRAY['Provider','MA/RN','Care Coordinator'], NULL),
    (cycle_id_3, org_id, 'Depression Screening Integration', 'completed', 'CMS2: Depression Screening', 'PHQ-9 not administered consistently.', 'Achieve 90% screening rate', 'Embed PHQ-9 in MA intake workflow', ARRAY['MA/RN','Provider','Care Coordinator'], 35);

  -- Insert sample tasks
  INSERT INTO tasks (organization_id, pdsa_cycle_id, title, assigned_role, status, priority, due_date)
  VALUES
    (org_id, cycle_id_1, 'Update pre-visit planning checklist', 'QI Manager', 'completed', 'high', now() - interval '5 days'),
    (org_id, cycle_id_1, 'Train front desk on eligibility flagging', 'Front Desk', 'in_progress', 'high', now() + interval '10 days'),
    (org_id, cycle_id_2, 'Create standing lab order template', 'Provider', 'pending', 'medium', now() + interval '15 days'),
    (org_id, cycle_id_3, 'Embed PHQ-9 in intake workflow', 'MA/RN', 'completed', 'high', now() - interval '30 days');

  -- Insert sample UDS trends (last 6 months)
  INSERT INTO uds_trends (organization_id, measure_id, month, value)
  SELECT org_id, m.measure_id, m.month, m.value
  FROM (VALUES
    ('CMS124', to_char(now() - interval '5 months', 'YYYY-MM'), 48),
    ('CMS124', to_char(now() - interval '4 months', 'YYYY-MM'), 50),
    ('CMS124', to_char(now() - interval '3 months', 'YYYY-MM'), 53),
    ('CMS124', to_char(now() - interval '2 months', 'YYYY-MM'), 56),
    ('CMS124', to_char(now() - interval '1 month', 'YYYY-MM'), 58),
    ('CMS124', to_char(now(), 'YYYY-MM'), 60),
    ('CMS165', to_char(now() - interval '5 months', 'YYYY-MM'), 58),
    ('CMS165', to_char(now() - interval '4 months', 'YYYY-MM'), 60),
    ('CMS165', to_char(now() - interval '3 months', 'YYYY-MM'), 63),
    ('CMS165', to_char(now() - interval '2 months', 'YYYY-MM'), 65),
    ('CMS165', to_char(now() - interval '1 month', 'YYYY-MM'), 67),
    ('CMS165', to_char(now(), 'YYYY-MM'), 69),
    ('CMS122', to_char(now() - interval '5 months', 'YYYY-MM'), 38),
    ('CMS122', to_char(now() - interval '4 months', 'YYYY-MM'), 36),
    ('CMS122', to_char(now() - interval '3 months', 'YYYY-MM'), 34),
    ('CMS122', to_char(now() - interval '2 months', 'YYYY-MM'), 32),
    ('CMS122', to_char(now() - interval '1 month', 'YYYY-MM'), 30),
    ('CMS122', to_char(now(), 'YYYY-MM'), 28)
  ) AS m(measure_id, month, value);

  -- Insert sample financials
  INSERT INTO org_financials (organization_id, period, shared_savings, revenue_protected, hrsa_quality_award, trend, grant_trend)
  VALUES (org_id, to_char(now(), 'YYYY-MM'), 285000, 142000, 98000, 12.5, 8.2);
END;
$$;
