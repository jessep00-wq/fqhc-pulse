## Replace Landing Page Dashboard Image

### Problem
The current `dashboard-preview.jpg` is an AI-generated image with garbled text ("Meuttka kalre", "Aay Jun Nor") that undermines credibility.

### Solution
Create a static mock dashboard component with hardcoded realistic FQHC data, render it at a temporary route, take a real screenshot, then use that screenshot as the landing page hero image.

### Steps

**1. Create a static mock dashboard page** (`src/pages/DashboardMock.tsx`)
- Mirror the real dashboard layout from `Index.tsx` but with all data hardcoded (no Supabase queries, no auth)
- Populate with realistic FQHC metrics:
  - **Metric cards**: Active PDSA Cycles: 7 (across 4 UDS measures), UDS Measures at Risk: 2 (below target threshold), Tasks Due This Week: 5 (1 overdue, 4 upcoming), Financial Impact: $142K shared savings, +12% trend
  - **UDS Measure Trends chart**: Real measure names — "Cervical Cancer Screening (CMS124)", "Breast Cancer Screening (CMS125)", "BP Control (CMS165)", "HbA1c Poor Control (CMS122)" with 6 months of realistic trend data
  - **Recent Activity**: entries like "PDSA Cycle 'Diabetes: HbA1c > 9% Reduction' moved to Study phase", "Task 'Upload Q-PASS evidence for PCMH standard 3' completed", "UDS measure CMS124 crossed HRSA 65% target"
- No onboarding checklist shown (simulate a mature account)
- Organization name: "Sunrise Community Health Center"

**2. Add temporary route** in `App.tsx`
- Add `/dashboard-mock` route pointing to the mock page (no auth required)

**3. Screenshot the mock dashboard**
- Navigate to `/dashboard-mock` at a wide viewport (1280px)
- Take a screenshot
- Process it through the product-shot generator with a teal-complementary preset for a polished look

**4. Replace the hero image**
- Save the screenshot as `src/assets/dashboard-preview.jpg` (overwrite existing)
- Remove the mock route and component

### Technical Details
- The mock component reuses the same card layout, Recharts chart config, and Tailwind classes from `Index.tsx`
- All data is inline constants — no database dependency
- The sidebar navigation will be visible in the screenshot, showing the full app chrome
