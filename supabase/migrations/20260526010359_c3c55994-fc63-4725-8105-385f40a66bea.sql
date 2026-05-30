ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.newsletters ADD COLUMN IF NOT EXISTS sent_count integer NOT NULL DEFAULT 0;