-- Replace the over-permissive profile update policy. Previously any user with
-- a NULL organization_id could set it to any UUID, granting cross-tenant access.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND (
      -- Allow keeping the current org (no change) or clearing it.
      organization_id IS NOT DISTINCT FROM (
        SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid()
      )
      OR organization_id IS NULL
      -- Allow assigning ONLY to an org the user owns (onboarding self-created).
      OR EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = profiles.organization_id
          AND o.owner_id = auth.uid()
      )
    )
  );

-- Founder admins keep full update access via a separate explicit policy.
CREATE POLICY "Founder admins can update any profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_founder_admin(auth.uid()))
  WITH CHECK (public.is_founder_admin(auth.uid()));