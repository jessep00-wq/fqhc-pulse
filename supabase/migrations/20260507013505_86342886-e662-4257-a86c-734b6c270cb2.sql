
-- Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Add columns to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'lead',
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS source TEXT;

-- Index for admin queries on org stage
CREATE INDEX idx_organizations_stage ON public.organizations (stage);
