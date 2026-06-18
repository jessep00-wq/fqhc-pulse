ALTER TABLE public.playbook_leads
  ADD COLUMN IF NOT EXISTS nurture_step integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_nurture_sent_at timestamptz;