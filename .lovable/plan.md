## Scope

Build a 7-step, tier-branched nurture sequence for `osv_quiz_leads`, modeled on the existing `send-playbook-nurture` cron pattern. One email/day-based cadence, driven by `created_at` + `nurture_step`, per-tier copy variants (red / yellow / green), with tier-specific CTAs.

## Cadence

Day 0 (immediate — result delivered), Day 2, Day 4, Day 7, Day 10, Day 13, Day 17. Total window ~17 days. Only the Day 0 delivery email is sent inline from the quiz submit path; Days 2–17 are sent by a daily cron.

## Database changes (single migration)

Add nurture state to `osv_quiz_leads`:

- `nurture_step int not null default 0`
- `last_nurture_sent_at timestamptz`
- `unsubscribed_at timestamptz`
- `delivery_sent_at timestamptz` (Day 0 result email)
- index on `(nurture_step, created_at)`

No new tables; grants unchanged (existing insert-only anon policy + founder read still apply).

## Files

**New — content module**
`supabase/functions/_shared/osv-nurture-emails.ts`
- Exports `OSV_NURTURE`: array of 7 entries `{ step, daysAfterSignup, subjectByTier, previewByTier, htmlByTier(firstName, org, score) }`.
- Uses same `wrap()` / brand tokens as `playbook-nurture-emails.ts` (teal `#01696f`, cream bg, Jessica sig).
- Copy per tier follows the strategy doc verbatim for Red; the Yellow/Green variants use the tone + subject-line examples given.
- Every email has one CTA button. CTA URL varies by tier:
  - Red → `/contact?src=osv-nurture&tier=red&step=N` ("Book a MeasureWise walkthrough")
  - Yellow → `/contact?src=osv-nurture&tier=yellow&step=N` ("See the framework" / "Get the checklist")
  - Green → `/contact?src=osv-nurture&tier=green&step=N` ("Pressure-test your process")
- Footer includes `List-Unsubscribe`-compatible link to `/osv-quiz/unsubscribe?token=…` (see below).

**New — delivery email (Day 0)**
`supabase/functions/send-osv-result/index.ts`
- Called from `OsvQuiz.tsx` right after the successful `osv_quiz_leads` insert (invoked with `supabase.functions.invoke`).
- Renders "Your Panic Index results are in" (Email 1 in the doc, tier-specific interpretation), sends via existing Resend gateway pattern, stamps `delivery_sent_at`.
- Uses the same brand `wrap()` helper (re-exported from `osv-nurture-emails.ts`).
- Idempotent via `messageId = osv-{lead_id}-delivery` and check-before-send on `delivery_sent_at`.

**New — cron sender (Days 2–17)**
`supabase/functions/send-osv-nurture/index.ts`
- Copy of `send-playbook-nurture/index.ts` adapted to `osv_quiz_leads`.
- Auth: same `x-cron-secret` / `get_cron_secret` pattern.
- Query: `nurture_step < 7 AND unsubscribed_at IS NULL AND consent = true`, limit 100.
- For each row: pick `OSV_NURTURE[nextStep - 1]`; skip until `created_at + daysAfterSignup` has elapsed; branch copy on `row.tier`; send via Resend gateway; log via `logEmailAttempt`; update `nurture_step` and `last_nurture_sent_at`.
- Tags: `category=osv_nurture`, `tier=<red|yellow|green>`, `step=<N>`.

**New — unsubscribe endpoint**
Reuse existing pattern: add a `POST` handler in `send-osv-nurture` (or a small `osv-unsubscribe` function) that accepts a signed token (`hmac(lead_id, CRON_SECRET)`) and stamps `unsubscribed_at`. Link renders in every nurture footer. No new page needed — reuse the existing `NewsletterUnsubscribe.tsx` shape at `/osv-quiz/unsubscribe`.

**Edited — quiz page**
`src/pages/OsvQuiz.tsx`
- After successful insert, `supabase.functions.invoke("send-osv-result", { body: { lead_id, tier, score, first_name, email } })` (fire-and-forget with error log). No UI change.

**Edited — cron schedule**
Add a daily `pg_cron` job for `send-osv-nurture` using the `net.http_post` pattern (per the schedule-jobs guide). This is an `insert`, not a migration, because it embeds the anon key + function URL.

## Copy plan

Email content follows the strategy doc:

| Step | Day | Purpose |
|---|---|---|
| 1 | 0 | Result delivered (score + tier interpretation) |
| 2 | 2 | What tier really means (workflow framing) |
| 3 | 4 | Cost of inaction (Red) / missed refinement (Yellow) / maintenance risk (Green) |
| 4 | 7 | Quick win + 1-page checklist link |
| 5 | 10 | MeasureWise intro |
| 6 | 13 | Framework / credibility example |
| 7 | 17 | Final conversion — book walkthrough |

Subject lines: use the doc's Red set verbatim; Yellow and Green use the doc's example subject lines mapped to steps 1–7.

Personalization tokens available: `first_name`, `organization`, `score`, `tier`. (Weakest-domain personalization is out of scope this pass — noted as a follow-up.)

## Out of scope (this pass)

- Weakest-answer-domain personalization
- Open/click analytics beyond existing `email_send_log`
- A/B subject-line testing harness
- Admin UI to view/replay nurture state (existing `osv_quiz_leads` admin view still works)

## Verification

- Type-check passes (auto).
- Manually invoke `send-osv-nurture` with `x-cron-secret` against a seeded lead with `created_at` backdated 3 days; confirm exactly one send per invocation and `nurture_step` increments.
- Confirm Day 0 email fires on real quiz submit and `delivery_sent_at` stamps.
- Confirm unsubscribe link stops further sends.
