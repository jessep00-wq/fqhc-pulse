
# Pricing Page Overhaul

## Changes to `src/pages/Pricing.tsx`

### 1. Add Free Tier (first column)
Add a "Free" tier as the leftmost card:
- **Price**: $0/month
- **Description**: "Your first PDSA cycle, on us."
- **Features**: 1 user, 3 active PDSA cycles, 1 clinic site, UDS measure dashboards, HRSA audit binder export (watermarked), guided PDSA methodology, self-serve onboarding
- **CTA**: "Start Free" (links to /auth?signup=true)
- No highlight styling

### 2. Monthly/Annual Billing Toggle
Add a toggle above the pricing cards:
- Default: Monthly
- Annual shows ~17% discount (2 months free)
- Annual prices: Free stays $0, Solo Clinic $124/mo ($1,490/yr), Multi-Site $291/mo ($3,490/yr), Network $582/mo ($6,990/yr)
- Small "Save 2 months" badge next to the Annual option
- State managed with `useState`

### 3. Update Grid to 4 Columns
Change from `md:grid-cols-3` to `lg:grid-cols-4` (stack on mobile, 2x2 on md, 4 on lg).

### 4. Visual Hierarchy for Multi-Site
The "Most Popular" badge and ring already exist. Enhance by:
- Adding `scale-105` transform on the Multi-Site card at md+ breakpoints
- Adding a subtle gradient background to the card header

### 5. Financial Impact Teaser in Lower Tiers
- Solo Clinic: Add "Financial impact tracking" as a disabled/locked item with a lock icon and muted styling, labeled "Available in Multi-Site"
- Creates upgrade envy without hiding the feature

### 6. Update FAQ
- Add: "What's included in the Free plan?" explaining the 1-user, 3-cycle limits and full PDSA functionality
- Add: "Do you offer annual billing?" explaining grant/budget alignment and 2-months-free discount
- Update the cancel question to mention annual plans

### 7. Hero Pill
Keep as-is: "30-day free trial — no credit card required"

## No database or backend changes required.
