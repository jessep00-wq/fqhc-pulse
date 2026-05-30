
CREATE TABLE public.manual_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  stripe_session_id text NOT NULL UNIQUE,
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  buyer_org  text NOT NULL,
  paid_at    timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  downloaded_at timestamptz,
  download_ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.manual_downloads TO service_role;

ALTER TABLE public.manual_downloads ENABLE ROW LEVEL SECURITY;

-- No user-facing policies: only service_role (used by edge functions) reads/writes.
CREATE POLICY "Service role manages manual downloads"
ON public.manual_downloads
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_manual_downloads_token ON public.manual_downloads(token);
CREATE INDEX idx_manual_downloads_session ON public.manual_downloads(stripe_session_id);
