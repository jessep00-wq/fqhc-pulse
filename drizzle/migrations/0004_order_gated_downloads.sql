ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS download_token text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS download_expires_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS orders_download_token_key ON public.orders (download_token) WHERE download_token IS NOT NULL;
COMMENT ON COLUMN public.orders.download_token IS 'Random secret used in emailed download links; each click is re-checked against order status so refunds revoke access.';