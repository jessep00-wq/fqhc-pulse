## PDSA Lab + cross-feature improvements (13 items)

All work is frontend-only — no schema or RLS changes. Existing tables (`pdsa_cycles`, `tasks`) already carry the data needed.

### 1. Responsive board (Lab)
- Keep horizontal scroll on desktop, but add a soft gradient fade on the right edge + a small `ChevronRight` hint when more columns are off-screen (computed from scroll position).
- Under `md` breakpoint: swap the 5-column grid for a `Tabs` UI (Plan / Do / Study / Act / Completed) with counts on each trigger. Drag-and-drop only renders on `md+` to avoid touch DnD friction.

### 2. Smarter empty state per column
- Replace plain "No cycles" with a faint dashed ghost card + phase-specific coaching copy:
  - Plan: "Draft your next aim. → New PDSA Cycle"
  - Do: "Move a Plan card here when your test begins."
  - Study: "Drop a Do card here once data is in."
  - Act: "Decide: adopt, adapt, or abandon."
  - Completed: "Finish strong — completed cycles unlock the OSV Binder."
- "Plan" column ghost includes a small "Start a cycle" button that opens the wizard.

### 3. Phase progress dots on each card
- Add a 4-dot `PhaseDots` (Plan ● Do ● Study ○ Act ○) above the title. Filled = phase reached or passed (based on `status`). Completed shows all 4 filled + a check icon.

### 4. Legible role chips
- Replace `AvatarGroup` with compact text chips: e.g. `MA/RN · Provider · +1`. Hovering shows full list via shadcn `Tooltip`. Keep the existing role color tokens.

### 5. Due date badges
- Each card derives the earliest open task due date from already-fetched `tasks`. Render a small badge like `Due Oct 31`:
  - red when overdue, amber when ≤ 7 days, green when > 7 days, hidden if no linked task with a due date.

### 6. Stalled indicator
- A card is "stalled" if `status !== completed` AND `created_at` (later: last status change) is > 14 days ago AND there's no completed task in the last 14 days. Show an amber `Clock` badge + left-border switches to amber-dashed.
- Reuse the same stalled definition the Dashboard tile already uses; if it differs, align to a single helper in `src/lib/pdsaStatus.ts`.

### 7. Filters + sort toolbar
- New `PDSAFilters` bar above the board: filters by CMS measure (from distinct `uds_measure` values), assigned role (from `STAFF_ROLES`), and "Stalled only" toggle. Sort by Newest / Oldest / Due soonest.
- State held in the URL via `useSearchParams` so filters survive refresh and are shareable.

### 8. AI Assistant → Create PDSA
- In `AIAssistant.tsx`, each assistant message gets a "Create PDSA from this →" button.
- Click writes `{ title, rootCause, aim }` derived from the message to `sessionStorage["mw_pdsa_seed"]` and routes to `/dashboard/pdsa-lab?from=ai`.
- `PDSALab` reads the seed on mount, opens the wizard at the `aim` step, and pre-fills the fields; clears the seed once consumed.

### 9. One-click Playbook → PDSA
- On each `PlaybookGrid` card add a secondary `Start PDSA from this Playbook` button next to "View Playbook →". Clicking calls the existing `deployMutation` directly (skips the dialog) and toasts + navigates.

### 10. Cycle history view inside a PDSA
- In `PDSADetailDialog`, add a "Cycle history" section: queries `pdsa_cycles` for the same `organization_id` + same `uds_measure`, ordered by `created_at`. Renders as a compact vertical timeline (date · title · status · improvement_pct). Current cycle marked "This cycle". No new tables — uses existing measure grouping.

### 11. Staff Tasks ↔ PDSA linkage
- The "PDSA Cycle" column already joins `pdsa_cycles(title)`. When `pdsa_cycle_id` is null, render an inline `Link to PDSA…` button that opens a small popover with the existing `cycles` select and inline-updates the row instead of showing "—". For rows with a cycle, the title becomes a link that opens `PDSADetailDialog` for that cycle.

### 12. Better truncation
- Replace `line-clamp-2` on card aim text with `line-clamp-3` and add a `Tooltip` showing the full text on hover. Long titles get a `title` attribute fallback. Keep card width unchanged.

### 13. Header `+` button clarity
- The header already says "New PDSA Cycle" — no separate `+` button exists at the page level, but the bare `Plus` icon variant lives on the empty-state ghost card and on the wizard's template grid. Add an `aria-label="New PDSA Cycle"` to each, and ensure every Plus icon is accompanied by visible text. Add a `Tooltip` ("New PDSA Cycle") on any icon-only Plus that remains (e.g. column add buttons if introduced).

### Files changed (no new tables)
- `src/pages/PDSALab.tsx` — responsive board, phase dots, role chips, due/stalled badges, ghost empty states, filters, AI seed consumer, tooltips, a11y labels.
- `src/components/PDSADetailDialog.tsx` — cycle history section.
- `src/pages/AIAssistant.tsx` — per-message "Create PDSA from this" button + sessionStorage handoff.
- `src/pages/PlaybookLibrary.tsx` — secondary one-click deploy button on each card.
- `src/pages/StaffTasks.tsx` — inline PDSA link in the cycle column, clickable cycle titles.
- New `src/lib/pdsaStatus.ts` — shared helpers: `isStalled(cycle, tasks)`, `getEarliestDueDate(cycle, tasks)`, `getPhaseIndex(status)`, `derivePdsaSeedFromAi(text)`.
- New `src/components/pdsa/PhaseDots.tsx`, `src/components/pdsa/RoleChips.tsx`, `src/components/pdsa/PDSAFilters.tsx`, `src/components/pdsa/ColumnGhostCard.tsx`.

### Out of scope
- Schema changes (no new "stalled" column, no PDSA→PDSA parent linkage, no audit table for status-change timestamps).
- Touch-native drag-and-drop on mobile (tabs handle the small-screen case).
- Restyling the wizard itself beyond a11y labels.
- AI-side schema changes — the "Create PDSA from this" extraction is a simple regex/heuristic in the client.

### Technical notes
- "Stalled" v1 uses `created_at` because there's no `status_changed_at` column yet; we'll note this in code so it can be upgraded later without a UI rewrite.
- AI seed payload is intentionally tiny (`{title, rootCause, aim, source: "ai"}`) to fit comfortably in sessionStorage.
- Cycle history grouping by `uds_measure` matches the way FQHCs already think about "measure X, iteration N" without requiring a new join table.
