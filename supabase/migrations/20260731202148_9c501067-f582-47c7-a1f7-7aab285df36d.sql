DROP TABLE IF EXISTS public.evidence_document_versions CASCADE;
DROP TABLE IF EXISTS public.evidence_documents CASCADE;
DROP TABLE IF EXISTS public.evidence_categories CASCADE;
DROP TABLE IF EXISTS public.evidence_binder_exports CASCADE;

DROP FUNCTION IF EXISTS public.refresh_evidence_document_status() CASCADE;

ALTER TABLE public.qi_reports DROP COLUMN IF EXISTS evidence_document_id;

DROP POLICY IF EXISTS "evidence_binder_select" ON storage.objects;
DROP POLICY IF EXISTS "evidence_binder_insert" ON storage.objects;
DROP POLICY IF EXISTS "evidence_binder_update" ON storage.objects;
DROP POLICY IF EXISTS "evidence_binder_delete" ON storage.objects;