ALTER TABLE public.pdsa_cycles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

DROP TRIGGER IF EXISTS pdsa_cycles_updated_at ON public.pdsa_cycles;
CREATE TRIGGER pdsa_cycles_updated_at
  BEFORE UPDATE ON public.pdsa_cycles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

UPDATE public.pdsa_cycles c
SET updated_at = COALESCE(
  (SELECT max(r.created_at) FROM public.record_revisions r
    WHERE r.record_type = 'pdsa_cycle' AND r.record_id = c.id),
  c.created_at
);

CREATE INDEX IF NOT EXISTS pdsa_cycles_org_active_idx
  ON public.pdsa_cycles (organization_id, updated_at DESC)
  WHERE deleted_at IS NULL;