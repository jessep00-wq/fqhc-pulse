-- Audit fix 40: team_invitations had no UPDATE policy, blocking
-- legitimate state transitions (e.g. marking accepted/revoked).
CREATE POLICY "Org members can update invitations"
  ON public.team_invitations FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Audit fix 40: explain the deliberate absence of UPDATE/DELETE on activity_log.
COMMENT ON TABLE public.activity_log IS
  'Append-only audit trail. By design, no UPDATE or DELETE policies exist for authenticated users — rows can only be inserted by app code and read by founder admins / org members. Historical events must be immutable for compliance.';
