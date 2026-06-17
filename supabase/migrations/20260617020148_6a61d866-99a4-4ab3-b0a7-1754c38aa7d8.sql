SELECT cron.unschedule('waitlist-nurture-hourly');

SELECT cron.schedule(
  'waitlist-nurture-hourly',
  '7 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://eeyigxcwewdqfeidqbxk.supabase.co/functions/v1/send-waitlist-nurture',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);