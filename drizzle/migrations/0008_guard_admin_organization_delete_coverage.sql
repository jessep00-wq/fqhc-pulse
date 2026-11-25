CREATE OR REPLACE FUNCTION public.admin_org_delete_coverage()
RETURNS TABLE(table_name text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT public.is_founder_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: founder admin only' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT c.table_name::text
  FROM information_schema.columns c
  JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name
  WHERE c.table_schema = 'public' AND c.column_name = 'organization_id' AND t.table_type = 'BASE TABLE'
  EXCEPT
  SELECT unnest(ARRAY[
    'profiles', 'barrier_cycles', 'barrier_decisions', 'ai_feedback', 'ai_recommendations',
    'ai_findings', 'ai_executive_summaries', 'ai_source_documents', 'ai_runs', 'ai_audit_log',
    'ai_org_limits', 'ai_incidents', 'ai_policies', 'ai_review_events', 'ai_tools', 'ai_vendor_reviews',
    'measure_signals', 'barriers', 'tasks', 'pdsa_evidence', 'pdsa_drafts', 'qi_meetings',
    'qi_report_approvals', 'qi_report_board_actions', 'qi_reports', 'qi_oversight_roles',
    'activity_log', 'uds_trends', 'org_financials', 'pdsa_cycles', 'account_health_snapshots',
    'feature_flags', 'measure_goals', 'record_revisions', 'sites', 'subscriptions',
    'team_invitations', 'uds_targets', 'usage_events'
  ]::text[])
  ORDER BY 1;
END;
$function$;
REVOKE ALL ON FUNCTION public.admin_org_delete_coverage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_org_delete_coverage() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_delete_organization(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  uncovered_tables text;
BEGIN
  IF NOT public.is_founder_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: founder admin only' USING ERRCODE = '42501';
  END IF;

  SELECT string_agg(table_name, ', ' ORDER BY table_name)
  INTO uncovered_tables FROM public.admin_org_delete_coverage();
  IF uncovered_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Health center deletion stopped. No records were changed. These data tables need deletion coverage: %', uncovered_tables
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.profiles SET organization_id = NULL WHERE organization_id = _org_id;
  DELETE FROM public.barrier_cycles WHERE organization_id = _org_id;
  DELETE FROM public.barrier_decisions WHERE organization_id = _org_id;
  DELETE FROM public.ai_feedback WHERE organization_id = _org_id;
  DELETE FROM public.ai_recommendations WHERE organization_id = _org_id;
  DELETE FROM public.ai_findings WHERE organization_id = _org_id;
  DELETE FROM public.ai_executive_summaries WHERE organization_id = _org_id;
  DELETE FROM public.ai_source_documents WHERE organization_id = _org_id;
  DELETE FROM public.ai_runs WHERE organization_id = _org_id;
  DELETE FROM public.ai_audit_log WHERE organization_id = _org_id;
  DELETE FROM public.ai_org_limits WHERE organization_id = _org_id;
  DELETE FROM public.ai_incidents WHERE organization_id = _org_id;
  DELETE FROM public.ai_policies WHERE organization_id = _org_id;
  DELETE FROM public.ai_review_events WHERE organization_id = _org_id;
  DELETE FROM public.ai_tools WHERE organization_id = _org_id;
  DELETE FROM public.ai_vendor_reviews WHERE organization_id = _org_id;
  DELETE FROM public.measure_signals WHERE organization_id = _org_id;
  DELETE FROM public.barriers WHERE organization_id = _org_id;
  DELETE FROM public.tasks WHERE organization_id = _org_id;
  DELETE FROM public.pdsa_evidence WHERE organization_id = _org_id;
  DELETE FROM public.pdsa_drafts WHERE organization_id = _org_id;
  DELETE FROM public.qi_meetings WHERE organization_id = _org_id;
  DELETE FROM public.qi_report_approvals WHERE organization_id = _org_id;
  DELETE FROM public.qi_report_board_actions WHERE organization_id = _org_id;
  DELETE FROM public.qi_reports WHERE organization_id = _org_id;
  DELETE FROM public.qi_oversight_roles WHERE organization_id = _org_id;
  DELETE FROM public.activity_log WHERE organization_id = _org_id;
  DELETE FROM public.uds_trends WHERE organization_id = _org_id;
  DELETE FROM public.org_financials WHERE organization_id = _org_id;
  DELETE FROM public.pdsa_cycles WHERE organization_id = _org_id;
  DELETE FROM public.account_health_snapshots WHERE organization_id = _org_id;
  DELETE FROM public.feature_flags WHERE organization_id = _org_id;
  DELETE FROM public.measure_goals WHERE organization_id = _org_id;
  DELETE FROM public.record_revisions WHERE organization_id = _org_id;
  DELETE FROM public.sites WHERE organization_id = _org_id;
  DELETE FROM public.subscriptions WHERE organization_id = _org_id;
  DELETE FROM public.team_invitations WHERE organization_id = _org_id;
  DELETE FROM public.uds_targets WHERE organization_id = _org_id;
  DELETE FROM public.usage_events WHERE organization_id = _org_id;
  DELETE FROM public.organizations WHERE id = _org_id;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.admin_delete_organization(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_organization(uuid) TO authenticated;