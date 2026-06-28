
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.reset_stale_generating_drafts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.content_drafts
     SET status = 'failed',
         generation_error = 'Stale: generation did not complete in time'
   WHERE status = 'generating'
     AND updated_at < now() - interval '3 minutes';
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- Unschedule any prior version of this job so re-running the migration is safe
DO $$
DECLARE jid bigint;
BEGIN
  FOR jid IN SELECT jobid FROM cron.job WHERE jobname = 'reset-stale-generating-drafts'
  LOOP
    PERFORM cron.unschedule(jid);
  END LOOP;
END $$;

SELECT cron.schedule(
  'reset-stale-generating-drafts',
  '*/5 * * * *',
  $$SELECT public.reset_stale_generating_drafts();$$
);

-- One-time cleanup of currently stuck rows
UPDATE public.content_drafts
   SET status = 'failed',
       generation_error = 'Stale: cleaned up on deploy'
 WHERE status = 'generating'
   AND updated_at < now() - interval '5 minutes';
