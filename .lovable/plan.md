
# MeasureWise Product Enhancement Plan

All five initiatives, delivered in phases. Each phase is independently shippable.

---

## Phase 1 — Competitive Positioning & SPC Hero (Landing + In-App)

**Goal:** Make "built for FQHCs" and "the only QI platform designed around UDS reporting" impossible to miss.

### Landing Page Changes (`Landing.tsx`)
- Add a bold differentiator banner above the hero: *"The only quality improvement platform built exclusively for FQHCs"*
- Add a new **SPC Chart Hero section** between the stats bar and the sample export section:
  - Static/animated SPC chart illustration (using Recharts with sample data, not interactive)
  - Headline: *"Professional-grade SPC charts — without the enterprise price tag"*
  - Subtext explaining control limits, special-cause variation, and why FQHCs need this
  - CTA to `/features/spc-charts`
- Add a **"Why MeasureWise vs. Spreadsheets"** comparison table (MeasureWise vs. Excel vs. Generic QI tools) near the features section

### In-App Dashboard (`Index.tsx`)
- Add a subtle value reinforcement strip under the welcome header: *"Purpose-built for FQHCs · Tracks 20+ UDS measures · HRSA Chapter 10 aligned"*
- Promote SPC tab: change tab order to show SPC Analysis first (instead of UDS Trends), add a small badge "Pro Feature" or "Exclusive"

### Feature Page (`FeatureSPCCharts.tsx`)
- Enhance with a live interactive SPC demo using sample data (reuse existing `SPCChart` component with hardcoded demo data)
- Add "Who uses SPC charts?" section targeting QI Directors

---

## Phase 2 — One-Click Board Report PDF Export

**Goal:** Generate a quarterly board-ready PDF compiling UDS trends, PDSA cycles, task completion, and financial impact.

### New Component: `BoardReportDialog.tsx`
- Triggered from a new "Export Board Report" button on the dashboard
- Collects: report period (quarter selector), organization name
- Generates a multi-page PDF using jsPDF + html2canvas (same pattern as `AuditBinderDialog`)
- Pages:
  1. **Cover Page** — Organization name, period, MeasureWise branding
  2. **UDS Performance Summary** — Table of all measures with current value, target, trend direction
  3. **UDS Trend Charts** — Rendered line charts (same as dashboard)
  4. **SPC Analysis** — One SPC chart per measure with control limits
  5. **Active PDSA Cycles** — Title, status, UDS measure, improvement %, assigned staff
  6. **Staff Task Completion** — Summary stats + breakdown by role
  7. **Financial Impact** — ACO savings, revenue protected, HRSA award

### Dashboard Integration
- Add "Export Board Report" button in the dashboard header area (next to welcome message)
- Gate behind paid tier (show upgrade prompt for free tier)

### Database: No schema changes needed — all data already exists in current tables.

---

## Phase 3 — Multi-Site Network Dashboard

**Goal:** Allow organizations to view aggregate vs. per-site performance for multi-location FQHCs.

### Database Migration
- New `sites` table: `id`, `organization_id`, `name`, `address`, `created_at`
- Add optional `site_id` column to: `pdsa_cycles`, `tasks`, `uds_trends`, `org_financials`
- RLS: same `organization_id`-based policies as existing tables

### New Page: `NetworkDashboard.tsx` (route: `/dashboard/network`)
- **Aggregate view**: Combined UDS trends across all sites, total PDSA cycles, financial rollup
- **Per-site breakdown**: Dropdown to filter by site, side-by-side comparison cards
- **Leaderboard**: Rank sites by UDS measure performance
- Sidebar nav entry with "Enterprise" badge

### Settings Integration
- New "Sites" tab in Settings to add/manage sites
- Site assignment when creating PDSA cycles and entering UDS data

### Gating: Enterprise tier only — show upgrade prompt for other tiers.

---

## Phase 4 — SEO & Indexing Hardening

**Goal:** Ensure all public pages are properly crawlable and optimized.

### Technical SEO
- Verify all public pages have unique `<SEO>` components (most already do)
- Add `<meta name="robots" content="index, follow">` to all public pages
- Ensure `noindex` is NOT set anywhere on public routes
- Add JSON-LD `Organization` schema to Landing page
- Add JSON-LD `SoftwareApplication` schema
- Verify `sitemap.xml` includes all feature pages and blog posts (currently missing some)
- Add Open Graph images per page (currently all share one `og-image.png`)

### Content SEO
- Add FAQ section to Landing page with JSON-LD `FAQPage` schema (targeting long-tail FQHC queries)
- Ensure all images have descriptive alt text (audit existing)
- Add internal linking between blog posts and feature pages

---

## Phase 5 — Polish & Cross-Cutting

- Update Pricing page to highlight Board Report and Network Dashboard as paid features
- Add testimonial/social proof section to Landing (placeholder for now)
- Ensure all new features follow the existing design system (teal primary, enterprise-grade aesthetic)

---

## Implementation Order

Phases 1 and 2 are highest-impact and can be done first. Phase 3 requires a database migration and is the largest effort. Phase 4 is quick wins. Phase 5 is polish.

**Estimated scope:** ~15-20 files touched across all phases.
