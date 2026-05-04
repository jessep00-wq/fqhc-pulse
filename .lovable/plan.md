
# Guided PDSA Methodology: Replace Statistical Literacy with Coaching

## Overview

Transform the PDSA creation and detail experience from blank form fields into a step-by-step methodology coach that walks users through **Aim → Prediction → Measurement Plan → Test → Analysis → Decision** with inline coaching tips, plain-language prompts, and pre-built templates by common FQHC use case.

## Database Migration

Add new guided-methodology columns to `pdsa_cycles`:

- `aim_statement` (text) — "What are we trying to accomplish?"
- `prediction` (text) — "What do we think will happen?"
- `measurement_plan` (text) — "How will we know a change is an improvement?"
- `test_description` (text) — "What are we testing and on what scale?"
- `analysis_summary` (text) — "What did the data tell us?"
- `decision` (text) — "Adopt, Adapt, or Abandon?"
- `template_id` (text) — which pre-built template was used, if any

Existing columns (`root_cause`, `target_goal`, `clinical_workflow_impact`, `study_results`, `what_worked`, `what_didnt_work`, `act_next_steps`) remain for backward compatibility but the UI will guide users through the new structured fields instead.

## UI Changes

### 1. Redesign `CreatePDSADialog` → Guided Wizard

Replace the current flat form with a multi-step wizard:

- **Step 1 — Choose Template or Start Blank**: Cards for common FQHC use cases (A1C Screening, Depression Screening, No-Show Reduction, Medication Reconciliation, Immunization Rates, Cervical Cancer Screening). Selecting one pre-fills subsequent steps.
- **Step 2 — Aim**: "What are we trying to accomplish?" with coaching tip and example text.
- **Step 3 — Prediction**: "What do you think will happen when you make this change?" with coaching.
- **Step 4 — Measurement Plan**: "How will you know a change is an improvement? What data will you collect?" Auto-links to UDS measure selector.
- **Step 5 — Test Plan**: "Describe the test. Who, what, when, where? Start small." Includes staff assignment.
- **Step 6 — Review & Create**: Summary card showing all inputs before creating.

Each step has:
- A plain-language question as the heading
- A coaching tip in a subtle callout (e.g., "Tip: Keep your aim specific and measurable. Good example: 'Increase A1C screening rate from 52% to 65% by March.'")
- Pre-filled example text when a template is selected

### 2. Redesign `PDSADetailDialog` tabs

Rename the 4 tabs from Plan/Do/Study/Act to methodology-aligned labels:

- **Aim & Plan** (replaces Plan): Shows aim statement, prediction, measurement plan, UDS measure, staff
- **Test** (replaces Do): Shows test description, tasks, inline coaching about small-scale testing
- **Analyze** (replaces Study): Shows analysis summary with coaching prompts ("Did the results match your prediction?"), plus the existing results/what-worked/what-didn't fields
- **Decide** (replaces Act): Shows decision field with three clear options (Adopt / Adapt / Abandon) as selectable cards with explanations, plus next steps and clone/complete actions

### 3. Pre-built templates

Defined as static data (no DB needed). Each template pre-fills: title, aim statement, prediction, measurement plan, test description, UDS measure, and assigned staff roles.

Templates:
- A1C Screening (CMS122)
- Depression Screening (CMS2v12)
- No-Show Reduction
- Medication Reconciliation
- Immunization Rates
- Cervical Cancer Screening (CMS124)

## Files to modify/create

| File | Action |
|------|--------|
| `supabase migration` | Add 7 new columns to pdsa_cycles |
| `src/data/pdsaTemplates.ts` | Create — pre-built PDSA templates |
| `src/pages/PDSALab.tsx` | Rewrite CreatePDSADialog as guided wizard |
| `src/components/PDSADetailDialog.tsx` | Redesign tabs with methodology labels and coaching |

## What stays the same

- Kanban board layout and drag-and-drop
- Audit binder export
- Task management within cycles
- SPC charts (still available on dashboard, just not required during PDSA creation)
