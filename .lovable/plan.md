# MeasureWise End-to-End Audit — Findings Only

Four parallel auditors covered: (1) frontend routes/forms/UX, (2) frontend↔backend wiring, (3) Supabase backend (RLS, functions, edge functions, FKs), (4) auth and integrations. No code was changed.

---

## 🔴 CRITICAL — fix first

1. **Password reset is broken on PKCE flow** — `src/pages/ResetPassword.tsx:19` only checks `window.location.hash` for `type=recovery`. Supabase v2 default delivers the recovery token via `?code=` query param. The `PASSWORD_RECOVERY` event is never handled in `AuthContext`. Result: legitimate reset links land on "Invalid or expired link."
2. **`send-email` edge function may be an open relay** — `src/pages/Auth.tsx:120` invokes `send-email` with client-supplied `to`/`subject`/`html`. The backend audit found `send-email` does restrict `to === user.email` ✅, but the frontend pattern lets any authenticated user trigger arbitrary `subject`/`html` payloads to themselves. Plus a **duplicate welcome email** is sent: one from `Auth.tsx:120` and one from `AuthContext.tsx:49` (localStorage-guarded only).
3. **Cross-org data leak risk in PDSA detail dialog** — `src/components/PDSADetailDialog.tsx:153` (tasks) and `:257` (pdsa_evidence) filter only by `pdsa_cycle_id`, with **no `.eq("organization_id", ...)`** — violates the project's explicit-org-filter rule. Sole guard is RLS.
4. **Trend chart sort is dead code** — `src/pages/Index.tsx:308` uses `MONTH_ORDER = ["Jan","Feb",…]` but DB months are `"2025-01"` strings. `indexOf` returns `-1` for every row, so months render in insertion order. XAxis also shows raw `YYYY-MM` (no `tickFormatter`).

---

## 🟠 HIGH — security / data / silent failures

### Auth / identity
5. `AuthContext.tsx:26` uses `session.user` (decoded JWT, **unverified**) as trusted identity — never calls `supabase.auth.getUser()`. Same value feeds `useUserRole.ts:16` cache key.
6. `src/pages/ResetPassword.tsx:25` enforces 6-char min password; signup enforces 8-char + complexity. Users can reset to weaker passwords than signup allows.

### Backend
7. **`create-checkout` edge function** initializes a service-role Supabase client at module scope before any auth check — risk if auth fence isn't first statement.
8. **`org_financials` missing FK** to `organizations(id)` — every other org-scoped table has it. Orphan financial rows possible.

### Frontend wiring
9. **Mutations with no `onError`/toast** (silent failures):
   - `PDSADetailDialog.tsx:212` `updateTask` (only one on the dialog without an error toast)
   - `AdminStore.tsx:99` `removePreview` and `:110` `removeFile` — ignore both storage and DB errors, always shows success toast
10. **Dashboards render `0` during load with no loading/error UI**:
    - `Index.tsx:234-282` four queries, no `isLoading`/`isError` in JSX
    - `NetworkDashboard.tsx:33-67` same
    - `AdminStore.tsx:30-50` raw `useEffect`+`Promise.all` with no error handling at all
11. **20+ files cast `supabase as unknown as { from: (t: string) => any }`** — entirely bypasses generated types. Top offenders: `QIReportsList`, `QIReportDetail`, `QIReportWizard`, `AuditBinder`, evidence-binder pages, `AIGovernance.tsx`. Schema renames will fail at runtime, not compile.

---

## 🟡 MEDIUM — UX, hardening, hygiene

### Backend / RLS
12. `seed_demo_data()` SECURITY DEFINER has no `is_founder_admin` guard inside (only revoked from anon/public) — `admin_delete_organization` has one; should match.
13. `get_user_org_id()` not explicitly REVOKEd from `anon`.
14. `organizations` INSERT policy `WITH CHECK (true)` for any authenticated user — no cap on org creation.
15. `newsletter_subscribers` and `playbook_leads` open INSERT to `anon` with no email/length CHECK constraints (waitlist_applications has these ✅).
16. AI edge functions (`ai-root-cause`, `draft-qi-report`) call Lovable AI gateway with no `org_access_status` check — locked/expired-trial orgs can consume AI quota.
17. CORS `Access-Control-Allow-Origin: "*"` on all browser-facing edge functions.
18. `profiles.organization_id` FK has no `ON DELETE SET NULL`.

### Frontend / wiring
19. `as any` casts hiding type drift on admin mutations (`ExtendTrialDialog`, `ConvertToPaidDialog`, `EditOrgDialog`, `AdminAccountDetail`).
20. Cycle clone (`PDSADetailDialog.tsx:220`) and Kanban drag status update (`PDSALab.tsx:844`) — no `onError`. Drag failure leaves UI/DB out of sync silently.
21. `Onboarding.tsx` is mounted at a public route (`App.tsx:126`) with no `ProtectedRoute`; unauthenticated visitors see the form, submit silently no-ops.
22. `Auth.tsx:105` `emailRedirectTo` lands on `/` (public landing) instead of `/auth` or `/dashboard` — user must re-login after email confirmation.
23. Google OAuth `redirect_uri` → `/dashboard` causes onboarding-redirect flash race.
24. Welcome-email dedup keyed on `localStorage` (`AuthContext.tsx:47`) — fires again on new device / cleared storage. Should be a `profiles.welcome_email_sent` column.
25. `PostHog` key hardcoded in `src/lib/posthog.ts:3` instead of `VITE_POSTHOG_KEY` — can't rotate without deploy.
26. `Onboarding.tsx:107` orphans organization row if profile update fails (no rollback).
27. Missing loading/error states on `AdminAccountDetail` (4 of 5 queries), `TeamInviteSection`, `PDSADetailDialog` tasks query, `StoreIndex`.
28. `AIAssistant.tsx:67` shows both toast.error AND inline "Sorry…" assistant message on failure — duplicate signal.
29. `Settings.tsx:85,126` mutates state during render body instead of `useEffect` — Strict-Mode double-render bug.
30. `Settings.tsx:587` per-row delete buttons not individually disabled while one delete is pending.

---

## 🔵 LOW — cosmetic / informational

31. No `<SEO>`/`<title>` on `PDSALab`, `AIAssistant`, `AuditBinder`, `AIGovernance`, `NetworkDashboard`, `PlaybookLibrary`, `StaffTasks`, `Auth`, `Onboarding`, `ResetPassword` (latter should also be `noindex`).
32. `PDSALab.tsx` Kanban (5 × 220px) and `NetworkDashboard.tsx:149` 200px select — no horizontal scroll wrapper on phones.
33. `ManualLanding.tsx:124,129` decorative blobs (`w-[800px]`, `w-[600px]`) bloat mobile paint area.
34. `PDSAFilters.tsx` 150/160/180px selects can overflow narrow viewports.
35. `NotFound.tsx:8` logs to `console.error` on every 404; `ContactForm.tsx:140`, `BoardReportDialog.tsx:120`, `ReadinessScore.tsx:102` `console.error` raw errors in prod.
36. `BoardReportDialog.tsx:120` failure path has no user toast.
37. `AdminRoute.tsx:18` redirects unauthenticated visitors to `/` instead of `/auth` (inconsistent with `ProtectedRoute`).
38. Auth tokens in `localStorage` (XSS-accessible) — `client.ts:13`. Acceptable but noted for HIPAA-adjacent product.
39. `StoreSuccess.tsx:34` calls `get-order` with URL-supplied `sessionId` — verify the edge function checks ownership.
40. `team_invitations` missing UPDATE policy; `activity_log` no UPDATE/DELETE (likely intentional, undocumented).
41. `CaseStudyRedirect` hardcoded `VALID_SLUGS` set — new case studies require code deploy.
42. `send-email` has no per-user rate limit beyond Resend defaults.

---

## Suggested fix order

1. **Today**: items 1, 2, 3, 4 (auth + cross-org leak + broken chart).
2. **This week**: 5–11 (identity trust, edge function fence, FK, silent mutations, dashboard loading states).
3. **Backlog**: medium UX/hardening (12–30) and low-severity polish (31–42).

If you want, in build mode I can take any single section (e.g. "everything CRITICAL" or "all silent-mutation fixes") and implement it as a focused patch.
