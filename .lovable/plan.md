
# Landing Page Conversion Overhaul

## Current State
The landing page already has: hero with CTA, compliance badges, SPC chart section, comparison table, persona cards, founder section, security section, FAQ, and contact form. Many of the requested elements exist in some form but need restructuring, deeper copy, and better information architecture.

## Changes

### 1. Hero Section — Stronger CTA & Clarity
- Keep existing H1 headline
- Replace subheadline with the more specific copy: "MeasureWise™ is a quality operations platform for FQHCs that links every PDSA cycle to specific UDS measures, tracks impact in real time, and auto-builds audit-ready binders for HRSA, NCQA, and Q-PASS reviews."
- Change primary CTA to "See MeasureWise in Action" or keep "Start Your Free PDSA Tracker"
- Add a "What happens when you click" micro-explainer below the CTA buttons (3-step: ask about your FQHC, configure a sample workflow, guided walkthrough)

### 2. New Section: "What MeasureWise Actually Does" (after Stats)
- Full paragraph explaining MeasureWise as a quality operations layer
- Use the exact copy direction provided: "sits on top of your existing EHR and reporting tools..."
- H2 heading for SEO

### 3. New Section: "How It Works" (4-step workflow)
- Visual step-by-step: Set up measures → Build PDSA → Track measure impact → Generate audit binder
- Each step: icon, short heading, 1-2 sentence description
- Numbered steps with connecting visual flow

### 4. Restructure "Key Features" Section
- Expand from 4 cards to include short paragraphs tied to FQHC pain points
- Each feature card gets a pain-point opener (e.g., "Tired of manually assembling audit evidence?")

### 5. New Section: "Outcomes You Can Expect"
- 3-4 outcome cards: UDS performance improvement, HRSA site visit readiness, staff time saved, funding impact visibility
- Concrete framing tied to real FQHC workflows

### 6. New Section: "Why This Instead of Spreadsheets and Azara?"
- 3-4 concise objection-handling paragraphs:
  - "Not another dashboard" — connects improvement work to the measure
  - "PDSA-first, not report-first" — start with the change you're testing
  - "Audit-ready by default" — auto-builds documentation
  - "No enterprise pricing" — built for CHC budgets

### 7. Expand FAQ
- Add new questions:
  - "Does this replace our EHR or Azara?"
  - "What data does MeasureWise use?"
  - "How long does it take to get started?"
  - "Can we start with one site or pilot program?"
- Update FAQ JSON-LD accordingly

### 8. Enhance Founder Section
- Add "Built for FQHCs by FQHC operators" heading
- Slightly expand the founder bio to emphasize the "lived through UDS season" angle

### 9. SEO Improvements
- Update meta title to: "MeasureWise™ – PDSA and UDS Quality Operations Platform for FQHCs"
- Update meta description to the recommended copy
- Ensure H2 headings use strategic keyword phrases throughout
- Body copy naturally incorporates: "FQHC quality improvement platform", "PDSA tracking tool", "UDS measure performance", "HRSA site visit documentation", "NCQA PCMH Q-PASS preparation"

### 10. New Page: `/how-it-works`
- Deeper-dive page with expanded workflow explanation
- Supports SEO with a linkable URL for outreach/social
- Uses `PublicPageLayout` wrapper
- Content: detailed walkthrough of the 4-step workflow, screenshots/illustrations, and a bottom CTA

## Section Order (revised landing page)
1. Nav (unchanged)
2. Differentiator banner (unchanged)
3. Hero (revised copy + micro-explainer)
4. Stats bar (unchanged)
5. **"What MeasureWise Actually Does"** (NEW)
6. **"How It Works" — 4-step workflow** (NEW)
7. SPC Chart Hero (existing, unchanged)
8. Key Features (restructured with pain-point openers)
9. **"Outcomes You Can Expect"** (NEW)
10. Comparison Table (existing, unchanged)
11. **"Why This Instead of Spreadsheets?"** (NEW — replaces/supplements comparison intro)
12. Persona cards (existing, unchanged)
13. Founder section (enhanced copy)
14. Security section (unchanged)
15. FAQ (expanded)
16. Sample Export (existing, unchanged)
17. CTA banner (unchanged)
18. Contact form (unchanged)
19. Footer (unchanged)

## Files
- **Modified**: `src/pages/Landing.tsx` (major restructure)
- **Created**: `src/pages/HowItWorks.tsx` (new deeper-dive page)
- **Modified**: `src/App.tsx` (add `/how-it-works` route)
- **Modified**: `src/components/PublicPageLayout.tsx` (add "How It Works" to nav if needed)

## Technical Notes
- All new sections use existing design tokens and semantic color classes
- No new dependencies required
- JSON-LD schemas updated with new FAQ entries
- Heading hierarchy: single H1, all sections use H2, subsections H3
