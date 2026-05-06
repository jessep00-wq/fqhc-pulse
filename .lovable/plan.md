
# Implementation Plan

Addressing the 8 remaining review items the user approved.

---

## 1. Re-enable email verification (item 3)

Disable auto-confirm on Supabase Auth so users must verify their email before accessing the app. Update the Auth page to show a "check your email" confirmation message after signup instead of immediately redirecting.

**Files:** `src/pages/Auth.tsx` (add post-signup verification message)
**Tool:** `configure_auth` with `auto_confirm_email: false`

---

## 2. "Contact us to upgrade" flow (item 4)

Replace the pricing page CTAs for paid tiers. Instead of linking to `/auth?signup=true`, paid tier buttons will say "Contact Us to Upgrade" and link to `/#contact` (the landing page contact form). The Free tier CTA stays as "Start Free." The sidebar upgrade indicator will also link to `/#contact` instead of `/pricing`.

**Files:** `src/pages/Pricing.tsx`, `src/components/AppSidebar.tsx`

---

## 3. Settings UDS data improvements (item 5)

- Add a "Download Sample CSV" button that generates and downloads a template CSV file with headers and example rows.
- Add a "Seed Demo Data" button directly in the Settings UDS section (uses the existing `seed_demo_data` DB function).

**Files:** `src/pages/Settings.tsx`

---

## 4. SPC chart visibility (item 6)

Move the SPC chart into a tabbed view alongside the UDS Trend chart on the dashboard. Two tabs: "UDS Trends" and "SPC Analysis" — both in the same card, above the fold.

**Files:** `src/pages/Index.tsx`

---

## 5. Notifications are already wired (item 8)

The `NotificationDropdown` already reads from `activity_log`. With the activity logging we just added (PDSA moves, task completion, UDS imports, financial config), notifications will now populate automatically. No additional work needed.

---

## 6. Playbook Library enrichment (item 9)

The Playbook Library has real content from `mockData.ts` (5 playbooks with EHR workflow steps, Azara cadence, and PDSA templates). However, the library could use more playbooks to feel complete. Add 3-4 more playbooks covering under-represented domains (Behavioral Health, Financial/ACO) to fill out the grid.

**Files:** `src/data/mockData.ts`

---

## 7. Mobile responsiveness fixes (item 10)

- Add `overflow-x-auto` to the PDSA Kanban board container so columns scroll horizontally on mobile.
- Set a `min-w` on each Kanban column to prevent squishing.
- Test sidebar behavior at narrow widths (already uses `collapsible="icon"`).

**Files:** `src/pages/PDSALab.tsx`

---

## 8. Complete PDSALab refactor (item 11)

Finish the extraction started in the last session. Replace the inline `AuditBinderDialog`, `CreatePDSAWizard`, `CoachingTip`, `StepIndicator`, type definitions, and `STATUS_COLUMNS` in `PDSALab.tsx` with imports from the already-created files (`src/components/AuditBinderDialog.tsx`, `src/components/CreatePDSAWizard.tsx`, `src/types/pdsa.ts`). This will reduce `PDSALab.tsx` from ~848 lines to ~300.

**Files:** `src/pages/PDSALab.tsx`

---

## Order of execution

1. Auth config change (item 3) — tool call, then Auth page update
2. Pricing "Contact us" (item 4)
3. Settings UDS improvements (item 5)
4. SPC tabbed view (item 6)
5. Playbook enrichment (item 9)
6. Mobile fixes (item 10)
7. PDSALab refactor (item 11)

Items 7 (activity log) and 8 (notifications) are already complete from the previous session.
