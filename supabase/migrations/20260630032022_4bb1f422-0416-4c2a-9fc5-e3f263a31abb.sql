
-- Dynamic, exhaustive org delete
CREATE OR REPLACE FUNCTION public.admin_delete_organization(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rec record;
BEGIN
  IF NOT public.is_founder_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: founder admin only' USING ERRCODE = '42501';
  END IF;

  -- Null out profile references first so we don't delete user profiles
  UPDATE public.profiles SET organization_id = NULL WHERE organization_id = _org_id;

  -- Delete from every public table that has an organization_id column (except profiles & organizations)
  FOR rec IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'organization_id'
      AND table_name NOT IN ('profiles', 'organizations')
  LOOP
    EXECUTE format('DELETE FROM public.%I WHERE organization_id = $1', rec.table_name) USING _org_id;
  END LOOP;

  DELETE FROM public.organizations WHERE id = _org_id;
END;
$function$;

-- Founder-only waitlist applicant delete
CREATE OR REPLACE FUNCTION public.admin_delete_waitlist_application(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_founder_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: founder admin only' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.email_send_log
   WHERE (metadata->>'applicant_id')::text = _id::text
      OR (metadata->>'waitlist_application_id')::text = _id::text;

  DELETE FROM public.waitlist_applications WHERE id = _id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_delete_organization(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_waitlist_application(uuid) TO authenticated;
