
-- Add new columns
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL;

-- Founder admins can delete organizations
CREATE POLICY "Founder admins can delete orgs"
  ON public.organizations
  FOR DELETE
  TO authenticated
  USING (is_founder_admin(auth.uid()));

-- Founder admins can update any organization
CREATE POLICY "Founder admins can update all orgs"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (is_founder_admin(auth.uid()))
  WITH CHECK (is_founder_admin(auth.uid()));
