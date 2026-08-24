# MeasureWise trust, conversion, and accessibility pass

Targeted fixes to the existing site. No brand redesign, no new visual system, no invented proof.

## 1. Centralized content source of truth

New `src/lib/siteContent.ts` holding one copy of the values that currently drift:

- `FOUNDER_EXPERIENCE_YEARS = 14` and the sentence "14 years of healthcare quality improvement and operational experience."
- PHI boundary long form and short form ("No PHI required or permitted.")
- Security bullets: "TLS 1.2+ in transit", "AES-256 at rest", RLS tenant isolation.
- `externalValidation` config object (`enabled: false`, quote, name, title, organization, verificationLabel, caseStudyUrl).

Pages import from here instead of repeating strings.

## 2. Homepage (`src/pages/Landing.tsx`)

- Replace "12 years" with the centralized 14-year sentence.
- Trust bullets: "TLS 1.3 encryption in transit" becomes "TLS 1.2+ in transit"; delete "HIPAA-ready architecture with BAA available" and replace with "No PHI required or permitted".
- SOC 2 bullet: change to vendor-attestation wording, and gate it behind the approval list in section 8 (removed if you do not approve).
- New `IndependentValidation` section component rendered before the final CTA; returns `null` when `externalValidation.enabled` is false or the quote is empty. No placeholder markup ships.
- CTA hierarchy: primary "Start 14-day free trial" (solid), secondary "See the demo" (outline, linking `/demo`), tertiary "Contact MeasureWise" (text link). Remove duplicate mid-page trial buttons that add no decision value.
- Move the AthenaOne playbook lead-magnet section and any store promo out of the conversion sections into a low-priority resources block just above the footer.

## 3. 2025 UDS resource treatment

- `PlaybookLeadMagnetSection` eyebrow "Free Resource · 2025 Edition" becomes "2025 UDS Reference Guide", headline reworded away from "Master Your 2025 UDS Reporting".
- Add the note: "This resource reflects 2025 reporting guidance. Review current HRSA guidance before using it for 2026 reporting."
- Same label/note applied to `PlaybookSidebarCard`.
- No renaming to 2026 anywhere; nothing labeled current/latest.

## 4. Pricing → signup plan confirmation

- `src/pages/Pricing.tsx`: extract the tier definitions into `src/lib/pricingPlans.ts` (single source shared by pricing and signup) so no duplicate price table exists.
- Pricing CTA buttons get unique `aria-label`s: "Start 14-day free trial for Multi-Site plan, billed annually" etc.
- `src/pages/Auth.tsx`: read and validate existing `?plan=&billing=` params against the shared plan list. When valid, render a plan summary card above the account fields showing plan name, "14 days free", exact price, "$3,490 annually after trial" style billing timing, "No card required today", and a "Change plan" link back to `/pricing` preserving billing. Invalid or missing params render nothing and keep today's behavior.

## 5. Signup accessibility (`src/pages/Auth.tsx`)

- Every `Label` gets `htmlFor` matched to an input `id`, including the Staff Role select trigger (`aria-labelledby` on the shadcn trigger).
- Password requirements shown below the field before submit, not only after typing.
- Show/hide password toggle button with `aria-pressed` and "Show password" / "Hide password" accessible names.
- Field errors wired with `aria-describedby`; a form-level `aria-live="polite"` status region.
- Heading order: single H1, then H2 sections (no H1 to H3 jump).

## 6. Shared navigation and landmarks (`src/components/PublicPageLayout.tsx`)

- "Skip to main content" as the first focusable element, visually hidden until focused.
- `<main id="main-content" tabIndex={-1}>` in the layout; verify each page renders one `<main>` only.
- Header/nav/main/footer semantics confirmed; icon-only controls (cart, menu, dialog close) get accessible names.
- Cart button moved out of the primary SaaS nav into the store/resources context (kept functional, still reachable from the mobile menu).

## 7. Comparison table and PDF preview

- `ComparisonCell` in Landing: checkmarks get `aria-hidden` plus visually hidden "Included"; dashes/blanks get "Not included". Header row uses `<th scope="col">`, feature names `<th scope="row">`. Horizontal scroll container gets a keyboard-focusable region on mobile.
- `SampleExportButtons` PDF preview uses the shadcn `Dialog` (Radix) with a real `DialogTitle` and description, which supplies `role="dialog"`, `aria-modal`, focus trap, Escape close, background inert, and focus restore. Add a visible labeled close button and mobile-safe scrolling/sizing. Confirm the dialog does not overwrite the route title.

## 8. Contrast tokens (`src/index.css`)

- Darken `--muted-foreground` (currently `215 15% 47%`) to roughly `215 18% 38%` so muted body copy clears 4.5:1 on white.
- Add a darker text-safe teal token for inline links/labels while keeping the brand teal for fills; primary stays `192 70% 35%`.
- Sweep muted copy, helper text, badges, table text, and footer for one-off gray classes and route them through tokens. Focus rings kept high contrast; include/exclude states never rely on color alone.

## 9. Security, privacy, terms copy

- `src/pages/Security.tsx`: rewrite the PHI section to the approved paragraph, add a visually distinct "No PHI in MeasureWise" callout, standardize TLS 1.2+.
- `src/pages/PrivacyPolicy.tsx` and `src/pages/TermsOfService.tsx`: remove the "contact us to discuss ... Business Associate Agreement" invitations; replace with the centralized boundary statement.
- `public/llms.txt` PHI/TLS line aligned.
- The AI Governance feature keeps its internal BAA/PHI vendor-tracking fields — that is customer-vendor tracking inside the product, not a MeasureWise claim, so it is unchanged.

## 10. Route metadata

Use the existing `SEO` component per route with the specified titles and distinct descriptions for home, pricing, demo, signup, security, store, and the resources block. `brandTitle()` already dedupes the brand suffix; titles are adjusted so nothing renders doubled.

## 11. QA

Playwright pass on desktop (1280) and mobile (390) covering: skip link focus order, signup labels and password toggle, plan card for each plan/billing combination plus invalid params, pricing button accessible names, comparison table semantics, PDF dialog focus trap and Escape, and contrast of muted text.

## Statements needing your factual approval

1. SOC 2 — the homepage currently claims "Built on SOC 2 Type II certified infrastructure". Proposed replacement: "Hosted on infrastructure provided by vendors with SOC 2 Type II attestations." I will remove the claim entirely unless you confirm.
2. TLS 1.2+ as the sitewide wording (replacing the homepage's TLS 1.3 claim).
3. Backup/recovery and AWS us-east hosting details already on the Security page.
4. Any future external validation content — shipping disabled and empty.

## Assumptions

- There is no `/resources` route today. The 2025 guide and store promos move into a lower-page resources block on the homepage plus the footer, rather than adding a new page — say the word if you want a dedicated `/resources` route instead.
- Trial pricing display uses the existing Solo/Multi-Site/Network tiers as the single source of truth.
