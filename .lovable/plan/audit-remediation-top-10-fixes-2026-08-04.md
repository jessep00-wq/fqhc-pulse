# Audit remediation: top 10 fixes

Fixes the blocker, cuts the false claims, unifies naming on **HRSA Audit Binder**, and standardizes the shared page/empty/loading patterns. No database changes.

## 1. Bugs

**QI Report Detail permanent spinner (blocker)**
`src/pages/qi-reports/QIReportDetail.tsx` — add an `isError` / missing-report branch that shows an error card with a Retry button and a "Back to reports" link, mirroring the `hasFetchError` pattern already in `src/pages/NetworkDashboard.tsx`.

**QI Report Wizard dead end**
`src/pages/qi-reports/QIReportWizard.tsx` — the "No organization selected" state tells every user to open the Admin Console. Show the admin variant only when the viewer is an admin (`useUserRole`); non-admins get a "Finish setting up your health center" card linking to `/dashboard/settings`.

**AI Assistant has no PDSA handoff**
`src/pages/AIAssistant.tsx` imports `derivePdsaSeedFromAi` / `savePdsaSeed` and never uses them. Add a "Start a PDSA cycle from this" button under each assistant reply that saves the seed and navigates to `/dashboard/pdsa-lab`, where the wizard already reads the stored seed.

**Dead code**
- Remove the `osv_quiz_*` event names from `src/lib/trackEvent.ts`.
- Delete `src/pages/admin/AdminPipeline.tsx` and route `/admin/pipeline` directly to the redirect in `src/App.tsx`.
- Remove the no-op `onClick={() => {}}` props passed to `PDSACard` in `src/pages/PDSALab.tsx` and drop the unused prop from the card.

## 2. Promise vs. reality

**Cut PCMH / NCQA Q-PASS entirely**
- `src/pages/Landing.tsx` — remove the "NCQA Q-PASS Evidence Collection" feature block and rewrite the PCMH-coordinator persona section around what exists (PDSA documentation, UDS tracking, audit-binder export).
- `src/pages/Pricing.tsx` — remove the "PCMH Q-PASS evidence tracking" bullet from both tiers.
- `public/llms.txt` — remove the Q-PASS line.

**Other overstated or stale copy**
- `src/pages/Landing.tsx` — soften "quantify HRSA Quality Award impact" to match the Features page's description of the AI assistant.
- `src/pages/store/StoreProductDetail.tsx` — remove the "subscribing to our newsletter" line (no newsletter exists).
- `src/data/mockData.ts` — delete the unused `financial_impact` field from all template entries.
- `src/pages/ManualLanding.tsx` — clarify that "14 UDS CQMs" describes the downloadable manual, not the dashboard.

## 3. Naming and terminology

**Canonical name: "HRSA Audit Binder"** (short form "Audit Binder" once on a page).
Update every surface: `src/components/AppSidebar.tsx` nav label and badge, `src/pages/AuditBinder.tsx` page title / H1 / SEO / buttons / dialog, `src/pages/PDSALab.tsx` "Generate OSV Binder" button and dialog titles, `src/components/EvidencePacketDialog.tsx`, `src/lib/auditBinderPdf.ts` PDF headers, and the Landing / Pricing / Features / llms.txt copy that currently says "OSV Export Packet".

**Evidence dialogs**
Rename `CycleEvidenceDocDialog` to `CycleEvidencePacketDialog` and use "evidence packet" in both dialogs' user-facing strings, so the org-wide and per-cycle exports read as the same artifact at two scopes.

**Playbook vs template**
Three distinct concepts get three distinct words:
- Playbook Library → "playbooks" (pre-mapped improvement workflows)
- PDSA wizard → "starters" (pre-filled cycle starting points)
- Store → "downloadable toolkits"
Apply across `src/pages/PlaybookLibrary.tsx`, `src/pages/PDSALab.tsx` / `CreatePDSAWizard.tsx`, `src/pages/Features.tsx`, and the store pages.

**Organization terminology**
Standardize on "health center" in all user-facing copy (with "site" reserved for locations under a health center) across `src/pages/Onboarding.tsx`, `src/pages/Settings.tsx`, `src/components/AppLayout.tsx`, and `src/pages/NetworkDashboard.tsx`.

**Jargon**
Extend `JargonTooltip` to the first occurrence of OSV, HRSA, NIST AI RMF, and PCMH on `src/pages/AuditBinder.tsx`, `src/pages/AIGovernance.tsx`, and `src/pages/PDSALab.tsx`; add those terms to the glossary map.

## 4. UX consistency

- Adopt `src/components/dashboard/PageHeader.tsx` on `PDSALab`, `AuditBinder`, `PlaybookLibrary`, `StaffTasks`, `NetworkDashboard`, and `QIReportsList`, replacing hand-rolled `<h1>` blocks.
- Replace ad-hoc empty blocks with `EmptyState` in `PlaybookLibrary`, `AIGovernance` (four spots), `AuditBinder`, and `QIReportsList`, each with a concrete next-step CTA.
- Swap raw `Loader2` page-level spinners for `Skeleton` layouts in `AIAssistant`, `AuditBinder`, `NetworkDashboard`, and `QIReportDetail`.
- `src/components/AppSidebar.tsx` — change the Network badge from "Enterprise" to "Multi-Site" to match pricing.
- `src/components/AdminLayout.tsx` — add a "Back to app" link to `/dashboard`.
- `src/components/AppLayout.tsx` — drop the redundant header "back to dashboard" icon (logo and sidebar item already cover it).

## Out of scope

`/manual`'s standalone dark theme stays as-is — it's an intentionally separate ad landing page. Retheming it to the design tokens is a separate decision.

## Verification

Typecheck, run the test suite, then a Playwright pass over `/`, `/pricing`, `/features`, `/dashboard`, `/dashboard/pdsa-lab`, `/dashboard/audit-binder`, and `/dashboard/qi-reports` to confirm no broken labels, links, or console errors. Grep for `Q-PASS`, `OSV Export Packet`, and `osv_quiz` to confirm zero survivors.
