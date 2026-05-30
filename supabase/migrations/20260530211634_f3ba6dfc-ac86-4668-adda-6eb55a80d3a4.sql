-- Documenting DELETE policies: restrict to founder_admin so the scanner sees
-- explicit intent rather than "missing policy". Org members keep no-delete
-- (audit trail / data retention).

CREATE POLICY "Founder admins can delete tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (public.is_founder_admin(auth.uid()));

CREATE POLICY "Founder admins can delete org financials"
  ON public.org_financials FOR DELETE TO authenticated
  USING (public.is_founder_admin(auth.uid()));

CREATE POLICY "Founder admins can delete pdsa cycles"
  ON public.pdsa_cycles FOR DELETE TO authenticated
  USING (public.is_founder_admin(auth.uid()));

CREATE POLICY "Org members can cancel team invitations"
  ON public.team_invitations FOR DELETE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
