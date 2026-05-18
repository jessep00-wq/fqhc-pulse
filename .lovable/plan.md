## Dashboard Information Architecture Refresh

Focused refinement of `/dashboard` (and the shared app shell) per the six points. No business logic or data changes — presentation only.

### 1. Header consolidation — facility context in top bar
**Files:** `src/components/AppLayout.tsx`, `src/components/AppSidebar.tsx`

- Add an organization chip to the top header (between `SidebarTrigger` and the right-side icons):
  ```
  [trigger]  Building2 icon  Organization Name  ·  NPI 1234567890        [bell] [logout]
  ```
- Use `useOrg()` to read `organization.name` / `organization.npi`. Truncate name at ~28 chars with tooltip on overflow. Hide NPI below `sm` breakpoint, keep the name.
- Remove the duplicate "Organization" footer block from `AppSidebar.tsx` (lines 126–134) so the data lives in one place.
- Leaves the per-page `PageHeader` greeting clean — no more facility name competing with the greeting.

### 2. Action button hierarchy
**File:** `src/pages/Index.tsx`

- Keep `PageHeader` greeting on the left, but isolate actions in a single right-aligned utility cluster with a subtle divider:
  - `Board Report` → `variant="ghost"` with a `FileText` icon (output / export — recedes).
  - thin vertical separator (`Separator orientation="vertical"`).
  - `New PDSA` → `variant="default"` primary, slightly larger (sm → default), with `FlaskConical` icon (operational trigger — pops).
- Removes the visual tie between the buttons and the greeting; one is clearly a verb, the other an export.

### 3. Contextual alert binding — fold attention into the KPIs
**File:** `src/pages/Index.tsx`, small extension to `src/components/dashboard/KpiCard.tsx`

- Extend `KpiCard` with an optional `badge?: { label, tone }` slot rendered in the card's top-right (next to the icon) as a small pill.
- Remove the standalone "stalled PDSA" and "measures below target" chips from `AttentionStrip`. Keep only items that don't have a home (overdue tasks → stays in strip, or migrates into the Tasks KPI badge).
- Active PDSAs card → if `stalledPDSA > 0`, render warning badge `"{n} stalled"`; description gets a secondary line "Tap to review".
- Measures at Risk card → already shows count; add inline mini-list (top 2 measure abbreviations) as the description, e.g. `"BP Control 58% · HbA1c 61%"`. Tone already warning.
- Tasks card already shows `"{n} overdue · {n} upcoming"` — fold the overdue chip in by setting destructive badge when overdue > 0 and dropping it from the strip.
- Net effect: `AttentionStrip` likely disappears entirely on a healthy day; alerts now live where users look for the metric.

### 4. Onboarding / sample banner footprint
**File:** `src/pages/Index.tsx`

- Sample data banner: convert from a full-width content block to a slim top-anchored strip rendered above the `PageHeader` with reduced padding (`py-1.5`, single line, smaller text), a single inline `Dismiss` link, and a left accent bar. Sticky at top of `<main>` scroll until dismissed.
- `OnboardingChecklist`: collapse by default once `hasTrends && hasCycles`; render as a compact `SectionCard` with `collapsible` (already supported) so it doesn't dominate the fold.

### 5. SPC chart: full-width with right-rail activity
**Files:** `src/pages/Index.tsx`, `src/components/SPCChart.tsx`

- Restructure the analytics row from `lg:grid-cols-3` (chart 2/3 + activity 1/3) to a single full-width SPC card on top, followed by a 2-column row beneath (Trend chart left, Activity right collapsed to a compact right rail).
- Specifically:
  - Row A: `SectionCard` "Process Control" → full-width container, chart height bumped from 280 → 360, internal padding tightened so the chart breathes horizontally for 12–24 month lookback.
  - Row B: `lg:grid-cols-[1fr_320px]` → trend line chart left, Activity feed as a compact collapsible right panel (default open on `lg+`, collapsed on smaller).
- Activity feed gets a tighter row layout (single line per entry, relative timestamp only).

### 6. Visual axis indicators on SPC
**File:** `src/components/SPCChart.tsx`

- Replace right-anchored `ReferenceLine` labels with explicit Y-axis tick marks for `LCL`, `CL`, `UCL`:
  - Compute a custom `ticks={[lcl, mean, ucl]}` array merged with auto ticks, and a `tickFormatter` that renders the three thresholds with a label prefix: `"LCL 42.1"`, `"CL 58.3"`, `"UCL 74.5"`. Other ticks render as plain numbers.
  - Color those three tick labels via a custom `tick` renderer (SVG `<text>` with `hsl(var(--destructive))` for UCL/LCL, `hsl(var(--success))` for CL, `font-weight: 600`).
- Keep the horizontal `ReferenceLine`s but drop their floating labels (now redundant).
- Keep the existing bottom legend for color meaning.

### Out of scope
- No DB schema, RLS, or query changes.
- No new routes or business logic.
- Admin dashboard untouched in this pass (already refactored previously); changes here are dashboard-only.

### Files touched
- `src/components/AppLayout.tsx` — add org chip in header
- `src/components/AppSidebar.tsx` — remove footer org block
- `src/components/dashboard/KpiCard.tsx` — add `badge` slot
- `src/pages/Index.tsx` — header buttons, attention binding, banner slimming, layout restructure
- `src/components/SPCChart.tsx` — Y-axis labeled thresholds, drop floating labels
