
CREATE OR REPLACE FUNCTION public.force_org_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create an organization';
  END IF;
  NEW.owner_id := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_force_org_owner ON public.organizations;
CREATE TRIGGER trg_force_org_owner
BEFORE INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.force_org_owner();
