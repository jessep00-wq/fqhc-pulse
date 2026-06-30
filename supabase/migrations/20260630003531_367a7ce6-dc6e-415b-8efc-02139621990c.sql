
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  email_confirmed_at timestamptz,
  full_name text,
  staff_role text,
  organization_id uuid,
  organization_name text,
  profile_created_at timestamptz,
  profile_updated_at timestamptz,
  auth_created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_founder_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: founder admin only' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    u.email_confirmed_at,
    p.full_name,
    p.staff_role,
    p.organization_id,
    o.name AS organization_name,
    p.created_at AS profile_created_at,
    p.updated_at AS profile_updated_at,
    u.created_at AS auth_created_at,
    u.last_sign_in_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.organizations o ON o.id = p.organization_id
  ORDER BY u.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
