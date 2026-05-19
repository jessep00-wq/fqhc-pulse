
-- 1. Remove overly-permissive public read on orders
DROP POLICY IF EXISTS "Public can read order by session id" ON public.orders;

-- 2. Hide included_file_paths from anon/authenticated; service role keeps full access via SUPABASE_SERVICE_ROLE_KEY
REVOKE SELECT (included_file_paths) ON public.store_products FROM anon, authenticated;

-- 3. Lock down SECURITY DEFINER functions from anon (defense in depth)
REVOKE EXECUTE ON FUNCTION public.seed_demo_data(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_delete_organization(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_org_subscription() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.force_org_owner() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.prevent_org_id_change() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, public;

-- 4. Add fixed search_path to email queue helpers (linter: function_search_path_mutable)
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
