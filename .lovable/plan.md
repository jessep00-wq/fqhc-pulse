
# One-Click HRSA / NCQA Evidence Packet

## Problem

The current audit binder is a single-cycle summary — it shows one PDSA cycle's metadata. A real QI Director spends two weeks before an HRSA OSV assembling: the cycle log, task completion evidence, baseline-to-result deltas, lessons learned, and next-cycle linkages across ALL completed cycles. No competitor produces this narrative automatically.

## Solution

Replace the per-cycle "Generate OSV Binder" button with a top-level **"Generate Evidence Packet"** action that produces a comprehensive, multi-cycle, print-ready PDF binder covering a selectable date range. Position it as the headline feature: *"Walk into your next HRSA site visit with your PDSA binder already generated."*

## What the Evidence Packet Contains

1. **Cover Page** — Organization name, NPI, date range, generation date
2. **Executive Summary** — Total cycles completed, total improvement achieved, measures addressed, staff involved
3. **QI Activity Log** — Chronological table of all PDSA cycles in range: title, measure, start date, status, decision (Adopt/Adapt/Abandon)
4. **Cycle Detail Pages** (one per completed cycle) — Aim statement, prediction, root cause, measurement plan, test description, baseline vs. result (improvement %), clinical workflow impact, decision, next steps, staff accountability (acknowledged tasks)
5. **Task Completion Evidence** — Per cycle: tasks with status, assigned role, due date, acknowledgment status
6. **Lessons Learned Summary** — Aggregated what-worked / what-didn't across all cycles
7. **Next-Cycle Linkages** — Shows which cycles spawned follow-up cycles (v2, v3) for continuous improvement narrative

## UI Changes

### 1. Add "Generate Evidence Packet" button to PDSA Lab header
Next to "New PDSA Cycle" button. Opens a dialog with date range picker and "Generate PDF" action.

### 2. Evidence Packet Dialog
- Date range selector (defaults to current fiscal year Jul 1 – Jun 30)
- Preview of what will be included (cycle count, measure count)
- "Generate PDF" button that builds the full binder client-side using jsPDF + html2canvas

### 3. Keep per-cycle binder
The existing per-cycle "Generate OSV Binder" on completed cards stays as a quick single-cycle export. The new top-level packet is the comprehensive version.

### 4. Landing page hook
Update the CTA and feature card copy to lead with the audit deliverable: *"Walk into your next HRSA site visit with your PDSA binder already generated."*

## Files to modify

| File | Action |
|------|--------|
| `src/pages/PDSALab.tsx` | Add Evidence Packet button + dialog with date range, multi-cycle PDF generation |
| `src/pages/Landing.tsx` | Update hero subtext and feature card to lead with audit binder value |

## Technical approach

- Query all `pdsa_cycles` and `tasks` for the org within the date range
- Render a hidden `<div>` with all sections, capture via html2canvas, paginate with jsPDF (same pattern as existing binder but expanded)
- No new DB tables or migrations needed — all data already exists
