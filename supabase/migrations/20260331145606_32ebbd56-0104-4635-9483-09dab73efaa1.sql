
-- Allow authenticated users to create organizations
CREATE POLICY "Users can create orgs"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Replace trigger function to stop hardcoding org id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, staff_role, organization_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'staff_role', 'QI Manager'),
    NULL
  );
  RETURN NEW;
END;
$$;
