## Consolidate marketing pages + clarify binder/readiness

### 1. Merge 3 persona pages → homepage sections

- Add a "Built for your role" section on `src/pages/Landing.tsx` with three anchor blocks: `#for-qi-directors`, `#for-pcmh-coordinators`, `#for-operations-managers`. Each shows: pain point, 3 relevant capabilities, one testimonial-style line, CTA to Pricing.
- Reuse the existing persona cards on Landing (lines ~84-98) as the entry, but expand into full sections below (not new routes).
- Delete `src/pages/PersonaQIDirector.tsx`, `PersonaPCMHCoordinator.tsx`, `PersonaCHCOpsManager.tsx`.
- In `src/App.tsx`, replace the three `/for/*` routes with `<Navigate>` redirects to `/#for-qi-directors` etc. (preserves SEO backlinks + Google Ads landers).
- Update `public/sitemap.xml` and `public/llms.txt`: drop `/for/*` URLs (they're now hash anchors on `/`).

### 2. Merge 5 Features pages → one `/features` page

- New `src/pages/Features.tsx` with five stacked sections keyed by hash: `#pdsa`, `#uds-tracking`, `#spc-charts`, `#audit-binder`, `#pcmh-evidence`. Reuse the existing copy verbatim; drop each old page's separate `<PublicPageLayout>` wrapper and "Related resources" cross-links (all now on the same page).
- Delete the five `src/pages/features/Feature*.tsx` files.
- In `App.tsx`, replace the five `/features/*` routes with one `/features` route + `<Navigate replace>` redirects from each old slug to `/features#<anchor>`.
- Update `PublicPageLayout.tsx` nav "Features" link from `/features/pdsa-cycle-manager` → `/features`.
- Update `public/sitemap.xml` + `public/llms.txt` to a single `/features` entry (drop the five old slugs).

### 3. Audit Binder vs. Evidence Binder — clarify, keep both

They are distinct dashboard tools, not duplicates:

- **Evidence Binder** (`/dashboard/evidence-binder`): document library keyed to HRSA Chapter 8 categories, per-category upload/expiration tracking, completeness score, ExportBinderDialog. This is the *content*.
- **Audit Binder** (`/dashboard/audit-binder`): QI oversight roles, QI committee meetings, and a one-click OSV PDF that assembles those tables together with UDS/PDSA data from other parts of the app. This is the *narrative export*.

They cross-reference each other but solve different jobs (evidence lives in Evidence Binder; the OSV-ready packet is composed in Audit Binder). No merge — but rename sidebar labels to make the split obvious:
- "Evidence Binder" → "Evidence Library (HRSA)"
- "Audit Binder" → "OSV Export Packet"

And add a one-line description on each page header explaining how they relate (evidence uploads flow into the OSV export). No route/file changes.

If you'd rather actually merge them, say so and I'll fold the Audit Binder oversight/meetings tables into new tabs inside Evidence Binder and drop `/dashboard/audit-binder`.

### 4. Public `/readiness` vs. dashboard — keep, they don't overlap

- Public `/readiness` (`src/pages/ReadinessScore.tsx`): 12-question HRSA-readiness quiz that captures a lead into `readiness_submissions` and emails a report. Marketing/top-of-funnel lead magnet feeding `/admin/readiness`.
- Dashboard equivalent (`Evidence Binder` completeness score): computed from actual uploaded documents inside a paying customer's workspace.

These are different: one is a self-scored pre-purchase questionnaire, the other is measured from real evidence. Neither is redundant with the other, so keep both. Only cleanup:
- Rename public page label to "HRSA Readiness Quiz" in copy so it's not mistaken for the in-app score.
- No dashboard-side "readiness" page exists to remove.

If you disagree — e.g. you want the public quiz gone and replaced with a "Sign up to see your real score" nudge — say so and I'll cut `/readiness`, `src/lib/readiness/*`, the `send-readiness-report` function, and `readiness_submissions`.

### Technical notes

- Redirects use `react-router-dom` `Navigate` with `replace` so old ad links land on the merged surface with the right anchor.
- ScrollToTop already exists; add a small hash-scroll effect on `Landing` and `Features` so `/features#spc-charts` scrolls to the section on load.
- Sitemap + llms.txt updated in the same pass.
- SEO/canonical tags on merged pages: single canonical per new page; old persona/feature `<Helmet>` blocks disappear with their files.

### Open questions

1. Confirm you want backward-compatible redirects for the 8 removed URLs (recommended for SEO/ads). Yes/no.
2. Confirm Audit Binder + Evidence Binder stay split (with clearer labels), or force-merge into one dashboard page.
3. Confirm public `/readiness` stays as the pre-signup lead magnet.
