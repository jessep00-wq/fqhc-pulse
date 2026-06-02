
# Workstream Ribbon + Downstream Impact Panel

Goal: turn the QI → Evidence → Report chain into a visible operating system. Two new UI primitives, applied consistently to the three record types that already share dependencies (PDSA cycles, Evidence documents/categories, QI/QA reports).

## 1. The two primitives

### A. WorkstreamRibbon (macro)
A persistent header strip rendered near the top of record pages.

Stages (fixed, 6):
```
Plan → Execute → Collect Evidence → Validate → Report → Complete
```

Per-stage state: `not_started | in_progress | blocked | ready | complete`, with:
- icon + label + connector line
- traffic-light tone via existing semantic tokens (`muted`, `primary`, `warning`, `destructive`, `success`)
- tooltip on hover: why it's in this state + what unlocks the next stage
- click behavior:
  - completed / current stage → navigates to the relevant detail surface (e.g. evidence tab, validation tab)
  - future stage → opens a small popover listing readiness requirements; never a dead link
- sublabel under ribbon: reporting period context (e.g. "Q2 2026 · UDS 2026 cycle")

Persistence: the ribbon stays mounted while a user drills from a PDSA into one of its evidence items or into a QI report that consumes it — the highlighted stage updates instead of the ribbon disappearing.

### B. DownstreamImpactPanel (micro)
A right-rail (or stacked-below on mobile) card on the same record pages. Reads like sentences, not a data dump.

Sections:
- **Belongs to** — reporting period, owner, due date
- **Feeds** — list of downstream artifacts this record contributes to (evidence packet, board report, QI report section), each with a readiness pill
- **Requires** — missing dependencies with concrete counts ("3 of 5 evidence artifacts attached", "numerator documentation missing")
- **Next unlock** — one-sentence explanation of what action moves this record forward, with a primary CTA when actionable
- **Blockers** — only shown when present; includes owner and ETA when known

## 2. Where it shows up

| Surface | Ribbon stage source | Downstream feeds |
|---|---|---|
| `src/pages/PDSALab.tsx` + `PDSADetailDialog` | PDSA phase → ribbon stage map | Evidence binder categories, QI report PDSA section |
| `src/pages/evidence-binder/CategoryDetail.tsx` | Doc lifecycle (active / expiring / missing / validated) | Binder completeness %, QI report evidence section, OSV binder export |
| `src/pages/evidence-binder/Overview.tsx` | Aggregate org-level readiness | OSV binder export, board packet |
| `src/pages/qi-reports/QIReportDetail.tsx` | `qi_reports.status` (draft → in_review → approved → board_presented) | Board packet PDF, board meeting minutes attachment |

The same `<WorkstreamRibbon>` instance receives a `context` prop describing which record family is active and where to anchor the highlight, so navigating PDSA → linked evidence → resulting QI report keeps the ribbon mounted.

## 3. Stage mapping (existing data → 6 stages)

```text
PDSA            Evidence doc            QI Report
─────           ────────────            ─────────
plan      →  Plan          (none)              draft (no snapshot yet)
do        →  Execute       uploaded            draft (snapshot built)
study     →  Collect Ev.   review pending      in_review (committee)
act       →  Validate      validated/approved  in_review (CMO/CEO)
completed →  Report        published in binder approved
(rollup)  →  Complete      exported in OSV     board_presented
```

Mapping helpers go in a new `src/lib/workstream/` folder so each record type has a single source of truth.

## 4. Unlock / dependency engine

New module `src/lib/workstream/dependencies.ts` exporting per-record selectors:
- `getPdsaWorkstream(cycle, tasks, evidence): RibbonState + DownstreamFacts`
- `getEvidenceWorkstream(category, documents): …`
- `getQIReportWorkstream(report, approvals, boardActions, snapshot): …`

Each returns:
```ts
{
  stages: Stage[];           // 6 entries, each with status + reason + unlocks
  currentStageKey: StageKey;
  context: { period: string; owner?: string; dueDate?: string };
  feeds: FeedItem[];         // downstream artifacts + readiness
  requires: RequirementItem[]; // missing dependencies w/ counts
  nextUnlock: { sentence: string; cta?: { label: string; href: string } };
  blockers: BlockerItem[];
}
```

This keeps the visual components dumb and testable: ribbon + panel render the same shape regardless of record type.

## 5. New files

```
src/lib/workstream/
  types.ts
  dependencies.ts
  pdsaWorkstream.ts
  evidenceWorkstream.ts
  qiReportWorkstream.ts

src/components/workstream/
  WorkstreamRibbon.tsx
  StagePill.tsx
  StageRequirementsPopover.tsx
  DownstreamImpactPanel.tsx
  FeedRow.tsx
  RequirementRow.tsx
```

## 6. Edits

- `src/pages/PDSALab.tsx` + `src/components/PDSADetailDialog.tsx` — mount ribbon + panel on the detail dialog/page
- `src/pages/evidence-binder/Overview.tsx` + `CategoryDetail.tsx` — same
- `src/pages/qi-reports/QIReportDetail.tsx` — same; replace the top metadata block with ribbon, add panel to the right of the Tabs
- `src/components/AppLayout.tsx` — no change; ribbon is per-page, not global (it's record-scoped, per UX guidance)

## 7. Constraints respected

- **Frontend only.** No new DB tables, no migrations, no edge functions — all state is derived from existing `pdsa_cycles`, `pdsa_evidence`, `evidence_documents`, `qi_reports`, `qi_report_approvals`, `qi_report_board_actions`.
- **Semantic tokens only** (`primary`, `warning`, `destructive`, `success`, `muted`) — no raw colors.
- **No new packages.** Uses existing shadcn primitives (Popover, Tooltip, Badge, Card).
- **Responsive.** Ribbon collapses to a horizontally scrollable strip below `md`; panel stacks under main content on mobile.

## 8. Out of scope (call out, don't build)

- Cross-record live subscriptions (realtime) — initial version refetches on tab focus.
- Editing dependencies directly from the panel — CTAs deep-link to the source surface.
- Configurable stage names per organization — stages are fixed in v1.

## 9. Build order

1. Types + dependency selectors with unit tests (pure functions, fastest to verify).
2. `WorkstreamRibbon` + `StagePill` + readiness popover.
3. `DownstreamImpactPanel` + rows.
4. Wire into QI Report Detail first (clearest stage model), then Evidence Category Detail, then PDSA detail.
5. Visual QA across all three surfaces at 988px and mobile widths.

## Technical notes

- All selectors are pure and synchronous; React Query already loads the underlying rows on each detail page, so we just `useMemo` over the cached data.
- Stage `unlocks` strings are derived, not stored — keeps copy editable in one place (`src/lib/workstream/copy.ts`).
- Ribbon click → future stage opens popover, never navigates, matching the "no dead links" rule.
