
## OSV Panic Index Quiz — MeasureWise lead-gen funnel

Standalone quiz funnel at `/osv-quiz` that assesses HRSA OSV evidence readiness, shows a tier result, then gates the full breakdown + follow-up materials behind a lead form. Note: the uploaded HTML is an obfuscated Lovable-bundler artifact (base64+gzip manifest), so the original quiz text isn't readable. I'll author 8 new OSV-focused questions in the same spirit and preserve the 0/1/2 scoring model.

### Route & files
- New public route `/osv-quiz` in `src/App.tsx` (above the `/admin/*` and `/dashboard/*` blocks).
- New page `src/pages/OsvQuiz.tsx` — single component, `useState` state machine: `intro → quiz → result → form → thankyou`.
- Quiz content + scoring in `src/lib/osvQuiz.ts` (pure, testable).
- Reuses existing `<SEO>`, `<PublicPageLayout>`, shadcn `Button`/`Input`/`Label`/`Checkbox`/`Progress`/`Card`, and brand tokens from `index.css`. No new colors — uses `--primary` (teal), `--muted`, `--destructive`, plus a `warning` amber utility already present.

### Quiz content (8 questions, 3 answers each: 0 / 1 / 2 pts)
1. **PDSA evidence** — Can you produce closed-loop PDSA docs (Plan→Do→Study→Act) for your top 3 UDS measures in <1 day? (No / Partial / Yes)
2. **UDS trending cadence** — How often are priority UDS measures trended with a chart reviewers can see? (Annually / Quarterly / Monthly or better)
3. **Board minutes specificity** — Do QI committee/Board minutes name UDS measures by number + current rate? (No / Sometimes / Consistently)
4. **Binder retrieval** — If HRSA called Monday, how long to assemble the QI/QA evidence binder? (>1 week / 2–5 days / <1 day)
5. **Incident→action loop** — Are incidents/grievances closed with documented action + follow-up? (No log / Log only / Full closed loop)
6. **Credentialing files** — Provider credentialing + peer review current and centrally tracked? (Scattered / Mostly / Yes, audited)
7. **Policy review cadence** — Clinical policies re-approved by Board on a defined ≤3-yr cycle? (No / Informal / Yes, scheduled)
8. **Single source of truth** — QI evidence lives in one system reviewers can walk through? (SharePoint+Excel+EMR sprawl / Partially consolidated / One system)

Max score = 16. Tiers: **Red 0–6**, **Yellow 7–11**, **Green 12–16**.

### Result-screen copy
- **Red — "You're doing work you may not be able to prove."** Reviewers grade the paper trail, not the effort. Your PDSA→UDS→minute chain has structural gaps that consistently draw findings.
- **Yellow — "You have pieces, but your proof trail may break under review."** The structures exist; evidence is inconsistent or scattered. Closing 2–3 gaps before OSV is the highest-leverage move.
- **Green — "You're organized — here's how to tighten the binder."** You'd pass OSV today. Focus on trend depth, board-minute specificity, and 1-day binder retrieval.

Each tier shows: score badge, headline, 2-sentence plain-language risk, and a "Get the full breakdown + checklist" CTA that scrolls to the lead form.

### Lead capture (shown AFTER result)
Fields: first_name, last_name, email (validated), organization, job_title, phone (optional), consent checkbox (required, follow-up emails). Submit button label: **"Send Me the Breakdown"**. Secondary link: "Book a MeasureWise walkthrough" → `/contact`.

Trust microcopy under form: "Built for QI directors, PCMH coordinators, and compliance leads. Self-assessment only — not a compliance determination."

### Data model — new table `osv_quiz_leads`
Migration adds:
```sql
create table public.osv_quiz_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  email text not null,
  organization text not null,
  job_title text not null,
  phone text,
  consent boolean not null default false,
  score int not null,
  tier text not null check (tier in ('red','yellow','green')),
  answers jsonb not null,
  page_url text,
  utm jsonb,
  user_agent text
);
grant insert on public.osv_quiz_leads to anon, authenticated;
grant all on public.osv_quiz_leads to service_role;
grant select on public.osv_quiz_leads to authenticated;  -- founder_admin reads via has_role policy
alter table public.osv_quiz_leads enable row level security;
create policy "anon+auth can insert leads" on public.osv_quiz_leads
  for insert to anon, authenticated with check (true);
create policy "founder_admin can read leads" on public.osv_quiz_leads
  for select to authenticated using (public.has_role(auth.uid(), 'founder_admin'));
```
Submit path: client `supabase.from('osv_quiz_leads').insert({...})`. On error, fall back to `console.error` + still show thank-you (lead is also fired to PostHog via `trackAnonEvent('osv_quiz_submitted', {...})` for redundancy).

### Analytics
Fire `trackAnonEvent` on: `osv_quiz_started`, `osv_quiz_completed` (with tier+score), `osv_quiz_submitted` (with tier+score, no PII beyond email hash-safe fields already captured elsewhere).

### UX details
- Progress bar (shadcn `Progress`) shows `step/8` during quiz.
- Back button on Qs 2–8; disabled on Q1.
- Selecting an answer auto-advances (200ms delay) except last question which shows "See my result".
- Result tier uses colored left border + icon: red (destructive), amber (warning), teal-green (primary variant).
- Mobile: single column, large 56px touch targets, sticky progress at top.
- SEO: `<SEO title="OSV Panic Index — HRSA Readiness Quiz | MeasureWise" description="60-second self-assessment for FQHC QI directors and compliance leads. See where your OSV evidence binder is likely to break." canonical="/osv-quiz" />`.

### Not doing this pass
- Emailing the breakdown PDF (form only stores lead; follow-up sequence is a separate future edge function).
- Admin page to view leads (founder can query DB directly; can add `/admin/osv-leads` later).
- Embedding widget on external sites.

### Files touched
- `src/App.tsx` — add route
- `src/pages/OsvQuiz.tsx` — new
- `src/lib/osvQuiz.ts` — new (questions + scoring)
- new migration for `osv_quiz_leads` table + RLS + grants
