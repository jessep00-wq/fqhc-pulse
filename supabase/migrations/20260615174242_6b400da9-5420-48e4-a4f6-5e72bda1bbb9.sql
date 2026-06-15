
-- Profiles: prevent users from changing their organization_id to an arbitrary org.
-- Allow during onboarding (current org is null) or no-op assignments.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND (
    organization_id IS NULL
    OR organization_id = (SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid())
    OR (SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid()) IS NULL
  )
);

-- Generic org-scoped UPDATE policies: add matching WITH CHECK on organization_id.
DROP POLICY IF EXISTS "Users can update org cycles" ON public.pdsa_cycles;
CREATE POLICY "Users can update org cycles" ON public.pdsa_cycles
FOR UPDATE TO authenticated
USING (organization_id = get_user_org_id(auth.uid()))
WITH CHECK (organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Users can update org tasks" ON public.tasks;
CREATE POLICY "Users can update org tasks" ON public.tasks
FOR UPDATE TO authenticated
USING (organization_id = get_user_org_id(auth.uid()))
WITH CHECK (organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Users can update org financials" ON public.org_financials;
CREATE POLICY "Users can update org financials" ON public.org_financials
FOR UPDATE TO authenticated
USING (organization_id = get_user_org_id(auth.uid()))
WITH CHECK (organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Users can update org sites" ON public.sites;
CREATE POLICY "Users can update org sites" ON public.sites
FOR UPDATE TO authenticated
USING (organization_id = get_user_org_id(auth.uid()))
WITH CHECK (organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Org members update ai_tools" ON public.ai_tools;
CREATE POLICY "Org members update ai_tools" ON public.ai_tools
FOR UPDATE TO authenticated
USING (organization_id = get_user_org_id(auth.uid()))
WITH CHECK (organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Org members update ai_vendor_reviews" ON public.ai_vendor_reviews;
CREATE POLICY "Org members update ai_vendor_reviews" ON public.ai_vendor_reviews
FOR UPDATE TO authenticated
USING (organization_id = get_user_org_id(auth.uid()))
WITH CHECK (organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Org members update ai_incidents" ON public.ai_incidents;
CREATE POLICY "Org members update ai_incidents" ON public.ai_incidents
FOR UPDATE TO authenticated
USING (organization_id = get_user_org_id(auth.uid()))
WITH CHECK (organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Org members update ai_review_events" ON public.ai_review_events;
CREATE POLICY "Org members update ai_review_events" ON public.ai_review_events
FOR UPDATE TO authenticated
USING (organization_id = get_user_org_id(auth.uid()))
WITH CHECK (organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Org members update ai_policies" ON public.ai_policies;
CREATE POLICY "Org members update ai_policies" ON public.ai_policies
FOR UPDATE TO authenticated
USING (organization_id = get_user_org_id(auth.uid()))
WITH CHECK (organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Org members update qi_reports" ON public.qi_reports;
CREATE POLICY "Org members update qi_reports" ON public.qi_reports
FOR UPDATE TO authenticated
USING (organization_id = get_user_org_id(auth.uid()))
WITH CHECK (organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Org members update qi_report_board_actions" ON public.qi_report_board_actions;
CREATE POLICY "Org members update qi_report_board_actions" ON public.qi_report_board_actions
FOR UPDATE TO authenticated
USING (organization_id = get_user_org_id(auth.uid()))
WITH CHECK (organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Org members update evidence_documents" ON public.evidence_documents;
CREATE POLICY "Org members update evidence_documents" ON public.evidence_documents
FOR UPDATE TO authenticated
USING (organization_id = get_user_org_id(auth.uid()))
WITH CHECK (organization_id = get_user_org_id(auth.uid()));

DROP POLICY IF EXISTS "Org members update evidence_document_versions" ON public.evidence_document_versions;
CREATE POLICY "Org members update evidence_document_versions" ON public.evidence_document_versions
FOR UPDATE TO authenticated
USING (organization_id = get_user_org_id(auth.uid()))
WITH CHECK (organization_id = get_user_org_id(auth.uid()));

-- pdsa_evidence: already has WITH CHECK on org_id; also constrain pdsa_cycle_id to same org.
DROP POLICY IF EXISTS "Org members can update evidence" ON public.pdsa_evidence;
CREATE POLICY "Org members can update evidence" ON public.pdsa_evidence
FOR UPDATE TO authenticated
USING (organization_id = get_user_org_id(auth.uid()))
WITH CHECK (
  organization_id = get_user_org_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.pdsa_cycles c
    WHERE c.id = pdsa_evidence.pdsa_cycle_id
      AND c.organization_id = get_user_org_id(auth.uid())
  )
);
