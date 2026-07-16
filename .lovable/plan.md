## Simplify: strip marketing/growth surface area back to core product

Goal: remove the OSV quiz, Growth admin, Newsletter, Blog, Resources, Waitlist, and OSV/Waitlist debug pages so the app is just: public marketing (Landing, Pricing, About, Contact, Security, HowItWorks, Personas, Features, Case Studies, Store) → Auth → `/dashboard` → `/admin` (Oversight + Content-lite + Store + Readiness Leads).

### 1. OSV Panic Index quiz — full removal
- Delete `src/pages/OsvQuiz.tsx`, `src/lib/osvQuiz.ts`, `src/pages/admin/AdminOsvLeads.tsx`.
- Delete edge functions: `send-osv-result`, `send-osv-nurture`, `osv-unsubscribe`, plus `supabase/functions/_shared/osv-nurture-emails.ts` and `_shared/osv-unsub.ts`. Call `supabase--delete_edge_functions` for the three deployed functions.
- Remove any cron schedule for `send-osv-nurture` (drop via migration if it exists in `cron.job`).
- Drop `osv_quiz_leads` table (migration) and any references in `email_send_log`/`email_unsubscribe_tokens` are left intact.
- Remove routes and nav entries (AdminSidebar "OSV Quiz Leads", any Landing/Pricing CTA linking to `/osv-quiz`).

### 2. Growth admin — full removal
- Delete `src/pages/admin/growth/` (Overview, Leads, Email, Traffic).
- Remove the "Growth Ops" group from `AdminSidebar.tsx`.
- Remove `/admin/growth*` routes from `App.tsx`.

### 3. Newsletter — full removal
- Delete `src/pages/NewsletterIndex.tsx`, `NewsletterDetail.tsx`, `NewsletterUnsubscribe.tsx`, `src/pages/admin/AdminNewsletter.tsx`, `src/components/newsletter/`, `src/types/newsletter.ts`.
- Delete edge functions: `subscribe-newsletter`, `newsletter-welcome`, `newsletter-unsubscribe`, `send-newsletter`, `weekly-digest` (weekly-digest is newsletter-only — confirm below).
- Drop tables `newsletters` and `newsletter_subscribers` (migration).
- Remove Newsletter link from `AdminSidebar` and any footer/nav links on public pages.

### 4. Blog — full removal (no static keep)
- Delete `src/pages/blog/` (Index + 4 static posts + dynamic route) and `src/pages/admin/AdminBlog.tsx`.
- Drop `blog_posts` table.
- Remove `/blog*` and `/admin/blog` routes, and Blog link in AdminSidebar + any public nav/footer link.
- Assumption: dropping all four posts rather than keeping any. Flag me if you want to preserve one or two as hardcoded pages.

### 5. Resources (9 articles) — full removal
- Delete `src/pages/resources/` entirely and `src/components/ResourcePage.tsx` if only used there.
- Remove `/resources/*` routes and any links from Landing/personas/features/footer.
- Update `public/sitemap.xml` and `public/llms.txt` to drop these URLs.

### 6. Waitlist flow — full removal
- Delete `src/pages/waitlist/` (Landing, Apply, ThankYou, css).
- Delete edge function `submit-waitlist-application` and `send-waitlist-nurture`, plus `_shared/waitlist-nurture-emails.ts`.
- Drop `waitlist_applications` table (migration).
- Remove `/waitlist*` routes and any homepage/Pricing CTA pointing to waitlist. Pricing becomes the single entry point.

### 7. Waitlist admin debug pages
- Delete `src/pages/admin/WaitlistStatus.tsx`, `WaitlistTest.tsx`.
- Delete edge functions `admin-waitlist-status` and `admin-waitlist-test`.
- Remove "Waitlist Tester" and "Waitlist Status" from AdminSidebar `tools` group.
- Also remove the `admin_delete_waitlist_application` DB function (no longer referenced).

### 8. Post-cleanup verification
- `rg` for stale imports and route strings (`/osv-quiz`, `/waitlist`, `/blog`, `/resources`, `/newsletter`, `/admin/growth`, `AdminOsvLeads`, `NewsletterSectionRenderer`, etc.).
- Run typecheck + build; fix broken imports on Landing/Footer/PublicPageLayout as they surface.
- Update `public/sitemap.xml`, `public/llms.txt`, `public/robots.txt` if needed, and any SEO `<link rel=canonical>` references.

### What survives in `/admin`
Oversight (Accounts, Users, Adoption, Billing) · Content Ops + Store (kept — paid product) · Readiness Leads (kept — feeds real Pricing trial funnel).

### Technical notes / open questions

1. **Contact form + Pricing trial** remain the only lead-capture surfaces. Confirm.
2. **`weekly-digest` function** — I'll read it to confirm it's newsletter-only before deleting. If it also emails in-app users, I'll keep it.
3. **Case Studies, Personas, Feature pages, Store, Playbook Library, Readiness Score** — all kept as-is (not in your removal list).
4. **Data loss:** dropping `osv_quiz_leads`, `newsletters`, `newsletter_subscribers`, `blog_posts`, `waitlist_applications` is destructive. If you want a CSV export of any before drop, say so and I'll add an export step before the migration.
5. **Deployed edge functions** get removed via `supabase--delete_edge_functions` so they stop serving after publish.

Reply with any adjustments (e.g. keep a blog post, export data first) and I'll switch to build mode.
