-- Profiles: restrict INSERT to self; block arbitrary tenant assignment.
-- The handle_new_user() trigger runs as SECURITY DEFINER and is unaffected.
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid() AND organization_id IS NULL);

-- Download log: writes are exclusively service_role from edge functions.
-- Document this with an explicit service_role policy; no client-side writes allowed.
CREATE POLICY "Service role manages download log"
ON public.download_log
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Orders: writes/reads are intentionally restricted to service_role and founder_admin.
-- Buyers receive download links via email only; no client-side order read path exists.
CREATE POLICY "Service role manages orders"
ON public.orders
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');