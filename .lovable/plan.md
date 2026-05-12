## Goal
Ensure `measurewise.org` renders a complete, trust-building landing experience even when JavaScript is disabled, blocked, or still loading — so healthcare buyers (Quality Directors, CMOs, IT reviewers behind locked-down browsers) never see a blank or near-blank page.

## Current state
`index.html` already contains a static fallback inside `#root` (header, hero headline, sub-headline, two CTAs, dashboard screenshot). React replaces it on mount. However:

1. The fallback is only a hero — no proof points, features, pricing, or footer. Buyers scanning with JS off still see "an unfinished page."
2. The `<noscript>` tag only shows a small yellow banner — it does not duplicate the marketing content for crawlers/scanners that strip JS.
3. There is no structured data (JSON-LD) to back the static markup.
4. No `<style>` block — the inline styles are repetitive and the fallback isn't responsive at small breakpoints.

## What to build

### 1. Expand the static `#root` fallback in `index.html`
Keep the existing hero, then add (all inline-styled, no JS, no external CSS):
- **Trust strip** — "Built for FQHCs · HRSA Chapter 10 aligned · NCQA PCMH evidence ready · UDS reporting"
- **3-up "what you get" grid** — PDSA Cycle Manager / SPC Charts on UDS Measures / One-click HRSA Audit Binder, each with a 1-line description
- **Founder credibility line** — "Built by Jessica R. Smith, BSN — an FQHC Quality Director, not a template factory."
- **Pricing teaser** — Solo $149 / Multi-Site $349 / Network $699, all with "14-day free trial"
- **Secondary CTA block** — "Start 14-day free trial" + "Book a 15-min walkthrough" (mailto)
- **Static footer** — copyright, Terms, Privacy, Contact (mailto:support@measurewise.org)

All of this lives inside `#root` so React still hydrates over it on JS-enabled clients.

### 2. Mirror the fallback inside `<noscript>`
Add a second `<noscript>` block in `<body>` containing the same marketing sections (hero + trust + features + pricing + CTAs + footer) so:
- Search-engine renderers that don't execute JS still index the full pitch
- Hardened corporate browsers (common in hospital IT) see a complete page even if React fails to load
- Keep the existing yellow "JavaScript is required for the full experience" notice at the top of the noscript content

### 3. Add small inline `<style>` block in `<head>`
Replace repeated inline styles with a tiny stylesheet (~40 lines) using semantic class names (`.mw-hero`, `.mw-cta`, `.mw-grid-3`, etc.) so the fallback is responsive (single column < 640px) without bloating the file. Use the same teal `hsl(192 70% 35%)` brand color.

### 4. Add JSON-LD structured data
Inside `<head>`, add `<script type="application/ld+json">` with `SoftwareApplication` schema (name, description, offers, aggregateRating placeholder removed, applicationCategory: "HealthApplication"). This is static markup — no JS execution required — and reinforces the no-JS render for crawlers.

### 5. Verify
- View the preview with JS disabled (DevTools → Command Palette → "Disable JavaScript") and confirm hero, features, pricing, CTAs, screenshot, and footer all render and are clickable.
- View `view-source:` to confirm the noscript block contains the full marketing copy.
- Run Lighthouse SEO audit to confirm no regression.

## Files to change
- `index.html` — only file touched. No React/component changes, no backend changes.

## Out of scope
- True SSR (would require migrating off Vite SPA — not worth it for one page).
- Prerendering pipeline (e.g., `vite-plugin-prerender`) — can be a follow-up if buyers still report issues.
- Changes to the React `Landing.tsx` page (the JS-enabled experience already covers this content).
