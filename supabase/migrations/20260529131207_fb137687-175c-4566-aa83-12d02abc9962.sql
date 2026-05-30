
-- 1) Hide private file paths from anon (public catalog readers)
REVOKE SELECT (included_file_paths) ON public.store_products FROM anon;

-- 2) Restrict account_health_snapshots read policy to authenticated only
DROP POLICY IF EXISTS "org members can read own snapshots" ON public.account_health_snapshots;
CREATE POLICY "Org members can read own snapshots"
ON public.account_health_snapshots
FOR SELECT
TO authenticated
USING (organization_id = public.get_user_org_id(auth.uid()));

-- 3) Revoke EXECUTE on internal SECURITY DEFINER functions from public/anon/authenticated.
--    Trigger-only and service-only functions should never be callable by end-users.
REVOKE EXECUTE ON FUNCTION public.prevent_org_id_change()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.force_org_owner()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_org_subscription() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.newsletters_autoslug()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()    FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_delete_organization(uuid) FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint)              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb)  FROM PUBLIC, anon, authenticated;
