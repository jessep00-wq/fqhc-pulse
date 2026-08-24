ALTER TABLE public.osv_quiz_leads
  ADD COLUMN IF NOT EXISTS nurture_step integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_nurture_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS osv_quiz_leads_nurture_idx
  ON public.osv_quiz_leads (nurture_step, created_at)
  WHERE unsubscribed_at IS NULL;