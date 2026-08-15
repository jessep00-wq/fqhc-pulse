# Replace the homepage hero screenshot

Swap the stale hero image (it still advertises PCMH Q-PASS and a Financial Impact tile that no longer exist) for the newly uploaded dashboard capture.

## What changes

- Crop the uploaded screenshot above the floating annotation toolbar so only the real dashboard UI shows: greeting header, the three KPI tiles (Active PDSAs, Measures at Risk, Tasks Due This Week), and the top of the UDS Clinical Analytics / SPC chart card.
- Generate optimized `.jpg` and `.webp` versions at the same aspect handling as today, replacing `src/assets/dashboard-preview.jpg` and `src/assets/dashboard-preview.webp`.
- Update the hero `<img>` in `src/pages/Landing.tsx`: correct `width`/`height` to the new intrinsic size (keeps the LCP hint and avoids layout shift), and update the `alt` text to describe what the new image actually shows (PDSA cycles, measures at risk, SPC chart) with no references to removed features.
- Check for any `<link rel="preload">` of the hero in `index.html` and keep it pointing at the new file.

## Technical notes

- Crop bottom to roughly y=790 of the 1503x848 source, above the toolbar overlay; export webp at quality ~82 and jpg ~85 for a small LCP payload.
- Same filenames are reused so no other references need touching; `fetchpriority="high"` and `decoding="async"` stay as-is.

## Verification

- Load `/` at 1280px and 390px in a headless browser, screenshot the hero, and confirm the new image renders, is not letterboxed, and shows no toolbar overlay.
