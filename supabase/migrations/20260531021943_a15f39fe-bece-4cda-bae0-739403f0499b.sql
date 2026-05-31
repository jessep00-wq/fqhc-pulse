SELECT cron.schedule(
  'waitlist-nurture-hourly',
  '7 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://eeyigxcwewdqfeidqbxk.supabase.co/functions/v1/send-waitlist-nurture',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);