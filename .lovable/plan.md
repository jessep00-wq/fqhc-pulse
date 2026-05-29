## Goal
Update only the static HTML fallback inside `<div class="mw-fallback">` in `index.html` so it matches the React landing page on first paint. No other files, no meta/script/JSON-LD changes.

## Changes (scoped strictly to `<div class="mw-fallback">`)

### 1. Header nav (`<nav class="mw-nav">`)
Replace current 3 links (Store, Sign In, CTA) with the full React navbar set, in this order:

- Features → `/features/pdsa-cycle-manager`
- How It Works → `/how-it-works`
- Case Studies → `/case-studies`
- Blog → `/blog`
- Newsletter → `/newsletter`
- Store → `/store`
- About → `/about`
- Pricing → `/pricing`
- Sign In → `/auth` (using existing `.mw-link` style)
- CTA button → `/auth?signup=true`, text: `Start 14-day free trial →` (matches React's "Start 14-day free trial" + arrow icon; existing `.mw-btn` class)

All link items reuse existing `.mw-link` class so no CSS changes are needed. The nav already wraps via existing flex styles.

### 2. Hero headline (`<h1 class="mw-h1">`)
Replace current text with exactly:

> FQHC quality leaders: stop running PDSA cycles that never show up in your UDS results.

### 3. Hero CTA button text
Confirm the hero `.mw-btn` already reads `Start 14-day free trial →` — leave as-is (already matches).

## Out of scope
- No edits to `<head>`, `<meta>`, `<script>`, JSON-LD, `<style>`, `<noscript>`, the footer, pricing cards, hero subcopy, or any other section.
- No CSS additions or token changes.
- No other files touched.

## Verification
- Diff `index.html` to confirm only the `<nav class="mw-nav">` block and the `<h1 class="mw-h1">` text changed.
- Visually compare first-paint fallback header + hero headline against `/` route in the React app.
