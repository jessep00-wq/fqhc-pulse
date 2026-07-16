
-- Unschedule any related cron jobs (ignore if missing)
DO $$
DECLARE j text;
BEGIN
  FOR j IN SELECT jobname FROM cron.job
    WHERE jobname IN (
      'send-osv-nurture','send-newsletter','send-waitlist-nurture',
      'weekly-newsletter','osv-nurture','newsletter-send','waitlist-nurture'
    )
  LOOP
    PERFORM cron.unschedule(j);
  END LOOP;
END $$;

-- Drop tables (cascade removes dependent policies/indexes/triggers)
DROP TABLE IF EXISTS public.osv_quiz_leads CASCADE;
DROP TABLE IF EXISTS public.newsletters CASCADE;
DROP TABLE IF EXISTS public.newsletter_subscribers CASCADE;
DROP TABLE IF EXISTS public.blog_posts CASCADE;
DROP TABLE IF EXISTS public.waitlist_applications CASCADE;
DROP TABLE IF EXISTS public.linkedin_shares CASCADE;
DROP TABLE IF EXISTS public.content_activity_log CASCADE;
DROP TABLE IF EXISTS public.content_drafts CASCADE;
DROP TABLE IF EXISTS public.content_topics CASCADE;
DROP TABLE IF EXISTS public.content_settings CASCADE;

-- Drop unused waitlist admin helper
DROP FUNCTION IF EXISTS public.admin_delete_waitlist_application(uuid);
