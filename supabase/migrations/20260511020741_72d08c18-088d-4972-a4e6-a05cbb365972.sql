
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox';

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id
  ON public.subscriptions (stripe_subscription_id);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

-- Allow the public to look up a single order by its Stripe session id.
-- Session ids are long opaque tokens, only known to the buyer (in the success URL).
CREATE POLICY "Public can read order by session id"
  ON public.orders
  FOR SELECT
  TO anon, authenticated
  USING (stripe_session_id IS NOT NULL);
