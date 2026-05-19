REVOKE SELECT (included_file_paths) ON public.store_products FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.org_access_status(uuid) FROM PUBLIC, anon;