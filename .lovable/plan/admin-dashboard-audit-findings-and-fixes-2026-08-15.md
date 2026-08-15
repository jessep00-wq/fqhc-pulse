# Admin Dashboard Audit — findings and fixes

Two different things get called "admin" in this product, and that is the root of most of the problems below:

- **Platform admin** (`/admin`) — your internal console for running MeasureWise as a business (accounts, billing, adoption, store).
- **Customer admin** (a health center's QI Director or multi-site coordinator) — the person who owns the workspace, invites staff, and wants a rollup across sites.

The first one exists and is in decent shape. The second one **does not exist as a distinct role today.**

## 1. Is admin clearly separated from the customer dashboard?

Mostly yes: `/admin` has its own sidebar, an "Admin Console" badge in both the sidebar and the top bar, and a "Back to App" link. The customer sidebar shows an Admin link only to founder/support roles.

Two real problems:

- **The "Acting as" org switcher silently does nothing for an admin who has their own workspace.** The org resolution only falls back to the admin-selected org when the admin's own profile has no organization. Picking an org triggers a full page reload and then shows your own workspace anyway.
- **When acting-as does work, the customer dashboard gives no signal you are inside someone else's tenant** — just the normal org name chip. Nothing says "you are viewing a customer workspace as an admin."

## 2. Can an org owner / multi-site coordinator see aggregate data?

- The `org_admin` role exists in the database enum but is **never referenced anywhere in the app**. Every member of a health center sees exactly the same thing; there is no owner-level view, no permission difference, no way to manage members beyond inviting.
- **Multi-site rollup exists but is unreachable in practice.** The Network page (paid tiers) is the only place sites can be created, and cycles, tasks, and UDS trends carry a site field that no other screen reads or writes. So a coordinator can add sites but cannot tag any work to them — the rollup will always read zero.
- **Team invitations are a dead end.** Inviting a colleague inserts a row and shows "Invitation sent!", but no email is sent and there is no acceptance flow. The invited person never hears anything.

## 3. Repetition and friction in the admin console

- The org table, the archived/active view filter, and the row actions menu are re-implemented across Accounts, Adoption, Users, and Billing — four near-identical tables of the same accounts.
- Switching "Acting as" forces a hard `window.location.reload()`.
- Adoption auto-fires the health computation on mount whenever the table is empty, so simply opening the page kicks off a backend job with no confirmation.
- Getting from a KPI tile to one account still means tile → filter → find row → click name; there is no search box on the accounts table.

## 4. Unfinished / inconsistent with the marketing site

- Adoption uses hardcoded Tailwind colors (`bg-green-100`, `bg-amber-100`, `bg-red-100`) instead of the semantic tokens used everywhere else — it does not match the rest of the app and breaks dark mode.
- Adoption uses a plain heading while Accounts uses the shared page-header component: two different page shells inside the same console.
- The admin tables have no responsive treatment — on a laptop-width window the wide tables overflow.
- Empty risk-flag and export columns render as "—" / "Never" with no explanation of what would populate them.

---

# Proposed fixes

**A. Fix admin/customer mode confusion**
1. Make "Acting as" authoritative — when an admin selects an org, it overrides their own workspace instead of being ignored.
2. Replace the hard reload with an in-app refresh of the org context.
3. Show a persistent impersonation bar in the customer app when acting as another org: "Admin view — <Org name>" with a one-click exit back to `/admin`.

**B. Give the customer side a real owner view**
4. Wire `org_admin`: the workspace creator becomes org admin; the role gates member management and workspace settings. Everyone else keeps read/write on quality work but not on billing/team.
5. Add a site selector to PDSA cycles and tasks so work can actually be tagged to a site, making the Network rollup real.
6. Finish invitations: send the invite email and add an acceptance link that joins the org, plus pending/expired states in the member list.

**C. Reduce admin repetition**
7. Extract one shared `AccountsTable` (filter + actions + search) and reuse it on Accounts, Adoption, Users, and Billing.
8. Replace Adoption's auto-run with an explicit "Run now" prompt.

**D. Polish**
9. Swap hardcoded health colors for semantic tokens, and use the shared page header on every admin page.
10. Make admin tables horizontally scrollable within the content area at narrow widths.

## Technical notes

- Acting-as: `src/contexts/OrgContext.tsx` currently only reads `mw_admin_active_org` when `profile.organization_id` is null; change to check the admin role first and let the override win. Expose `isActingAs` from the context for the impersonation bar and drop the `window.location.reload()` in `src/components/AdminLayout.tsx` in favour of `refetchOrg()`.
- `org_admin` gating needs a database migration: assign the role on workspace creation and add policies keyed to `has_role(auth.uid(), 'org_admin')` for team and billing surfaces.
- Invitations need a new edge function (reusing the existing Resend send-email path) plus a token column and an accept route; no email is sent today.
- Site tagging touches `src/pages/PDSALab.tsx`, `src/components/pdsa/CreatePDSAWizard.tsx`, and `src/pages/StaffTasks.tsx` — the `site_id` columns already exist.

## Suggested order

A (1-3) first — it is small and removes an actively misleading control. Then B6 (invites are a visible broken promise), then B4/B5, then C and D.
