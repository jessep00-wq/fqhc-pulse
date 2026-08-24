# Re-add PostHog Analytics Tracking

Restore PostHog analytics so the SPA captures pageviews and events again. No session recording; keep the existing Google Ads gtag in `index.html` untouched.

## What to do

1. Add dependency
   - Run `bun add posthog-js` (or `pnpm add posthog-js` / package manager in use).

2. Add public environment variables
   - `.env`:
     ```
     VITE_PUBLIC_POSTHOG_KEY="phc_yykGVwtQWE69AH6RCGH34Se9UFPR4PK9SkdBA9efP2c6"
     VITE_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
     ```
   - `.env.production` (where `VITE_PAYMENTS_CLIENT_TOKEN` already lives):
     ```
     VITE_PUBLIC_POSTHOG_KEY="phc_yykGVwtQWE69AH6RCGH34Se9UFPR4PK9SkdBA9efP2c6"
     VITE_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
     ```

3. Create `src/lib/posthog.ts`
   - Initialize `posthog-js` with `import.meta.env.VITE_PUBLIC_POSTHOG_KEY` and `import.meta.env.VITE_PUBLIC_POSTHOG_HOST`.
   - Set `capture_pageview: false` in `posthog.init()` options because the app is a client-side routed SPA.
   - Export the init function so it can be called once before React renders.

4. Initialize once and early in `src/main.tsx`
   - Import the init function from `src/lib/posthog.ts`.
   - Call it before `createRoot(...).render(...)` so tracking is ready before route changes occur.

5. Create `src/components/PostHogPageView.tsx`
   - Mirror `src/components/ScrollToTop.tsx` structure: use `useLocation` from `react-router-dom`, run a `useEffect` on `pathname` change.
   - Call `posthog.capture('$pageview')` whenever `pathname` changes.
   - Mount it in `src/App.tsx` alongside `<ScrollToTop />` inside `BrowserRouter` so it receives route context.

6. Keep the scope minimal
   - No session recording, no autocapture-only beyond the pageview capture, no changes to the existing Google Ads gtag snippet in `index.html`.

## Verification

- `package.json` contains `posthog-js` in dependencies.
- `.env` and `.env.production` contain the two new `VITE_PUBLIC_POSTHOG_*` entries.
- `src/lib/posthog.ts` exists and initializes with `capture_pageview: false`.
- `src/main.tsx` calls the init function before render.
- `src/components/PostHogPageView.tsx` exists and is mounted inside `App.tsx` alongside `<ScrollToTop />`.
- `index.html` gtag snippet is unchanged.
- Build/typecheck passes.
