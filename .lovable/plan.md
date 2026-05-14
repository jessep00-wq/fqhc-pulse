## Goal

Eliminate the two-footer / two-navbar inconsistency. Every public marketing page should render the same full top nav (Features, How It Works, Case Studies, Blog, Newsletter, About, Pricing, Sign In, Start trial) and the same comprehensive footer (Product / Company / Legal & Trust columns, contact email, location, security line, founder credit) defined in `src/components/PublicPageLayout.tsx`.

## Pages currently using a custom simplified header/footer

These all hand-roll a `<header>` with only a "Back to Home" link and a one-line `<footer>`:

- `src/pages/Landing.tsx` — has full custom header + custom slim footer
- `src/pages/Pricing.tsx`
- `src/pages/PersonaQIDirector.tsx`
- `src/pages/PersonaCHCOpsManager.tsx`
- `src/pages/PersonaPCMHCoordinator.tsx`

`PublicPageLayout` already exists and is used correctly by About, HowItWorks, CaseStudies, Contact, Blog*, Feature*, Newsletter*, Store*, etc.

## Changes

1. **Landing.tsx** — wrap page content in `<PublicPageLayout>`. Remove the local `<header>` (lines ~309–) and the local `<footer>` (lines ~1012–1061) plus the duplicate CTA banner if `PublicPageLayout` already provides one (it does — remove Landing's existing pre-footer CTA section to avoid two stacked CTAs). Keep all hero/section content untouched.

2. **Pricing.tsx** — wrap in `<PublicPageLayout>`. Delete custom `<header>` and slim `<footer>`. Drop the "Back to Home" arrow link (the full nav replaces it).

3. **PersonaQIDirector.tsx**, **PersonaCHCOpsManager.tsx**, **PersonaPCMHCoordinator.tsx** — same treatment: wrap in `<PublicPageLayout>`, remove custom header + slim footer + "Back to Home" link.

4. **No changes** to Status, Security, Privacy, Terms, Refund, Auth, NotFound, or any in-app dashboard pages — Status/Security/legal already use a minimal back-link layout that's appropriate for utility pages, and Auth/dashboard are intentionally chrome-free.

## Out of scope

- Visual redesign of the footer itself.
- Changes to authenticated app navigation (`AppLayout`).
- Content edits inside the migrated pages.

## Verification

After edits, load `/`, `/pricing`, `/personas/qi-director`, `/personas/chc-ops-manager`, `/personas/pcmh-coordinator` in the preview and confirm identical header + footer to `/about`.
