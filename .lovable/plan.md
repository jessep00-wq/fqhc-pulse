# MeasureWise Waitlist — Landing, Form, Confirmation, Nurture Sequence

Add a self-contained waitlist funnel mirroring the four uploaded designs, with persistent storage and an automated 5-email nurture drip that follows the cadence in the PDF.

## 1. Routes & Pages (`src/pages/waitlist/`)

Three new React pages, each preserving the look-and-feel from the uploaded HTML files (Instrument Serif + DM Sans, warm neutral palette, teal `#01696f` accent) using a scoped CSS module so styles don't leak into the rest of the app.

| Route | Page | Source HTML |
|---|---|---|
| `/waitlist` | `WaitlistLanding.tsx` — marketing landing with hero, problem grid, fit grid, process, CTA | `measurewise-waitlist-landing.html` |
| `/waitlist/apply` | `WaitlistApply.tsx` — application form (contact, org profile, need/urgency, primary concern, timing, investment readiness) | `measurewise-waitlist-form (1).html` |
| `/waitlist/thank-you` | `WaitlistThankYou.tsx` — "Application received" confirmation with next-steps list | `measurewise-confirmation (1).html` |

All three wired into `src/App.tsx` as public routes. SEO meta via the existing `<SEO>` component. Logo links use the canonical `<Logo>` component. Theme toggle script from the originals dropped (the rest of the site doesn't support per-page dark mode toggling).

The landing page's "Apply" button → `/waitlist/apply`. The form submits → calls `submit-waitlist-application` edge function → on success redirects to `/waitlist/thank-you`.

## 2. Navigation entry points

- Add a "Waitlist" link in the public landing page footer and in the `PublicPageLayout` nav (alongside Pricing / Blog).
- Add a small "Join the waitlist" CTA card to `Pricing.tsx` for visitors who aren't ready to self-serve.

## 3. Database — `waitlist_applications` table

New migration creating:

```text
waitlist_applications
  id uuid pk
  name, title, organization, state, email, phone        -- contact
  sites int, ehr text, org_type text                    -- org profile
  prompt_now text                                       -- urgency
  primary_concern text, timing text, investment text    -- qualifier
  status text default 'new'                             -- new | contacted | declined | won
  sequence_step int default 0                           -- 0..5 nurture progress
  last_sequence_sent_at timestamptz
  created_at, updated_at
```

GRANTs: `service_role` full access; `anon` INSERT only (form is public, no auth). RLS:
- Public INSERT with a basic CHECK (length caps + email regex) — same pattern as `playbook_leads`.
- SELECT/UPDATE/DELETE restricted to `is_founder_admin(auth.uid())`.

Admin console (`/admin/pipeline`) gets a new "Waitlist" tab listing applications.

## 4. Edge function — `submit-waitlist-application`

- Validates the form with Zod (length caps, email format, enum checks on org_type / timing / investment).
- Inserts the row.
- Sends a transactional confirmation email to the applicant via Resend (the project's existing pattern) using a new template that mirrors the on-page "Application Received" copy.
- Sends an internal notification to `jessica@measurewise.org` with the submission details.
- Returns `{ ok: true, id }`.

CORS enabled, no JWT verification (public form), rate-limited by IP via in-memory map (acceptable for low-volume waitlist).

## 5. Nurture email sequence — `send-waitlist-nurture`

New edge function modeled on `send-playbook-followups`. Cron-triggered (hourly), gated by `x-cron-secret`. Each run:

1. Queries `waitlist_applications` where `status = 'new'` and `sequence_step < 5`.
2. For each, computes whether the next email is due based on `created_at` + the cadence below.
3. Sends via Resend, increments `sequence_step`, stamps `last_sequence_sent_at`.

Cadence (matches the PDF):

| Step | Subject | Send when |
|---|---|---|
| 1 | The PDSA problem that shows up during audits | day 4 |
| 2 | A quick audit-readiness check for your quality team | day 18 |
| 3 | Your PDSA tracker should make leadership calmer | day 35 |
| 4 | What I look for before offering a sprint spot | day 56 |
| 5 | Before your next PDSA review | day 77 |

Email bodies are stored as plain-text/HTML constants in `_shared/waitlist-nurture-emails.ts` (one file, 5 exports) with the exact copy from the PDF, wrapped in the existing brand layout from `_shared/email-templates.ts` and signed "— Jessica · MeasureWise". Each email respects suppression (skips if recipient is in `suppressed_emails`).

A pg_cron job `waitlist-nurture-hourly` is created in the same migration to invoke the function every hour.

## Technical notes

- Uses Resend (existing pattern in `send-playbook-followups`, `send-welcome-email`) rather than the Lovable Emails queue — keeps it consistent with current waitlist-style flows.
- Reuses `CRON_SECRET` and `RESEND_API_KEY` secrets; no new secrets required.
- Reuses `BRAND` constants from `supabase/functions/_shared/brand.ts`.
- The uploaded HTML files' palette (`#01696f`, Instrument Serif) is preserved on these three pages only via a scoped `waitlist.css` import — it does NOT override the global teal HSL `192 70% 35%` design system used elsewhere.
- No changes to the dashboard, auth, billing, or any existing route.

## Files

**Created**
- `src/pages/waitlist/WaitlistLanding.tsx`
- `src/pages/waitlist/WaitlistApply.tsx`
- `src/pages/waitlist/WaitlistThankYou.tsx`
- `src/pages/waitlist/waitlist.css`
- `supabase/functions/submit-waitlist-application/index.ts`
- `supabase/functions/send-waitlist-nurture/index.ts`
- `supabase/functions/_shared/waitlist-nurture-emails.ts`
- Migration: `waitlist_applications` table + RLS + GRANTs + cron job

**Edited**
- `src/App.tsx` — add 3 routes
- `src/components/PublicPageLayout.tsx` — add "Waitlist" nav link
- `src/pages/Landing.tsx` — footer link
- `src/pages/admin/AdminPipeline.tsx` — add Waitlist tab
- `@security-memory` — document the new public-INSERT table