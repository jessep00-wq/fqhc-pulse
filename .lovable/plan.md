
# Dashboard UX Improvements

## 1. Recent Activity empty state with CTA
Replace the plain "No recent activity" text with an actionable prompt: icon, explanation, and a "Start your first PDSA cycle" button linking to `/dashboard/pdsa-lab`.

**File:** `src/pages/Index.tsx` (lines 486-488)

## 2. Financial Impact card — value-first empty state
Replace "No financial data configured" with outcome-oriented copy: "See how quality improvements translate to revenue and penalty avoidance." Keep the Configure button but add context above it.

**File:** `src/pages/Index.tsx` (lines 420-425)

## 3. Sidebar nav reorder — PDSA Lab first
Move "PDSA Lab" above "Dashboard" in the nav items array (or place it second but visually emphasize it). Since Dashboard is the landing route and should stay first for routing, we'll reorder to: Dashboard, PDSA Lab stays second but we'll add a subtle badge/label "Core" to PDSA Lab to signal it's the primary workspace.

**File:** `src/components/AppSidebar.tsx` — add a visual accent (e.g., dot or bold) to the PDSA Lab nav item.

## 4. UDS Measure Trends chart — clarity fixes
- Rename Y-axis labels: left → "Screening & Control (%)", right → "Poor Control (%)"
- Add a subtitle below the chart title explaining: "Higher is better for screening measures (left axis). Lower is better for HbA1c poor control (right axis, dashed)."
- Ensure BP Control (CMS165) uses `yAxisId="left"` and `connectNulls` so gaps don't hide the line.

**File:** `src/pages/Index.tsx` (lines 449-464)

## 5. Upgrade banner — move to sidebar footer
Remove the mid-content `UpgradeBanner` from the dashboard body. Instead, show a compact free-tier indicator in the sidebar footer (below the org info card) that links to `/pricing`.

**Files:**
- `src/pages/Index.tsx` — remove UpgradeBanner
- `src/components/AppSidebar.tsx` — add compact upgrade strip in SidebarFooter

---

### Technical Details

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Items 1, 2, 4; remove upgrade banner (item 5) |
| `src/components/AppSidebar.tsx` | Item 3 (PDSA Lab accent), Item 5 (sidebar upgrade strip) |
