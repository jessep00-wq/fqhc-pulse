# Fix Evidence Binder print/PDF layout

Restyle the generated binder so it prints/exports as a clean Letter-size PDF with no overflow, no clipped tables, no orphan cover-page spillover, and consistent margins on every page. All changes are CSS-only inside the binder template — no data, section order, or branding changes.

## Scope

Edit only `src/lib/binder/styles.ts` (`BINDER_CSS`). The renderer in `src/lib/binder/renderer.ts` already emits the right markup; the issues are in the stylesheet's `@media print` block and a few flex/grid rules that don't collapse for print width.

## Changes to `BINDER_CSS`

### 1. Page setup
- `@page { size: Letter; margin: 0.5in; }` stays, but add a print container width lock: `html, body { width: 7.5in; }` inside `@media print` so every section card is bounded by the printable area (8.5in − 2×0.5in).
- Remove body background, shadows, and any sticky/fixed positioning in print.
- `* { overflow: visible !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }` so teal fills/badges render and nothing is clipped by stray `overflow: hidden`.

### 2. Cover page — fits on one page, no spillover
- In print, change `.cover-grid` from `grid-template-columns: 1fr auto` to `grid-template-columns: 1fr` and stack the completeness panel below the meta grid (per the user's instruction).
- Reduce cover padding for print: `.cover { padding: 0.6in 0.4in; min-height: 9.5in; break-after: page; }` so cover always occupies exactly one page.
- Scale cover typography down in print: `--text-3xl` → ~28pt, `--text-2xl` → ~20pt; shrink completeness ring to 64px; cap `.cover-completeness { max-width: 100%; }`.
- Force `.cover-meta-grid { grid-template-columns: repeat(2, 1fr); max-width: 100%; }` in print so meta tiles never push off the right edge.

### 3. TOC
- `.toc-grid { grid-template-columns: repeat(2, 1fr); }` in print (was `auto-fill minmax(260px,1fr)` which can overflow narrow print width).
- `.toc-section { break-after: page; }` stays; add `padding: 0.4in 0;` for print.

### 4. Section cards & page breaks
- `.section-card { break-inside: avoid-page; page-break-inside: avoid; max-width: 100%; box-shadow: none; }` in print.
- `.section-header { break-after: avoid; page-break-after: avoid; }` so headings never get orphaned from their body.
- `.main-content { padding: 0; gap: 0.25in; max-width: 100%; }` in print.
- Long sections (PDSA list, evidence tables) get `break-inside: auto` on their inner table so they may flow across pages while the card header repeats logically — accept natural splits over awkward white space.

### 5. Tables — no horizontal overflow
- Print rules:
  - `.table-wrap { overflow: visible; }`
  - `.evidence-table { table-layout: fixed; width: 100%; font-size: 9pt; }`
  - `.evidence-table th, .evidence-table td { word-wrap: break-word; overflow-wrap: anywhere; white-space: normal; padding: 6px 8px; vertical-align: top; }`
  - Per-column widths via `:nth-child` for the standard evidence table (Title 32%, Type 16%, Effective 14%, Review/Expires 14%, Owner 14%, Status 10%); same approach for `.uds-tracker` and `.gaps-table`.
  - `.evidence-table th { white-space: normal; }` (removes the current `nowrap` that forces tables wider than the page).
- Tags inside cells: `.tag { white-space: normal; word-break: break-word; }`.

### 6. Other grids that overflow in print
- `.prep-grid`, `.signoff-grid` → `grid-template-columns: repeat(2, 1fr);` in print, with `gap: 0.15in`.
- `.completeness-items`, `.checklist`, `.pending-callout ul` → ensure `padding-left: 0; max-width: 100%;`.

### 7. Footer
- Remove `break-before: page` on `.site-footer` so it does not generate a near-empty trailing page when content already ends near a page boundary; instead use `break-inside: avoid` and let it sit at the end of the last content page.
- Tighten footer padding in print: `padding: 0.25in 0;`.

### 8. Screen behavior (non-print)
- Keep the on-screen rendered HTML mostly as-is, but also widen iframe-friendly max-widths: `.cover-grid`, `.toc-inner`, `.main-content`, `.footer-inner` get a print-only `max-width: 100%` override so the print path is fully fluid even though the screen path keeps `--content-wide`.

## Verification

After the edit, run the existing Playwright export check used previously:
1. Render the binder HTML via `renderBinderHtml(...)` with the demo input.
2. Use Chromium `page.pdf({ format: 'Letter', printBackground: true, margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' } })` to produce a PDF.
3. Convert pages to images with `pdftoppm` and visually confirm:
   - Cover page is one page, completeness panel stacked under meta, nothing clipped.
   - TOC fits on one page.
   - Every evidence table fits within the printable width, no clipped right column.
   - No trailing page with a single line.
   - Section headers stay attached to their body.

## Out of scope

- Renderer / data-binding logic.
- The on-screen `/dashboard/evidence-binder` page styling.
- Any change to section count, order, branding, or fonts.
