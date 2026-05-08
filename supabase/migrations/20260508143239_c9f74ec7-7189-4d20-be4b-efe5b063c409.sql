CREATE OR REPLACE FUNCTION public.prevent_org_id_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.organization_id IS NOT NULL
     AND NEW.organization_id IS DISTINCT FROM OLD.organization_id
     AND NOT public.is_founder_admin(auth.uid())
  THEN
    RAISE EXCEPTION 'organization_id cannot be changed after initial assignment';
  END IF;
  RETURN NEW;
END;
$$;