# Static HTML Marketing Homepage

Replace `index.html` with a complete, no-framework marketing homepage. The React SPA continues to power every other route via a second HTML entry.

## What gets built

### 1. New static `index.html` (root, served at `/`)
A single self-contained file:
- Full `<head>`: charset, viewport, title, description, canonical (`https://measurewise.org/`), og:*, twitter:*, favicon, manifest, theme-color, Google site verification, Google Ads gtag (`AW-18116909916`), preload for hero image, both existing JSON-LD blocks (`SoftwareApplication` + `Organization`).
- All styling in one `<style>` tag (semantic, mobile-first, teal `#1a7a7a` / `#0f4f4f` palette to match the current Tailwind theme).
- No `<script src="/src/main.tsx">`. No `<div id="root">`.
- A tiny inline `<script>` only for: (a) playbook lead-magnet email capture POSTing to the existing `capture-playbook-lead` edge function, and (b) the newsletter signup POSTing to the existing newsletter subscribe function. Both use the public Supabase URL + anon key (already public values).

### 2. Page content (mirrors current `src/pages/Landing.tsx`)
- Top nav (logo + links: How it works, Features, Pricing, Blog, Case studies, Resources, Sign in, **Start Free** CTA). Pure `<a href="/pricing">`, `/blog`, `/auth?signup=true`, etc. — these load the React app via the SPA fallback.
- Hero (eyebrow chips, H1, sub, dual CTAs, dashboard screenshot from `/dashboard-preview.webp`).
- "Built for FQHC Quality Directors" trust strip.
- 6-card feature grid (PDSA, UDS, SPC, HRSA binder, PCMH evidence, Financial impact).
- "How it works" 4-step section.
- Founder callout (Jessica R. Smith, BSN).
- Pricing teaser (3 tiers: Solo $149 / Multi-Site $349 / Network $699, all with "14-day free trial").
- Lead-magnet email capture (Playbook Library PDF).
- FAQ accordion implemented with `<details>`/`<summary>` (no JS).
- Dark teal CTA band.
- Footer (legal links, social, copyright).

All copy lifted verbatim from the existing `Landing.tsx` / `PublicPageLayout.tsx` so SEO content is preserved.

### 3. SPA shell moves to `app.html`
- Create `app.html` containing only the React mount: `<div id="root"></div>` + `<script type="module" src="/src/main.tsx">`.
- Remove the `/` route from `src/App.tsx` so React never tries to render Landing again (or replace it with `<Navigate to="/dashboard" />` for safety if React loads at `/` somehow).
- Optionally delete `src/pages/Landing.tsx` and its import — it's no longer reachable.

### 4. Routing plumbing
- Update `vite.config.ts`:
  - Multi-page input: `build.rollupOptions.input = { index: 'index.html', app: 'app.html' }`.
  - Dev middleware that rewrites any non-root, non-asset request to `/app.html` so React Router works during `vite dev`.
- Add `public/_redirects` (Netlify/Lovable-hosted SPA fallback):
  ```text
  /            /index.html   200
  /assets/*    /assets/:splat 200
  /*           /app.html      200
  ```
- Keep `public/robots.txt` and `public/sitemap.xml` unchanged.

### 5. Forms (tiny inline script)
One ~40-line vanilla JS block at the bottom of `index.html`:
- Captures playbook-form submit → `fetch(SUPABASE_URL + '/functions/v1/capture-playbook-lead', { headers: { apikey, Authorization: 'Bearer ' + anon } })`.
- Captures newsletter subscribe → existing newsletter endpoint.
- Inline success/error message, no toast library.
- Hardcoded `SUPABASE_URL` and anon key (public values, same as `.env`).

Everything else (login, signup, pricing checkout) is a plain `<a>` to the React app — zero JS needed.

## Technical details

- **No Tailwind** in `index.html` — pure CSS. ~6 KB of styles.
- **No React imports** anywhere in `index.html` or its inline script.
- **SEO meta** moves wholesale from current `index.html` into the new static homepage. `app.html` gets a minimal head (title + viewport + Helmet hydration handles per-route SEO for everything else).
- **Google Ads gtag** stays in `index.html`. Also add it to `app.html` so dashboard/marketing route tracking continues.
- **No-JS support**: page is fully readable without JavaScript; only the two optional forms degrade gracefully (server-rendered fallback message via `<noscript>`).
- **Memory updates**: revise `mem://features/public-landing-page` and `mem://features/static-fallback` to record that `/` is now genuinely static HTML, and React loads from `app.html`.

## Files touched

| File | Change |
|---|---|
| `index.html` | Rewritten as full static marketing homepage |
| `app.html` | **New** — SPA shell |
| `vite.config.ts` | Multi-page input + dev rewrite |
| `public/_redirects` | **New** — host routing rules |
| `src/App.tsx` | Remove `/` route; drop Landing import |
| `src/pages/Landing.tsx` | Delete (optional) |
| `mem://features/public-landing-page` | Note static homepage |
| `mem://features/static-fallback` | Note new role |

## Out of scope

- Pricing, About, Contact, Blog, Features, Personas, Waitlist, Case Studies, Store — all remain React pages.
- Dashboard, Admin, Auth — unchanged.
- No design changes; static HTML visually matches the current Landing page.

## Risks to flag

- **Vite dev rewrite**: needs a small custom middleware in `vite.config.ts`; first load on `/dashboard` during dev must serve `app.html`, not `index.html`. This is the trickiest part.
- **Hosting**: the `_redirects` file is the Lovable/Netlify convention. If Lovable's hosting uses something different (e.g., `vercel.json`), it'll need the equivalent. I'll verify against the published URL once built.
- **Duplication**: nav and footer in `index.html` will drift from `PublicPageLayout.tsx` unless both are updated together. Acceptable trade for the SEO win, but worth noting.