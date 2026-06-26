
-- ============================================================
-- content_topics
-- ============================================================
CREATE TABLE public.content_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  angle text,
  priority integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'queued', -- queued | used | archived
  notes text,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_topics TO authenticated;
GRANT ALL ON public.content_topics TO service_role;
ALTER TABLE public.content_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "founder admins manage topics"
  ON public.content_topics FOR ALL
  USING (public.is_founder_admin(auth.uid()))
  WITH CHECK (public.is_founder_admin(auth.uid()));
CREATE TRIGGER trg_content_topics_updated_at
  BEFORE UPDATE ON public.content_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- content_settings (singleton)
-- ============================================================
CREATE TABLE public.content_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  schedule_enabled boolean NOT NULL DEFAULT true,
  schedule_cron text NOT NULL DEFAULT '0 13 * * 1', -- weekly Monday 13:00 UTC; gated to 1st Monday in edge fn
  schedule_label text NOT NULL DEFAULT '1st Monday of each month, 09:00 ET',
  recipient_email text NOT NULL DEFAULT 'jessep_00@hotmail.com',
  model text NOT NULL DEFAULT 'openai/gpt-5',
  brand_voice_prompt text NOT NULL DEFAULT 'Credible, practical, executive-level. Avoid hype, marketing fluff, and emojis. Write for healthcare quality and operations leaders who value clarity and operational specifics.',
  audience text NOT NULL DEFAULT 'Quality Directors, COOs, and PCMH/HRSA leadership at FQHCs and health systems.',
  tone_keywords text[] NOT NULL DEFAULT ARRAY['credible','operational','specific','executive','evidence-led'],
  banned_phrases text[] NOT NULL DEFAULT ARRAY['game-changer','revolutionary','synergy','cutting-edge','unlock'],
  reference_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_run_at timestamptz,
  last_run_status text,
  last_run_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_settings TO authenticated;
GRANT ALL ON public.content_settings TO service_role;
ALTER TABLE public.content_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "founder admins manage content settings"
  ON public.content_settings FOR ALL
  USING (public.is_founder_admin(auth.uid()))
  WITH CHECK (public.is_founder_admin(auth.uid()));
CREATE TRIGGER trg_content_settings_updated_at
  BEFORE UPDATE ON public.content_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.content_settings DEFAULT VALUES;

-- ============================================================
-- content_drafts
-- ============================================================
CREATE TABLE public.content_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  source_topic_id uuid REFERENCES public.content_topics(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending_review', -- generating | pending_review | approved | rejected | published | failed
  model text,
  blog_title text,
  blog_slug text,
  blog_excerpt text,
  blog_body_md text,
  blog_meta_description text,
  blog_cta text,
  newsletter_subject text,
  newsletter_body_md text,
  linkedin_post text,
  rejection_reason text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at timestamptz,
  published_blog_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  published_newsletter_id uuid REFERENCES public.newsletters(id) ON DELETE SET NULL,
  triggered_by text NOT NULL DEFAULT 'cron', -- cron | manual
  generation_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_content_drafts_status ON public.content_drafts(status);
CREATE INDEX idx_content_drafts_generated_at ON public.content_drafts(generated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_drafts TO authenticated;
GRANT ALL ON public.content_drafts TO service_role;
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "founder admins manage content drafts"
  ON public.content_drafts FOR ALL
  USING (public.is_founder_admin(auth.uid()))
  WITH CHECK (public.is_founder_admin(auth.uid()));
CREATE TRIGGER trg_content_drafts_updated_at
  BEFORE UPDATE ON public.content_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- content_activity_log
-- ============================================================
CREATE TABLE public.content_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid REFERENCES public.content_drafts(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_label text, -- e.g. 'cron', 'system'
  action text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_content_activity_log_draft ON public.content_activity_log(draft_id, created_at DESC);
CREATE INDEX idx_content_activity_log_created_at ON public.content_activity_log(created_at DESC);
GRANT SELECT, INSERT ON public.content_activity_log TO authenticated;
GRANT ALL ON public.content_activity_log TO service_role;
ALTER TABLE public.content_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "founder admins read activity"
  ON public.content_activity_log FOR SELECT
  USING (public.is_founder_admin(auth.uid()));
CREATE POLICY "founder admins write activity"
  ON public.content_activity_log FOR INSERT
  WITH CHECK (public.is_founder_admin(auth.uid()));
-- UPDATE/DELETE intentionally omitted: activity log is append-only audit trail.

-- ============================================================
-- linkedin_shares
-- ============================================================
CREATE TABLE public.linkedin_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid NOT NULL REFERENCES public.content_drafts(id) ON DELETE CASCADE,
  shared_at timestamptz NOT NULL DEFAULT now(),
  shared_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  external_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_linkedin_shares_draft ON public.linkedin_shares(draft_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkedin_shares TO authenticated;
GRANT ALL ON public.linkedin_shares TO service_role;
ALTER TABLE public.linkedin_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "founder admins manage linkedin shares"
  ON public.linkedin_shares FOR ALL
  USING (public.is_founder_admin(auth.uid()))
  WITH CHECK (public.is_founder_admin(auth.uid()));
