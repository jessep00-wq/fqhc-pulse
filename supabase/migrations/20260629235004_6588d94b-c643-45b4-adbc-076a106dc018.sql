
-- Update existing categories to new template structure
UPDATE public.evidence_categories SET sort_order = 1, name = 'QI/QA Plan & Governing Policy', chapter8_reference = 'Chapter 10 §I.A', required_doc_types = ARRAY['policy','procedure'] WHERE slug = 'qi-plan-policy';
UPDATE public.evidence_categories SET sort_order = 2, name = 'Operating Procedures', chapter8_reference = 'Chapter 10 §I.B', required_doc_types = ARRAY['procedure'] WHERE slug = 'operating-procedures';
UPDATE public.evidence_categories SET sort_order = 4, name = 'Job Descriptions with QI Responsibilities', chapter8_reference = 'Chapter 10 §I.C / SVP Element b.3.2', required_doc_types = ARRAY['job_description'] WHERE slug = 'job-descriptions';
UPDATE public.evidence_categories SET sort_order = 5, name = 'QI/QA Assessment Schedule', chapter8_reference = 'Chapter 10 §II.A', required_doc_types = ARRAY['schedule'] WHERE slug = 'qi-schedule';
UPDATE public.evidence_categories SET sort_order = 7, name = 'Meeting Minutes', chapter8_reference = 'Chapter 10 §II.C', required_doc_types = ARRAY['minutes'] WHERE slug = 'meeting-minutes';
UPDATE public.evidence_categories SET sort_order = 8, name = 'Patient Satisfaction Surveys', chapter8_reference = 'Chapter 10 §III.A', required_doc_types = ARRAY['survey_report'] WHERE slug = 'patient-satisfaction';
UPDATE public.evidence_categories SET sort_order = 9, name = 'Dashboards & Supporting Performance Data', chapter8_reference = 'Chapter 10 §III.B', required_doc_types = ARRAY['dashboard_report'] WHERE slug = 'dashboards-reports';
UPDATE public.evidence_categories SET sort_order = 10, name = 'PDSA Cycle Packets', chapter8_reference = 'Chapter 10 §IV', required_doc_types = ARRAY['pdsa_packet'] WHERE slug = 'pdsa-packets';

-- Insert the 4 new categories
INSERT INTO public.evidence_categories (slug, name, description, sort_order, chapter8_reference, required_doc_types, default_review_cadence_months)
VALUES
  ('committee-structure', 'QI/QA Committee Structure & Oversight', 'Committee charter, roster, org chart, and oversight evidence demonstrating a functioning QI committee.', 3, 'Chapter 10 §I.C', ARRAY['policy','other'], 12),
  ('assessment-samples', 'QI/QA Assessment Samples', 'Completed assessment reports with findings, root cause analysis, and corrective action — at least two from the past 12 months.', 6, 'Chapter 10 §II.B', ARRAY['survey_report','other'], 12),
  ('board-oversight', 'Board Oversight Evidence', 'Board minutes showing quality dashboards/reports presented and engaged with at the board level.', 11, 'Chapter 19 / Chapter 10', ARRAY['minutes'], 12),
  ('credentialing-peer-review', 'Credentialing, Privileging & Peer Review', 'Peer review policy and blinded peer review activity summary — required under FTCA deeming.', 12, 'Chapter 10 §V / Chapter 21 (FTCA)', ARRAY['policy','other'], 12)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  chapter8_reference = EXCLUDED.chapter8_reference,
  required_doc_types = EXCLUDED.required_doc_types,
  description = EXCLUDED.description;
