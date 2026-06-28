REVOKE EXECUTE ON FUNCTION public.reset_stale_generating_drafts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_stale_generating_drafts() TO service_role;