
## Goal

Add an AI Content Operations module inside the existing `/admin` console that drafts a blog post + newsletter + LinkedIn snippet every month, routes it through a review/approval queue, then publishes to the existing `blog_posts` and `newsletters` tables. LinkedIn stays manual.

## What gets added

### 1. New admin route: `/admin/content`
Native to the current admin layout (`AdminLayout` + `AdminSidebar`). Reuses founder_admin role guard via `AdminRoute`. New sidebar entry: "Content Ops".

Sub-views (single page with tabs to keep IA shallow):

1. **Dashboard** — KPI tiles (Awaiting Review, Drafts This Month, Published YTD, Last Run Status) + "Awaiting Review" list pinned at top.
2. **Calendar** — month grid showing scheduled run dates, generated drafts, publish dates.
3. **Review Queue** — list of `pending_review` drafts.
4. **Review Editor** (drill-in) — 3-column layout: Blog | Newsletter | LinkedIn, each independently editable, with Approve / Reject / Regenerate / Save Draft actions. Meta description + CTA + excerpt edited in the Blog column header.
5. **Brand Voice / AI Settings** — system prompt, tone descriptors, target audience, banned phrases, reference URLs of prior approved posts (auto-fed into context).
6. **Topic Library** — CRUD list of upcoming topics/themes; next run pulls the highest-priority unused topic.
7. **Publishing Log** — read-only feed from `content_activity_log`.
8. **LinkedIn Share Queue** — approved LinkedIn posts with Copy / Open LinkedIn / Mark Shared buttons. Never auto-posts.
9. **Automation Settings** — schedule toggle, "1st Monday 09:00 ET" default (editable cron), recipient email (defaults to `jessep_00@hotmail.com`), model (default `openai/gpt-5`), Run Now button.

### 2. Database (new tables, minimum set)

- `content_drafts` — id, organization_id (nullable, MeasureWise-global), topic, status (`generating|pending_review|approved|rejected|published|failed`), blog_title, blog_excerpt, blog_body_md, blog_meta_description, blog_cta, newsletter_subject, newsletter_body_md, linkedin_post, model, source_topic_id, generated_at, reviewed_at, reviewed_by, published_blog_id, published_newsletter_id, rejection_reason.
- `content_topics` — id, title, angle, priority, status (`queued|used|archived`), notes.
- `content_settings` — singleton row: schedule_cron, schedule_enabled, recipient_email, model, brand_voice_prompt, audience, tone_keywords, banned_phrases, reference_urls (jsonb).
- `content_activity_log` — id, draft_id, actor_user_id, action (`generated|edited|approved|rejected|regenerated|published_blog|published_newsletter|linkedin_marked_shared|run_failed`), payload, created_at.
- `linkedin_shares` — id, draft_id, shared_at, shared_by, external_url (optional manual entry).

All tables RLS-locked to `founder_admin` only via `is_founder_admin(auth.uid())`. Standard GRANTs.

### 3. Edge functions

- `generate-content-draft` — Lovable AI Gateway call using `openai/gpt-5` with `Output.object` schema (blog_title, excerpt, body_md, meta_description, cta, newsletter_subject, newsletter_body_md, linkedin_post). Inputs: topic from `content_topics` (or override), brand voice + audience from `content_settings`, last 3 approved drafts as reference. Inserts `content_drafts` row, triggers `send-transactional-email` ("draft ready"). Accepts `{ triggered_by: 'cron'|'manual', topic_id? }`. Guarded by `x-cron-secret` header for cron, founder_admin JWT for manual.
- `publish-content-draft` — on approve: inserts into existing `blog_posts` (status `published`) AND `newsletters` (status `draft` so you send manually from AdminNewsletter). Updates draft status, logs activity.
- Reuse existing `send-transactional-email` for the "draft ready" notification (new template `content-draft-ready` scaffolded under `_shared/transactional-email-templates/`).

### 4. Scheduling

pg_cron job `generate-content-draft-monthly`: cron expression `0 13 1-7 * 1` (1st Monday of month, 13:00 UTC ≈ 09:00 ET; edge function rejects if not the 1st Monday — matches the "1st Monday" rule across DST). Calls edge function with `x-cron-secret` header.

Manual "Run now" button calls the same edge function via `supabase.functions.invoke` (JWT-authed) so testing doesn't wait for cron.

### 5. Email notification

New React Email template `content-draft-ready.tsx`. Subject: "MeasureWise draft ready for review — {{title}}". CTA links to `/admin/content/review/{draftId}`. Sent to `jessep_00@hotmail.com` (configurable in Automation Settings).

### 6. Reuse / no duplication

- Same auth, same `AdminRoute`, same `AdminLayout`/`AdminSidebar`, same shadcn primitives.
- Publishes into existing `blog_posts` (already drives `/blog` + `BlogPostDynamic`) and `newsletters` (drives `/newsletter` + `AdminNewsletter`).
- No new CMS, no new public surface, no new auth.

### 7. Guardrails (enforced in code)

- Never auto-publishes — `publish-content-draft` requires `status='approved'` set by an authenticated founder_admin.
- Never auto-posts to LinkedIn — `linkedin_shares` row only created when user clicks "Mark Shared".
- All state changes log to `content_activity_log` and surface in Publishing Log + Dashboard.
- `Run Now` is the only synchronous trigger; cron is the only schedule.

## Out of scope (explicitly)

- No LinkedIn API integration (manual only, per request).
- No multi-tenant content (MeasureWise-global module; org_id stays null).
- No image generation for posts in v1 (can add later via Lovable AI image tier).

## Files touched (high-level)

**New**
- `supabase/migrations/<ts>_content_ops.sql`
- `supabase/migrations/<ts>_content_ops_cron.sql`
- `supabase/functions/generate-content-draft/index.ts`
- `supabase/functions/publish-content-draft/index.ts`
- `supabase/functions/_shared/transactional-email-templates/content-draft-ready.tsx`
- `src/pages/admin/AdminContent.tsx` (tabs shell)
- `src/pages/admin/content/{Dashboard,Calendar,ReviewQueue,ReviewEditor,BrandVoice,TopicLibrary,PublishingLog,LinkedInQueue,AutomationSettings}.tsx`
- `src/hooks/useContentDrafts.ts`, `useContentSettings.ts`

**Edited**
- `src/App.tsx` — add `/admin/content` and `/admin/content/review/:id` routes.
- `src/components/AdminSidebar.tsx` — add "Content Ops" nav item.
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — register new template.

## Open question deferred

Brand voice prompt and initial topic list are seeded empty; you'll fill them in Brand Voice / Topic Library before the first run. Run Now will still work with placeholder defaults for early testing.
