## Goal

Replace the current `measurewise-logo.png` with a custom-designed mark that feels cohesive with the site: clean, clinical, enterprise-grade, built around the teal primary (HSL 192 70% 35% / `#1B7A99`) with the accent green (HSL 165 60% 40%) as a secondary.

## Direction

A custom **wordmark + symbol** pair, not a stock checkmark-in-a-circle:

- **Symbol:** an abstract "M + upward measurement tick" mark — a stylized M whose right stroke rises into a subtle data-point/checkmark, suggesting measurement, improvement, and quality. Geometric, single-weight strokes, rounded line caps. Two-tone teal → accent-green gradient on the rising stroke only; the rest of the mark in solid primary teal.
- **Wordmark:** "MeasureWise" set in a modern geometric sans (Inter / Geist-style, the same family the app already uses), medium weight, tight tracking, true-black `foreground` color, with a small superscript ™.
- **Lockup:** symbol left, wordmark right, optically aligned to the cap height. Also generate a symbol-only variant for favicons / small contexts.
- **Backgrounds:** transparent PNG so it sits cleanly on both the white header and the teal CTA/footer regions. No white card behind it.

## Deliverables

1. `src/assets/measurewise-logo.png` — full horizontal lockup, transparent, ~1200×320, used by `PublicPageLayout` header + footer and anywhere else the existing import is referenced.
2. `src/assets/measurewise-mark.png` — symbol-only square version for favicon / compact use.
3. `public/favicon.ico` / `public/site.webmanifest` icons — regenerated from the new mark so the browser tab matches.
4. Quick QA: load `/`, `/about`, `/pricing` in preview at 988px viewport; confirm header logo renders crisp, no white box artifact, footer version reads on the muted card background.

## Out of scope

- No changes to nav structure, layout, color tokens, or typography.
- No rename — still "MeasureWise™".
- No changes to email-template logos in this pass (can follow up if you want them swapped too).

## Technical notes

- Generated via `imagegen` at premium quality with `transparent_background: true` (PNG required for transparency). One generation for the lockup, one for the symbol-only mark, then a favicon export.
- The existing import path `@/assets/measurewise-logo.png` stays the same, so no component edits are needed beyond the asset swap. Header `<img className="h-14">` and footer `h-10` sizing already work for a wide lockup.
