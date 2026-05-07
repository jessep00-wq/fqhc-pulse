-- Create a trigger function that prevents changing organization_id once set
CREATE OR REPLACE FUNCTION public.prevent_org_id_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If old org_id was NOT NULL and new org_id is different, block the change
  IF OLD.organization_id IS NOT NULL AND NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'organization_id cannot be changed after initial assignment';
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger on profiles
DROP TRIGGER IF EXISTS enforce_org_id_immutable ON public.profiles;
CREATE TRIGGER enforce_org_id_immutable
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_org_id_change();

-- Simplify the UPDATE policy now that the trigger handles immutability
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());