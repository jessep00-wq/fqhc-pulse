
# Dashboard UX Overhaul

## 1. Make "UDS Measures at Risk" clickable with detail panel

The MetricCard currently has no `onClick`. Add a dialog/sheet that opens when clicked, listing each measure currently below the 65% threshold with its name, latest value, and target — plus a link to navigate to PDSA Lab filtered by that measure.

**File:** `src/pages/Index.tsx`

---

## 2. Add a value-prop welcome header

Replace the plain "Dashboard" / subtitle with a contextual welcome section:

- **Headline:** "Your Quality Improvement Command Center"
- **One-liner:** "Track UDS measures, run PDSA cycles, and connect clinical improvements to financial outcomes — all in one place."
- Show the user's name (from auth) and org name for personalization.

This gives first-time visitors immediate orientation.

**File:** `src/pages/Index.tsx`

---

## 3. Add tooltips to jargon-heavy terms

Create a small `JargonTooltip` wrapper component. Add tooltips to:

| Term | Tooltip |
|------|---------|
| PDSA | Plan-Do-Study-Act — a structured cycle for testing and implementing quality improvements |
| UDS | Uniform Data System — standardized clinical measures reported annually to HRSA |
| SPC | Statistical Process Control — charts that distinguish normal variation from meaningful change |
| HRSA | Health Resources & Services Administration — the federal agency that funds and oversees FQHCs |
| ACO | Accountable Care Organization — a value-based payment model rewarding quality outcomes |

Apply to metric card titles, chart headers, and section titles throughout the dashboard.

**Files:** `src/components/JargonTooltip.tsx` (new), `src/pages/Index.tsx`, `src/components/SPCChart.tsx`

---

## 4. Enhance the onboarding checklist

The `OnboardingChecklist` component already exists but is easy to miss. Improvements:

- Add a prominent welcome message above it for brand-new orgs (0 completed items): "Welcome to MeasureWise! Complete these steps to set up your quality improvement workspace."
- Make the checklist default to **expanded** (it already does) and more visually prominent with a gradient border.
- Add numbered steps for clearer sequencing.

**File:** `src/components/OnboardingChecklist.tsx`

---

## Files summary

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Welcome header, at-risk dialog, jargon tooltips on metric cards and chart titles |
| `src/components/JargonTooltip.tsx` | New — reusable tooltip wrapper for QI jargon |
| `src/components/OnboardingChecklist.tsx` | Welcome message for new orgs, numbered steps, visual enhancement |
| `src/components/SPCChart.tsx` | Add jargon tooltip to SPC chart title |
