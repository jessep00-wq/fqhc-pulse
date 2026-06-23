-- Clean up any pre-existing orphan rows so the FK can be added without error.
DELETE FROM public.org_financials f
WHERE NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = f.organization_id);

-- Add the missing FK with cascade so org deletion is automatic.
ALTER TABLE public.org_financials
  ADD CONSTRAINT org_financials_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES public.organizations(id)
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS org_financials_organization_id_idx
  ON public.org_financials (organization_id);
