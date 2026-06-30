Plan to fix the Evidence Binder print rendering:

1. Tighten the print page model
   - Keep Letter export with fixed printable dimensions.
   - Replace the current `html, body { width: 7.5in; }` approach with a safer print container model that avoids accidental overflow from section padding/backgrounds.
   - Add explicit print-only `overflow-x: hidden`, `max-width: 100%`, and `box-sizing: border-box` safeguards across the binder shell.

2. Rebuild the print cover layout
   - Make the cover an exact single printable page height instead of `min-height`, so it cannot spill onto page 2.
   - Reduce cover typography, vertical spacing, and card padding specifically for print.
   - Convert the completeness panel into a compact print layout with the ring and checklist side-by-side/condensed.
   - Allow long organization names and completeness items to wrap cleanly without forcing page overflow.

3. Improve table behavior for PDF
   - Keep fixed table layout but make column widths responsive to actual column count.
   - Add stronger wrapping for titles, dates, tags, status pills, and headers.
   - Prevent tables from creating horizontal scroll areas in print.
   - Let long table content split between pages only at safe row boundaries.

4. Improve page-break behavior
   - Avoid breaking immediately after section headers, alerts, pending evidence callouts, and sign-off rows.
   - Allow long sections to flow naturally across pages instead of forcing oversized cards to stay together.
   - Remove any print rules that cause blank or mostly-empty continuation pages.

5. Add a verification pass
   - Generate/render the binder through the existing print HTML path.
   - Check the exported/attached PDF-style output for: cover fits on one page, no content on an unintended cover continuation page, no right-side clipping, tables wrap within margins, and no orphan footer/blank page.