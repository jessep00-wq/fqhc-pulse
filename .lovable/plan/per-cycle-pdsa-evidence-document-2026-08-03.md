# Per-cycle PDSA Evidence Document

Today the only branded evidence export is the org-wide OSV/Audit packet (`EvidencePacketDialog`), which covers every cycle in a date range. This adds a single-cycle evidence document that can be generated at any point in the cycle — Plan, Do, Study, Act or Completed — using the exact same cover/section/table design language, and that can be downloaded as PDF, saved, and printed.

## What the user will see

- A "Generate evidence document" button in the PDSA detail dialog (header area, and repeated on the Evidence tab next to file uploads).
- Clicking it opens a dialog with:
  - A short summary of what will be included (cycle title, current stage, completeness %, attached files count, linked tasks count).
  - Buttons: **Download PDF**, **Print**, and **Cancel**.
- The generated document is branded identically to the OSV packet: dark teal cover page, teal rule + section labels, same table/typography styles, page header/footer with page numbers.
- Any section not yet filled in renders as a labeled placeholder ("Not yet documented — cycle currently in Study") instead of being hidden, so the document is honest at any stage and stays the same shape from first draft to completion.
- A "Draft — cycle in progress" watermark/banner appears on the cover for non-completed cycles; completed cycles print clean.
- Demo-mode and free-tier gating behave exactly as the existing packet (demo export confirmation, SAMPLE watermark for free tier).

## Document layout (single cycle)

```text
Cover        Cycle title, org name, UDS measure or focus area,
             stage badge, completeness %, date generated
01           Cycle Overview (aim, focus/measure, owner, staff, dates, status timeline)
02           Plan (aim statement, root cause, target goal, prediction, measurement plan)
03           Do (test description, intervention, workflow impact)
04           Study (study results, analysis summary, actual outcome, what worked / didn't)
05           Act (decision, next steps, next-cycle link)
06           Linked Tasks (table: title, role, due date, status)
07           Attached Evidence Files (table: file name, type, size, uploaded date)
08           Documentation Completeness Checklist (per-item Yes/No from pdsaCompleteness)
Appendix     Disclaimer + generated-by footer
```

## Technical notes

- Extract the shared visual primitives currently inline in `src/components/EvidencePacketDialog.tsx` (TEAL constants, `pageStyle`, `thStyle`, `tdStyle`, `tableStyle`, `PageHeader`, `PageFooter`, `SectionHeading`) into `src/components/evidence/packetStyles.tsx`, and have `EvidencePacketDialog` import from it so both documents stay visually identical with one source of truth. No visual change to the existing packet.
- New `src/components/pdsa/CycleEvidenceDocDialog.tsx`:
  - Props: `cycle: DBCycle`, `open`, `onClose`.
  - Queries `tasks` (by `pdsa_cycle_id`) and `pdsa_evidence` (by `pdsa_cycle_id`), both org-scoped.
  - Renders the off-screen printable tree, then reuses the same html2canvas + jsPDF letter-page slicing loop as the packet (extracted into `src/lib/evidencePdf.ts` so both call one function: `exportNodeToPdf(node, filename, { watermark })`).
  - File name: `PDSA_Evidence_<slugified title>_<yyyy-MM-dd>.pdf`.
  - **Print** uses the same rendered node in a hidden print container plus a `@media print` rule so the browser print dialog produces the same pagination.
- Completeness checklist reuses `getCompletenessItems` from `src/lib/pdsaCompleteness.ts` — no scoring duplication.
- Focus area vs UDS measure: show `uds_measure` when present, otherwise `focus_area`, matching the card badge rule already in place.
- Wire the trigger in `src/components/PDSADetailDialog.tsx` (header button + Evidence tab button). No changes to the Kanban card.

## Verification

Typecheck, then open a cycle at each stage (early Plan-only, mid Study, Completed), generate the PDF, and convert pages to images to confirm no clipped text, correct placeholders, and matching branding against the existing OSV packet output.
