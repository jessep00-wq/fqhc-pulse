ALTER TABLE public.manual_downloads
  ADD COLUMN IF NOT EXISTS claim_ticket text,
  ADD COLUMN IF NOT EXISTS claim_ticket_expires_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS manual_downloads_claim_ticket_key
  ON public.manual_downloads (claim_ticket)
  WHERE claim_ticket IS NOT NULL;

CREATE INDEX IF NOT EXISTS manual_downloads_expires_at_idx
  ON public.manual_downloads (expires_at);

REVOKE ALL ON public.manual_downloads FROM anon, authenticated;
GRANT ALL ON public.manual_downloads TO service_role;