# Make UDS measures optional on PDSA cycles

Not every improvement cycle maps to a UDS measure. AWV completion, no-show rate, referral loop closure, access/recall work should be first-class cycles with their own topic label — and should not be penalized on completeness or OSV readiness.

## What changes for the user

- In the PDSA wizard's Measurement step, the UDS measure picker becomes optional. A new choice, "Not tied to a UDS measure," reveals a short free-text **Focus area** field (e.g. "Annual Wellness Visit completion", "No-show rate", "Referral loop closure").
- The Next button no longer blocks when no measure is selected — it requires either a measure or a focus area, so every cycle still has a topic.
- Cycle cards, the detail dialog, review step, board/OSV exports and the Kanban measure filter show the focus area wherever the UDS badge used to appear. The filter dropdown gets the focus areas alongside the CMS codes.
- Completeness scoring: a focus area earns the same 15 points a UDS measure does, so non-UDS cycles can still reach 100% and pass the "≥80% complete" OSV gate.
- The workstream "UDS measure selected" requirement becomes "Topic linked (UDS measure or focus area)".
- The iteration chain on the detail dialog groups by focus area for non-UDS cycles, the same way it groups by measure today.

Existing cycles are unaffected — they keep their UDS measure and behave exactly as now.

## Technical notes

Database migration:
- Add `focus_area text` to `public.pdsa_cycles` (nullable).
- Update `public.compute_pdsa_completeness()` so the 15-point block awards on `uds_measure` **or** `focus_area` being non-empty.

Frontend:
- `src/pages/PDSALab.tsx` — wizard data gains `focusArea`; measurement-step `canProceed` accepts either field; insert writes `focus_area`; `measureOptions`/filter and the card badge fall back to focus area; review step relabels to "Measure / focus area".
- `src/components/PDSADetailDialog.tsx` — add focus-area to the editable field union and render an input when no UDS measure is set; badge falls back to focus area; pass focus area to `CycleChain`.
- `src/components/pdsa/CycleChain.tsx` — accept an optional `focusArea` and query on `focus_area` when there is no `uds_measure`.
- `src/lib/pdsaCompleteness.ts` — mirror the trigger change (15 pts for measure or focus area, label "Linked UDS measure or focus area").
- `src/lib/workstream/pdsaWorkstream.ts` — Plan-stage reason and the `requires` entry accept either field.
- `src/lib/auditBinderPdf.ts`, `src/components/BoardReportDialog.tsx`, `src/components/EvidencePacketDialog.tsx` — print `uds_measure ?? focus_area ?? "—"`.
- `src/types/pdsa.ts` and related cycle interfaces get `focus_area: string | null`.
