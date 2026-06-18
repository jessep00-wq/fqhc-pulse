
-- 1) Server-side tier-lock enforcement
CREATE OR REPLACE FUNCTION public.enforce_org_not_locked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_org uuid;
  status text;
BEGIN
  -- Founder admins bypass all gating
  IF public.is_founder_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  target_org := COALESCE(NEW.organization_id, OLD.organization_id);
  IF target_org IS NULL THEN
    RETURN NEW;
  END IF;

  status := public.org_access_status(target_org);
  IF status = 'locked' THEN
    RAISE EXCEPTION 'Subscription required: this organization''s workspace is locked. Please start a trial or subscribe to continue.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_lock_pdsa_cycles ON public.pdsa_cycles;
CREATE TRIGGER enforce_lock_pdsa_cycles
  BEFORE INSERT ON public.pdsa_cycles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_org_not_locked();

DROP TRIGGER IF EXISTS enforce_lock_team_invitations ON public.team_invitations;
CREATE TRIGGER enforce_lock_team_invitations
  BEFORE INSERT ON public.team_invitations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_org_not_locked();

DROP TRIGGER IF EXISTS enforce_lock_tasks ON public.tasks;
CREATE TRIGGER enforce_lock_tasks
  BEFORE INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_org_not_locked();

-- 2) Lock down internal SECURITY DEFINER helpers from direct client execution.
-- These are only intended to be called by edge functions (service role) or
-- by other database functions / triggers, not by anon/authenticated clients.
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_organization(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_cron_secret() FROM anon, authenticated, PUBLIC;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_organization(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_cron_secret() TO service_role;
