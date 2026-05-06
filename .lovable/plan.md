
## Three changes across messaging, data model, and retention

---

### 1. Rewrite the hero section (Landing.tsx)

Replace the current headline and sub-headline with sharper, financially-grounded copy:

- **Headline**: "Every PDSA cycle you run should move a UDS measure. Now you can prove it."
- **Sub-headline**: "Link your quality improvement work to UDS scores and HRSA funding outcomes — with guided PDSA cycles, real-time measure tracking, and one-click audit binders. Built for FQHCs. No sales call required."
- Update the `<meta>` description in `index.html` to match
- Update the static no-JS fallback in `index.html` to match

---

### 2. Add UDS measure targets + upgrade weekly digest

**Database migration** — add a `target` column to `uds_trends` (or a new `uds_targets` table with `measure_id`, `organization_id`, `target_value`) so the digest can say "3 points below target" instead of just showing a generic trend arrow.

A lightweight `uds_targets` table is cleaner:

| Column | Type |
|--------|------|
| id | uuid PK |
| organization_id | uuid FK |
| measure_id | text |
| target_value | numeric |
| created_at | timestamptz |

**Upgrade the weekly digest edge function** (`weekly-digest/index.ts`) to:
- Query `uds_targets` alongside `uds_trends`
- For each top measure, calculate gap-to-target (e.g., "3 points below target")
- Link each measure to its active PDSA cycle if one exists
- Produce subject lines like: "📊 Cervical Cancer Screening is 3 pts below target"

**Upgrade the digest email template** (`_shared/email-templates.ts`) to:
- Show a "Target" column next to current value
- Color-code red when below target, green when at/above
- Add a sentence per below-target measure: "Your [Measure] rate is X points below your Y% target — [PDSA cycle name] is active."

---

### 3. Schedule the weekly digest cron job

The `weekly-digest` edge function exists but has no cron trigger. Add a `pg_cron` + `pg_net` job to invoke it every Monday at 7:00 AM ET (12:00 UTC).

---

### Files changed

| File | Change |
|------|--------|
| `src/pages/Landing.tsx` | Rewrite hero headline, sub-headline, and CTA text |
| `index.html` | Update meta description + static fallback to match new messaging |
| `supabase/functions/weekly-digest/index.ts` | Query targets, compute gaps, personalize subject line |
| `supabase/functions/_shared/email-templates.ts` | Add target column, gap messaging, conditional coloring |
| New migration | Create `uds_targets` table with RLS |
| SQL insert (non-migration) | Schedule `pg_cron` job for weekly digest |
