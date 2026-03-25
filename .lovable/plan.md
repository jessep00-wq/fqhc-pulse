

# Dashboard Clinical Accuracy & UX Improvements

## 1. Fix CMS122 Inverse Measure on Chart
CMS122 (HbA1c Poor Control) is currently plotted on a 40-80 Y-axis alongside screening measures, which is clinically incorrect — it's an inverse measure where lower is better and typical values are 20-35%.

**Approach:** Add a secondary right-side Y-axis (`yAxisId="right"`) for CMS122 with a 15-45 domain. Update mock data to use realistic values (e.g., 38→28 trending down). Add a subtle label or legend note indicating "↓ Lower is better" for the inverse measure. Bind CMS122's `Line` to the right axis.

**Files:** `src/data/mockData.ts` (fix CMS122 values), `src/pages/Index.tsx` (add second YAxis, ReferenceLine)

## 2. Add HRSA/ACO Target Reference Lines
Add `<ReferenceLine>` components inside the `<LineChart>` for key benchmarks — e.g., HRSA benchmark at 65% for CMS124/CMS125, 60% for CMS165, and a target at 25% on the right axis for CMS122. Styled as dashed lines with labels.

**Files:** `src/pages/Index.tsx`

## 3. Make Metric Cards Clickable
Add `onClick` / navigation props to `MetricCard`. Clicking "Active PDSA Cycles" navigates to `/pdsa-lab`, "Tasks Due" to `/staff-tasks`, "Measures at Risk" highlights the chart. Add `cursor-pointer hover:bg-accent transition-colors` styling.

**Files:** `src/pages/Index.tsx` (update MetricCard component, add `useNavigate`)

## 4. Dynamic Organization Name
Replace hardcoded "Sunrise Community Health" with a value from a context provider. Create an `OrgContext` that currently provides mock data but is ready for Supabase session integration.

**Files:** New `src/contexts/OrgContext.tsx`, update `src/pages/Index.tsx`, `src/App.tsx` (wrap with provider), `src/components/AppSidebar.tsx` (consume context for footer)

## 5. Split Financial Impact Card
Redesign the Financial Impact card into two visually equal sections:
- **Value-Based Care (ACO):** Shared savings amount + trend
- **Fee-for-Service / Grant Protection:** HRSA Quality Award amount + revenue protected

Add a `Separator` between blocks. Update mock data to include `hrsaQualityAward` field.

**Files:** `src/data/mockData.ts` (add hrsaQualityAward), `src/pages/Index.tsx` (redesign card layout)

## Summary of Changes
| File | Changes |
|------|---------|
| `src/contexts/OrgContext.tsx` | New — org context provider |
| `src/data/mockData.ts` | Fix CMS122 values, add hrsaQualityAward, add benchmark targets |
| `src/pages/Index.tsx` | Dual Y-axis, reference lines, clickable cards, dynamic org name, split financial card |
| `src/App.tsx` | Wrap with OrgProvider |
| `src/components/AppSidebar.tsx` | Consume org context for footer |

