
CREATE OR REPLACE FUNCTION public.admin_delete_organization(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_founder_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: founder admin only';
  END IF;

  DELETE FROM public.tasks WHERE organization_id = _org_id;
  DELETE FROM public.pdsa_cycles WHERE organization_id = _org_id;
  DELETE FROM public.uds_trends WHERE organization_id = _org_id;
  DELETE FROM public.uds_targets WHERE organization_id = _org_id;
  DELETE FROM public.org_financials WHERE organization_id = _org_id;
  DELETE FROM public.account_health_snapshots WHERE organization_id = _org_id;
  DELETE FROM public.usage_events WHERE organization_id = _org_id;
  DELETE FROM public.subscriptions WHERE organization_id = _org_id;
  DELETE FROM public.team_invitations WHERE organization_id = _org_id;
  DELETE FROM public.sites WHERE organization_id = _org_id;
  DELETE FROM public.activity_log WHERE organization_id = _org_id;
  UPDATE public.profiles SET organization_id = NULL WHERE organization_id = _org_id;
  DELETE FROM public.organizations WHERE id = _org_id;
END;
$$;
