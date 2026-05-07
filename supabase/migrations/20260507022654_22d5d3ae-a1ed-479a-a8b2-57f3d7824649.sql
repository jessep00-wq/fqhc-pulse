-- Drop and recreate the profiles UPDATE policy to prevent org-hopping
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() AND (
    -- Allow setting org_id if it was previously NULL (onboarding)
    -- OR org_id must remain unchanged
    (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) IS NULL
    OR organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
);