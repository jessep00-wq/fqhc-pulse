CREATE OR REPLACE FUNCTION public.seed_demo_data(org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  cycle_id_1 UUID;
  cycle_id_2 UUID;
  cycle_id_3 UUID;
  caller_org UUID;
BEGIN
  IF NOT public.is_founder_admin(auth.uid()) THEN
    caller_org := get_user_org_id(auth.uid());
    IF caller_org IS NULL OR caller_org != org_id THEN
      RAISE EXCEPTION 'Access denied: you can only seed data for your own organization';
    END IF;
  END IF;

  cycle_id_1 := gen_random_uuid();
  cycle_id_2 := gen_random_uuid();
  cycle_id_3 := gen_random_uuid();

  INSERT INTO pdsa_cycles (
    id, organization_id, title, status, uds_measure, root_cause, target_goal,
    clinical_workflow_impact, assigned_staff, improvement_pct,
    aim_statement, baseline_rate, measurement_plan, start_date,
    intervention_description, predicted_outcome,
    actual_outcome, study_results, analysis_summary,
    next_cycle_decision, act_next_steps
  )
  VALUES
    (cycle_id_1, org_id, 'Improve Cervical Cancer Screening Rate', 'do',
     'CMS124: Cervical Cancer Screening',
     'Lack of automated patient outreach for overdue Pap smears.',
     'Increase screening rate from 52% to 70%',
     'Add pre-visit planning checklist, modify MA rooming workflow',
     ARRAY['MA/RN','Front Desk','Provider'], 12,
     'By the end of the next two quarters, increase cervical cancer screening completion among eligible patients aged 21-64 from 52% to 70% at the main site.',
     52, 'Monthly EHR registry pull of CMS124 numerator/denominator, reviewed at the QI committee meeting.',
     (now() - interval '45 days')::date,
     'MA runs a pre-visit report each morning and flags overdue patients; front desk offers same-day Pap scheduling at check-in.',
     'Same-day scheduling should lift monthly completions by roughly 8-10 percentage points within two cycles.',
     NULL, NULL, NULL, NULL, NULL),
    (cycle_id_2, org_id, 'Reduce HbA1c Poor Control Rate', 'plan',
     'CMS122: Diabetes HbA1c Poor Control',
     'Inconsistent follow-up scheduling for diabetic patients.',
     'Reduce poor control rate from 38% to 25%',
     'Implement standing lab orders, add diabetic care protocol',
     ARRAY['Provider','MA/RN','Care Coordinator'], NULL,
     'Within six months, reduce the share of diabetic patients with HbA1c greater than 9% from 38% to 25% across all sites.',
     38, 'Quarterly registry report of CMS122, plus a monthly count of patients overdue for an HbA1c draw.',
     (now() - interval '12 days')::date,
     NULL, 'Standing lab orders should shorten the gap between visits and lab draws.',
     NULL, NULL, NULL, NULL, NULL),
    (cycle_id_3, org_id, 'Depression Screening Integration', 'completed',
     'CMS2: Depression Screening',
     'PHQ-9 not administered consistently.',
     'Achieve 90% screening rate',
     'Embed PHQ-9 in MA intake workflow',
     ARRAY['MA/RN','Provider','Care Coordinator'], 35,
     'Within one quarter, raise adult depression screening with a documented follow-up plan from 55% to 90% at all sites.',
     55, 'Weekly EHR report of CMS2 numerator/denominator, reviewed by the QI manager.',
     (now() - interval '120 days')::date,
     'PHQ-2 added to the MA intake template with an automatic PHQ-9 prompt on a positive screen, plus a warm handoff to behavioral health.',
     'Embedding the screen in intake should push completion above 85% within eight weeks.',
     'Screening completion reached 90% by week 9 and held there for the remainder of the cycle.',
     'Completion rose from 55% to 90%. Positive screens receiving a same-day behavioral health handoff rose from 41% to 78%.',
     'The intake-template change drove nearly all of the gain; the warm handoff needed a dedicated behavioral health slot to keep up with volume.',
     'Adopt', 'Spread the intake template to the two satellite sites and add a standing behavioral health slot each afternoon.');

  INSERT INTO tasks (organization_id, pdsa_cycle_id, title, assigned_role, status, priority, due_date)
  VALUES
    (org_id, cycle_id_1, 'Update pre-visit planning checklist', 'QI Manager', 'completed', 'high', now() - interval '5 days'),
    (org_id, cycle_id_1, 'Train front desk on eligibility flagging', 'Front Desk', 'in_progress', 'high', now() + interval '10 days'),
    (org_id, cycle_id_2, 'Create standing lab order template', 'Provider', 'pending', 'medium', now() + interval '15 days'),
    (org_id, cycle_id_3, 'Embed PHQ-9 in intake workflow', 'MA/RN', 'completed', 'high', now() - interval '30 days');

  INSERT INTO activity_log (organization_id, text, type, created_at)
  VALUES
    (org_id, 'Sample workspace created with demo data', 'info', now()),
    (org_id, 'PDSA cycle "Improve Cervical Cancer Screening Rate" moved to Do', 'info', now() - interval '3 days'),
    (org_id, 'Task "Update pre-visit planning checklist" completed', 'success', now() - interval '5 days'),
    (org_id, 'PDSA cycle "Reduce HbA1c Poor Control Rate" created', 'info', now() - interval '12 days'),
    (org_id, 'PDSA cycle "Depression Screening Integration" marked complete', 'success', now() - interval '20 days');

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

  INSERT INTO org_financials (organization_id, period, shared_savings, revenue_protected, hrsa_quality_award, trend, grant_trend)
  VALUES (org_id, to_char(now(), 'YYYY-MM'), 285000, 142000, 98000, 12.5, 8.2);
END;
$function$;