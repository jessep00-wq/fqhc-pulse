
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS org_type text,
  ADD COLUMN IF NOT EXISTS reporting_period text,
  ADD COLUMN IF NOT EXISTS quality_lead_name text,
  ADD COLUMN IF NOT EXISTS quality_lead_email text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS data_mode text NOT NULL DEFAULT 'live';

ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_data_mode_check;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_data_mode_check CHECK (data_mode IN ('demo','live'));
