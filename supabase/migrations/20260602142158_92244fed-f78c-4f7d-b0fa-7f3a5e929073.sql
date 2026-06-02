
-- Evidence Binder schema
CREATE TABLE public.evidence_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  chapter8_reference text,
  required_doc_types text[] NOT NULL DEFAULT '{}',
  default_review_cadence_months int NOT NULL DEFAULT 12,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.evidence_categories TO anon;
GRANT SELECT ON public.evidence_categories TO authenticated;
GRANT ALL ON public.evidence_categories TO service_role;
ALTER TABLE public.evidence_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read evidence categories" ON public.evidence_categories FOR SELECT USING (true);
CREATE POLICY "Founder admins manage evidence categories" ON public.evidence_categories FOR ALL TO authenticated
  USING (is_founder_admin(auth.uid())) WITH CHECK (is_founder_admin(auth.uid()));

-- Documents
CREATE TABLE public.evidence_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL,
  category_id uuid NOT NULL REFERENCES public.evidence_categories(id),
  title text NOT NULL,
  document_type text NOT NULL DEFAULT 'other',
  doc_date date,
  author_user_id uuid,
  author_name_override text,
  associated_measure text,
  associated_requirement text,
  review_date date,
  expires_at date,
  current_version_id uuid,
  status text NOT NULL DEFAULT 'active',
  source text NOT NULL DEFAULT 'uploaded',
  source_ref_id uuid,
  notes text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence_documents TO authenticated;
GRANT ALL ON public.evidence_documents TO service_role;
ALTER TABLE public.evidence_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Founder admins manage evidence_documents" ON public.evidence_documents FOR ALL TO authenticated
  USING (is_founder_admin(auth.uid())) WITH CHECK (is_founder_admin(auth.uid()));
CREATE POLICY "Org members read evidence_documents" ON public.evidence_documents FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members insert evidence_documents" ON public.evidence_documents FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members update evidence_documents" ON public.evidence_documents FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members delete evidence_documents" ON public.evidence_documents FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE INDEX idx_evidence_documents_org ON public.evidence_documents(organization_id);
CREATE INDEX idx_evidence_documents_category ON public.evidence_documents(category_id);

-- Versions
CREATE TABLE public.evidence_document_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES public.evidence_documents(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  version int NOT NULL DEFAULT 1,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  change_note text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence_document_versions TO authenticated;
GRANT ALL ON public.evidence_document_versions TO service_role;
ALTER TABLE public.evidence_document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Founder admins manage evidence_document_versions" ON public.evidence_document_versions FOR ALL TO authenticated
  USING (is_founder_admin(auth.uid())) WITH CHECK (is_founder_admin(auth.uid()));
CREATE POLICY "Org members read evidence_document_versions" ON public.evidence_document_versions FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members insert evidence_document_versions" ON public.evidence_document_versions FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members update evidence_document_versions" ON public.evidence_document_versions FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members delete evidence_document_versions" ON public.evidence_document_versions FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE INDEX idx_evidence_versions_doc ON public.evidence_document_versions(document_id);

-- Exports audit log
CREATE TABLE public.evidence_binder_exports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL,
  export_type text NOT NULL DEFAULT 'full_osv',
  period_start date,
  period_end date,
  file_path text,
  generated_by uuid,
  generated_at timestamptz NOT NULL DEFAULT now(),
  toc jsonb NOT NULL DEFAULT '[]'::jsonb,
  included_document_ids uuid[] NOT NULL DEFAULT '{}'::uuid[]
);

GRANT SELECT, INSERT, DELETE ON public.evidence_binder_exports TO authenticated;
GRANT ALL ON public.evidence_binder_exports TO service_role;
ALTER TABLE public.evidence_binder_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Founder admins manage evidence_binder_exports" ON public.evidence_binder_exports FOR ALL TO authenticated
  USING (is_founder_admin(auth.uid())) WITH CHECK (is_founder_admin(auth.uid()));
CREATE POLICY "Org members read evidence_binder_exports" ON public.evidence_binder_exports FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members insert evidence_binder_exports" ON public.evidence_binder_exports FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Org members delete evidence_binder_exports" ON public.evidence_binder_exports FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

-- updated_at trigger
CREATE TRIGGER evidence_documents_updated
  BEFORE UPDATE ON public.evidence_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-expire status refresh function (called from app or via cron in future)
CREATE OR REPLACE FUNCTION public.refresh_evidence_document_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at < CURRENT_DATE THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER evidence_documents_status_refresh
  BEFORE INSERT OR UPDATE ON public.evidence_documents
  FOR EACH ROW EXECUTE FUNCTION public.refresh_evidence_document_status();

-- Seed Chapter 8 categories
INSERT INTO public.evidence_categories (slug, name, description, sort_order, chapter8_reference, required_doc_types, default_review_cadence_months) VALUES
  ('qi-plan-policy', 'QI/QA Plan & Policy', 'Written QI/QA plan, charter, and approved policies governing quality program.', 1, 'Chapter 8 §I.A', ARRAY['policy','procedure'], 12),
  ('operating-procedures', 'Operating Procedures', 'Clinical guidelines, patient safety, satisfaction, grievances, periodic assessments, report generation.', 2, 'Chapter 8 §I.B', ARRAY['procedure'], 12),
  ('job-descriptions', 'Job Descriptions w/ QI Responsibilities', 'Position descriptions documenting QI/QA accountability.', 3, 'Chapter 8 §I.C', ARRAY['job_description'], 24),
  ('qi-schedule', 'QI/QA Assessment Schedule', 'Annual calendar of planned QI assessments and audits.', 4, 'Chapter 8 §II.A', ARRAY['schedule'], 12),
  ('meeting-minutes', 'Meeting Minutes', 'QI committee and board meeting minutes documenting QI review.', 5, 'Chapter 8 §II.B', ARRAY['minutes'], 3),
  ('patient-satisfaction', 'Patient Satisfaction Surveys', 'Survey instruments, results, and action plans.', 6, 'Chapter 8 §III.A', ARRAY['survey_report'], 12),
  ('dashboards-reports', 'Dashboards & Supporting Data', 'UDS dashboards, SPC charts, performance reports.', 7, 'Chapter 8 §III.B', ARRAY['dashboard_report'], 3),
  ('pdsa-packets', 'PDSA Cycle Packets', 'Completed PDSA cycles with linked evidence (auto-populated).', 8, 'Chapter 8 §IV', ARRAY['pdsa_packet'], 12);
