
-- Revoke anon execute on security definer functions
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_founder_admin(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.seed_demo_data(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_org_id(UUID) FROM anon;
