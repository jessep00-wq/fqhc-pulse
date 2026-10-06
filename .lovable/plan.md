# Page speed, loading stability and error-handling pass

## Goal
Make the public pages and the dashboard load faster and stop jumping around while loading. Handle slow connections and broken links cleanly. Finish with a measured before/after summary.

## Step 1 — Measure first (baseline)
- Script a browser check of every main route: `/`, `/how-it-works`, `/pricing`, `/about`, `/contact`, `/features/*`, `/store`, `/resources`, `/readiness`, `/demo`, `/auth`, legal pages, the dashboard routes (signed in), and the admin routes.
- For each route, record: HTTP status, final URL after redirects, LCP, CLS, long tasks (as an INP stand-in), JS transferred, and console errors.
- Re-run each route with 3G throttling. Capture screenshots at 1s, 3s and finished.
- Check every redirect route, such as `/for/*`. Check that an unknown URL shows the Not Found page with a real 404.

## Step 2 — Fix what the baseline confirms
These are suspected, based on the current build output. Each one gets fixed only if the measurements confirm it.
- **Analytics bundle (~290 KB) loaded up front.** Load the analytics library after the page becomes interactive, instead of shipping it with the first page.
- **Large shared bundle (~510 KB).** Find which libraries land in it and move heavy ones out of the shared code. Charts, PDF export (jspdf, html2canvas) and the PDSA board should load only on the pages that use them.
- **PDF and chart libraries.** Load them only when the user clicks export, or when a chart scrolls into view.
- **Images.** Give every image fixed width and height, lazy-load images below the fold, and keep high priority only on the main above-the-fold image.
- **Fonts.** Check font loading for swap behavior and layout jumps. Preload only the font weights actually used above the fold.
- **Loading states.** Replace blank screens and spinner-only areas with size-matched skeletons for dashboard cards, the PDSA board, charts, the store grid and the resource list. That way content does not push the layout down when it arrives.
- **Data on page load.** Find duplicate or chained database requests on the dashboard. Run independent requests in parallel and fetch only the columns needed. Turn off refetch-on-focus where it causes visible reloads.
- **Re-renders.** Find components that re-render on every keystroke or timer tick on the dashboard and PDSA pages, and memoize where it measurably helps.
- **Caching.** Confirm hashed assets get long-lived cache headers and HTML stays fresh. Add cache headers to public server routes that return static data.
- **Error fallbacks.** Make sure every route that loads data has a friendly error screen and a not-found screen, with a retry button where data fails to load.

## Step 3 — Verify
- Re-run the Step 1 script and compare before and after, on normal speed and on 3G.
- Run the typecheck, the existing tests and a production build.
- Report a summary table per route: LCP, CLS and JS size before and after, plus any routes still over target.

## Out of scope
- No visual redesign, copy changes, or changes to pricing or the product.
- Hosting already compresses responses, so no app-level compression gets added.

## Technical notes
- Use dynamic `import()` for jspdf, html2canvas, recharts-heavy pages and posthog (posthog init deferred via `requestIdleCallback`).
- Check that the Vite manual chunks and route-level code splitting keep each route's own chunk small.
- Every image gets `width`/`height` or `aspect-ratio`. Below-the-fold images get `loading="lazy"` and `decoding="async"`.
- Skeletons reuse the existing shadcn `Skeleton` component, so the design stays consistent.
- Metrics come from Playwright using PerformanceObserver (LCP, layout-shift), with CDP network throttling for the 3G runs.
