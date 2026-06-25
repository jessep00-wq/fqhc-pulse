CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remove any prior schedule with the same name to keep this idempotent
DO $$
BEGIN
  PERFORM cron.unschedule('send-playbook-followups-daily');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'send-playbook-followups-daily',
  '0 14 * * *',
  $$
  SELECT net.http_post(
    url := 'https://eeyigxcwewdqfeidqbxk.supabase.co/functions/v1/send-playbook-followups',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVleWlneGN3ZXdkcWZlaWRxYnhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjExMDUsImV4cCI6MjA5MDAzNzEwNX0.SsUnCR-RUBVowGbzaocxCNCB_JvmXjaJdz5CWtby-0Q',
      'x-cron-secret', public.get_cron_secret()
    ),
    body := jsonb_build_object('triggered_at', now())
  ) AS request_id;
  $$
);