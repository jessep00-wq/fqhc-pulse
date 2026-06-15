# Backend cleanup + outbound campaign assets

Two-phase plan: (1) close the backend loop, (2) ship outbound assets in sequence.

## Phase 1 — Backend cleanup (verification only)

### 1a. Confirm `send-waitlist-nurture` cron is live
- Manually invoke the function once with the `x-cron-secret` header (server-side via SQL `net.http_post`, same payload as the scheduled job).
- Fetch its edge function logs to confirm a real invocation now lands (vs. the previous "no logs ever").
- Report `{ sent, failed, skipped, considered }` from the response. With `waitlist_applications` currently empty, expected output is `considered: 0`.
- No code changes needed — the `config.toml` registration from the earlier turn is the only fix required.

### 1b. Signup smoke test (end-to-end auth email via Resend)
- Need from you: one throwaway email address (Gmail+alias works, e.g. `you+mwsmoke@gmail.com`) that you can check the inbox on.
- I will trigger a real signup against the live site through `supabase.auth.signUp`.
- Then query `email_send_log` filtered to that recipient, dedup'd by `message_id`, and read the final status (`sent` vs `failed` vs `suppressed`).
- Cross-check the recipient inbox for the actual confirmation email.
- If `status = sent` and the email lands, the Resend + auth-email-hook + queue + DNS chain is fully green. If not, the log row tells us exactly which stage broke.

No app-code changes in Phase 1 — verification only.

## Phase 2 — Outbound assets (sequenced)

### 2a. Cold-email sequence (3 emails) — ship this turn
Plain text + minimal HTML, written for Jessica R. Smith → FQHC Quality Director. Saved as Markdown so you can paste into any sender (Apollo, Instantly, Gmail).

Files (new):
- `outbound/cold-email/01-intro-osv-binder.md` — opener: HRSA OSV pain, 1 specific insight, soft CTA to a 15-min call.
- `outbound/cold-email/02-evidence-drop.md` — value drop: link to free Sample Audit Binder PDF (already at `/MeasureWise_Sample_Export.pdf`) + 1-sentence proof point.
- `outbound/cold-email/03-breakup.md` — permission close; "should I close the loop?"
- `outbound/cold-email/README.md` — send cadence (Day 0 / Day 4 / Day 11), subject-line A/B variants, merge fields (`{{first_name}}`, `{{health_center}}`, `{{state}}`), and a 1-paragraph ICP definition for list-building.

### 2b. LinkedIn outreach scripts — ship this turn
Files (new):
- `outbound/linkedin/connection-request.md` — sub-300-char connect note variants.
- `outbound/linkedin/dm-sequence.md` — 3-touch DM script post-accept (intro / resource share / soft ask).
- `outbound/linkedin/posts.md` — 3 ready-to-post drafts from Jessica's POV (HRSA reviewer perspective, PDSA-as-proof, "what auditors actually open first").

### 2c. HRSA SVP Readiness Score lead magnet — ship this turn
Highest-leverage piece. Public, indexable, captures email, sends a personalized PDF. No login required.

**Route + UI**
- `src/pages/ReadinessScore.tsx` — `/readiness`. Single-page flow:
  1. Hero + 1-paragraph promise + "Start 2-minute assessment" CTA.
  2. 10 yes/no/partial questions across 4 HRSA SVP categories (Governance, QI/QA, Clinical Staffing, Risk Mgmt). Progress bar.
  3. Email + first name + health center capture (required to see score).
  4. Score reveal: 0–100, color-coded tier (At Risk / Building / Audit-Ready), top 3 gaps, CTA to book a call + try the app trial.
- `src/components/readiness/QuestionCard.tsx`, `ScoreReveal.tsx`, `GapList.tsx`.
- `src/lib/readiness/questions.ts` — questions, weights, category mapping.
- `src/lib/readiness/scoring.ts` — pure scoring logic + tier assignment + gap selection.
- SEO: full `<SEO>` head, JSON-LD `Quiz` schema, sitemap entry, robots allow.
- Link from homepage hero secondary CTA + `/for/qi-directors` page.

**Data**
- New table `readiness_submissions` (id, email, first_name, health_center, state, answers jsonb, score int, tier text, created_at) with RLS:
  - `INSERT` allowed to `anon` (public capture) with required-fields check.
  - `SELECT` allowed only to `founder_admin`.
  - `GRANT INSERT ON public.readiness_submissions TO anon, authenticated;` + `GRANT ALL TO service_role;`
- Trigger after-insert calls edge function via `pg_net` to send the report email (fire-and-forget).

**Email delivery**
- New edge function `send-readiness-report` (verify_jwt=false; secured by service-role calling pattern + idempotency key).
  - Renders a branded HTML email via the existing transactional pattern (Resend + `measurewise.org` sender).
  - Embeds a PDF link OR inline scorecard (start with inline scorecard — no PDF generation needed for v1; PDF can come in a follow-up).
  - Logs to `email_send_log` with `template_name = 'readiness-report'` and idempotency key `readiness-${submission_id}`.

**Admin visibility**
- New page `src/pages/admin/AdminReadinessLeads.tsx` route `/admin/readiness` — list of submissions, score, tier, contact info, exportable to CSV. Behind existing `AdminRoute`.
- Sidebar link in `AdminSidebar.tsx`.

**Tracking**
- `trackEvent('readiness_started')`, `'readiness_completed'`, `'readiness_email_captured'` via existing PostHog wrapper.
- Google Ads conversion event on completion (existing `gtag` global).

## Out of scope (this round)
- PDF generation for the readiness report (v1 uses inline HTML scorecard).
- Automated nurture sequence for readiness leads (manual CSV export to your sender is fine for first batch).
- Building or buying a prospect list — copy + funnel only, list-building is on you.
- Paid Google Ads campaign setup.

## What I need from you
- **One throwaway email** (e.g. `you+mwsmoke@gmail.com`) to run the signup smoke test against.
- Confirmation that scaffolding the lead magnet under `/readiness` is the right slug (vs `/svp-readiness` or `/audit-readiness`).

## Build order
1. Cron verification (read-only).
2. Cold-email + LinkedIn markdown files (no app impact).
3. Lead magnet: types/scoring lib → questions → page UI → DB table + RLS + grants → edge function + email template → admin page + sidebar → SEO + sitemap → tracking.
4. Smoke test signup (after you provide the email).
5. Quick QA pass in the preview on `/readiness` end-to-end.
