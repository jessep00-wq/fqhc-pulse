## Refresh Project Memory (T=0 Snapshot)

### Goal
The project memory at `mem://` already has an index with 25+ entries, but several recently shipped features aren't captured yet (logo system, Google Ads tracking, store, case studies, blog, persona pages, edge functions added recently). Sync memory to current codebase state so future sessions apply the right rules.

### What's already captured (keep)
Core rules (stack, isolation, design, routing, auth, roles, pricing) and 25 referenced memory files covering: purpose, admin ops, dashboard analytics, PDSA lab, playbook library, AI assistant, staff accountability, financial impact, multi-tenancy, auth flow, roles, tech stack, PDSA UX, color logic, persona intent, landing page, security UX, SPC analytics, branding, onboarding, data isolation, AI context, demo data, PDF pagination, email system, newsletter system.

### Gaps to fill (new memory files)
1. **`mem://components/logo`** (design) — Inline-SVG `<Logo>` component in `src/components/Logo.tsx`. Sizes `sm`/`md`/`lg`, `markOnly` + `inverse` props, uses `currentColor` + gradient referencing `--primary`/`--accent`. All header/sidebar/footer/auth/onboarding usages migrated. Do NOT revert to `<img src=measurewise-logo.png>`.
2. **`mem://features/store`** (feature) — Product/bundle storefront under `/store` with `BundleCard`, `ProductCard`, `BuyButton`, `PreviewGallery`, `DeliverablesList`, `FounderCredibilityCard`, `WorkflowStrip`. Stripe checkout via `create-checkout` + `payments-webhook` + `get-order` + `resend-purchase-email` edge functions.
3. **`mem://features/blog`** (feature) — Static blog pages (HRSA checklist, PDSA guide, QI culture, UDS measures 2026) plus `BlogPostDynamic` for DB-backed posts; admin authoring at `/admin/blog`.
4. **`mem://features/case-studies`** (feature) — Three static HTML case studies in `public/case-studies/`, React index at `/case-studies`, redirect handler `CaseStudyRedirect`.
5. **`mem://features/persona-pages`** (feature) — Persona landing pages: QI Director, PCMH Coordinator, CHC Ops Manager. Used for paid-ad targeting.
6. **`mem://features/feature-pages`** (feature) — Per-feature SEO landing pages: HRSA Audit Binder, PCMH Evidence, PDSA, SPC Charts, UDS Tracking.
7. **`mem://features/subscription-billing`** (feature) — Stripe subscription flow: `create-subscription-checkout`, `create-billing-portal`, `useSubscription` + `useTierLimits` hooks, `TrialGuard` + `TrialBanner` + `UpgradePrompt` + `PaymentTestModeBanner` components.
8. **`mem://integrations/google-ads`** (reference) — Google Ads conversion tag `AW-18116909916` lives in `index.html` `<head>`. Do not duplicate; do not move into React.
9. **`mem://integrations/analytics`** (reference) — PostHog (`src/lib/posthog.ts`) + custom `trackEvent` (`src/lib/trackEvent.ts`) + activity logging (`src/lib/activityLogger.ts`).
10. **`mem://features/static-fallback`** (constraint) — `index.html` ships a full no-JS fallback shell mirroring the marketing pitch. Keep in sync with React landing copy; do not delete.
11. **`mem://features/network-dashboard`** (feature) — Multi-org rollup at `/network-dashboard` for Network-tier customers.
12. **`mem://features/sample-exports`** (feature) — `SampleExportButtons`, `AuditBinderDialog`, `BoardReportDialog`, `EvidencePacketDialog` generate downloadable PDFs from the dashboard.

### Updates to existing entries
- **Core rules**: add line noting `Logo` component is canonical (no raw `<img>` for branding), and Google Ads tag is in `index.html`.
- **`mem://features/email-system`**: extend to mention `resend-purchase-email` and `weekly-digest` cron.
- **`mem://features/admin-operations`**: extend to mention `AdminBlog`, `AdminNewsletter`, `AdminStore` consoles.

### Process
1. Read existing memory files to confirm current contents and avoid duplicating.
2. Write the 12 new files via `code--write mem://...`.
3. Update `mem://index.md` (preserve all existing Core + Memories lines, add new bullets + 2 Core additions).
4. Do not touch project source files.

### Files modified
- `mem://index.md` (extended)
- 12 new files under `mem://components/`, `mem://features/`, `mem://integrations/`

No code changes. No dependencies.
