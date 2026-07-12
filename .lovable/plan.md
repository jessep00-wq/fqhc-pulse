## Scope

Replace the 8 questions and their 3-answer sets in `src/lib/osvQuiz.ts` with the exact wording from the uploaded standalone quiz screenshots. Keep everything else untouched: scoring shape (0/1/2 pts, max 16), tier thresholds, tier copy, lead-capture flow, and the `OsvQuiz.tsx` page UI.

## File to change

`src/lib/osvQuiz.ts` — replace only the `OSV_QUESTIONS` array. Question `id` values are updated to reflect the new prompts (used only as internal keys and as JSON keys in the `answers` payload sent to `osv_quiz_leads.answers`, which is `jsonb` — no schema change needed).

## New questions (verbatim from screenshots)

1. **pdsa_storage** — "Where are your current PDSAs stored?"
   - Scattered across email, sticky notes, and people's memory (0)
   - A shared drive folder or spreadsheet someone maintains (1)
   - A dedicated QI system built for tracking cycles (2)

2. **project_ownership** — "Can you show who owns each active QI project — right now, without searching?"
   - No, I'd have to ask around (0)
   - For most projects, yes (1)
   - Yes, instantly, for every one (2)

3. **twelve_month_evidence** — "Can you produce 12 months of QI/QA assessment evidence today?"
   - No — it's incomplete or scattered (0)
   - Mostly, with some digging (1)
   - Yes, it's already assembled (2)

4. **uds_to_improvement** — "Are your UDS measures tied to active improvement work?"
   - Not really — they're tracked separately (0)
   - Some of them are (1)
   - Yes, every measure maps to a live PDSA (2)

5. **board_packet** — "Could your board packet show what changed, what failed, and what happens next?"
   - No — it's mostly status updates (0)
   - Partially (1)
   - Yes, that's exactly how it's structured (2)

6. **last_pdsa_update** — "When did your team last close out or update a PDSA cycle?"
   - Honestly, not sure — it's been months (0)
   - Within the last month (1)
   - This week (2)

7. **assembly_time** — "If HRSA asked for evidence tomorrow, how long would it take to assemble it?"
   - Days, maybe longer — and I'd worry about gaps (0)
   - A day of pulling things together (1)
   - Minutes — it's already in one place (2)

8. **bus_factor** — "If you were out sick this week, could someone else on your team produce this evidence?"
   - No — it lives in my head (0)
   - One other person could, maybe (1)
   - Yes, anyone on the team could pull it (2)

Existing `helper` text is dropped since the source quiz doesn't include helpers.

## Out of scope (deliberately unchanged this pass)

- Tier thresholds (`≤6 red`, `7–11 yellow`, `≥12 green`) and tier headline/summary/nextStep copy
- Intro headline, subheadline, and page layout in `OsvQuiz.tsx`
- Result page visuals ("Red / You are doing work you may not be able to prove.")
- Lead form fields and Supabase insert into `osv_quiz_leads`
- Visual design (dark navy background + white card look shown in screenshots)

If you want the result copy, intro subheading ("Eight questions. Sixty seconds. Find out if your QI evidence would survive a site visit…"), or the dark-navy visual treatment from the screenshots ported over too, say the word and I'll do those in follow-up passes.