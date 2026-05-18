
-- 1. Lead tracking columns
ALTER TABLE public.playbook_leads
  ADD COLUMN IF NOT EXISTS welcome_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT ARRAY['Playbook Lead']::text[],
  ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS idx_playbook_leads_reminder_pending
  ON public.playbook_leads (created_at)
  WHERE reminder_sent_at IS NULL;

-- 2. Coming soon flag on products
ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS is_coming_soon boolean NOT NULL DEFAULT false;

UPDATE public.store_products
  SET is_coming_soon = true
  WHERE slug = 'uds-measure-template-pack';

-- 3. Enable pg_cron + pg_net for scheduled follow-ups (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
