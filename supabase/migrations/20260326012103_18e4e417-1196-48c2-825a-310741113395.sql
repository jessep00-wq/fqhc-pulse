
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, staff_role, organization_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'staff_role', 'QI Manager'),
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
  );
  RETURN NEW;
END;
$$;
