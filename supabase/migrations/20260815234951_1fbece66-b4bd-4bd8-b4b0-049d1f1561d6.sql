REVOKE EXECUTE ON FUNCTION public.grant_org_admin_to_owner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid) FROM PUBLIC, anon;