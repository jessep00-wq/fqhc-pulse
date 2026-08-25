# Server-render the public site (TanStack Start upgrade)

Next.js isn't available on this platform, so the SSR path here is Lovable's TanStack Start template. It gives the same outcomes you asked for: real HTML in view-source for public pages, server-generated metadata, static pre-rendering where content rarely changes, and lower JavaScript on marketing routes — while the signed-in app keeps working as a client app.

## What changes

The whole project moves from Vite + React Router to TanStack Start (still React, still Tailwind, still shadcn, same components and copy). Routes become files under `src/routes/`. Public routes render on the server; authenticated routes stay client-rendered behind their existing guards.

### Public routes — server rendered
`/`, `/features`, `/pricing`, `/about`, `/contact`, `/security`, `/demo`, `/resources`, `/resources/:slug`, `/status`, `/terms`, `/privacy`, `/refund-policy`, `/manual`, `/manual/thank-you`, `/readiness`, `/store` and store detail pages, plus all existing `/for/*`, `/how-it-works`, and `/features/*` redirects (preserved exactly).

`/faq` is new: a public FAQ page built from existing site copy, server rendered, with FAQ structured data.

Resource articles keep their current registry as the content source, so each `/resources/:slug` gets its own server-generated title, description, canonical, OG/Twitter tags, and Article + Breadcrumb JSON-LD.

### Authenticated routes — unchanged behaviour
`/auth`, `/reset-password`, `/onboarding`, `/invite/:token`, everything under `/dashboard`, and everything under `/admin` stay client-side, behind the same auth and founder-admin guards. PDSA Lab, QI reports, charts, PDF exports, and forms are untouched in behaviour.

### SEO output
- Metadata generated on the server per route (title, description, canonical, OG, Twitter card).
- Structured data: Organization sitewide, Article + Breadcrumb on resources, FAQPage on `/faq`, Product on store pages.
- `sitemap.xml` and `robots.txt` generated from the route list and resource registry instead of hand-maintained.
- Authenticated and thank-you routes excluded from indexing.

### Performance
- Public pages ship server HTML with minimal client JS; interactive bits (cart drawer, mobile menu, contact form, exit-intent dialog) become the only hydrated islands.
- Hero and above-the-fold images keep explicit dimensions and high fetch priority; below-the-fold media lazy loads.
- Heavy browser-only libraries (PDF generation, canvas capture) load on demand so they never run during server render.

## Breaking changes and risks — read before approving

1. **Framework swap, not a patch.** Build config, entry points, and every route file are rewritten. It is reversible by reverting this turn from chat history.
2. **Tailwind v3 → v4.** Custom tokens in `src/index.css` are carried into the new `src/styles.css`, and v4 class renames (`shadow-sm`, `rounded`, `ring`, `outline-none`) get swept. Visual regressions are the main risk area and get a visual check afterwards.
3. **TypeScript strict mode turns on.** Expect a wave of type errors to fix during the migration; the build must be green before it's done.
4. **Existing test setup (`vitest.config.ts`, `src/test/`) is removed** by the migration and needs re-wiring afterwards as a follow-up.
5. **Backend is untouched.** Database, RLS, auth, Stripe, Resend, and edge functions stay exactly as they are.
6. **URLs are all preserved**, including redirect routes.
7. **The preview keeps showing the current app** during the migration; the upgraded version appears when it completes.

## Technical notes

- Migration runs via the `migrate-to-tanstack` skill: preflight build check, project scan, scaffolding swap, dependency merge, route generation with a verified auth-wrapper inventory, then build + typecheck + route-serve gates.
- `src/lib/resources/registry.ts` becomes the loader source for resource routes; loaders return serializable data only, with any icon/component lookup done in the component.
- Public route components default to server components; `AuthProvider`, `QueryClientProvider`, and tooltip/toast providers move into the root route around the outlet.
- Google Ads gtag, PostHog init, and existing head tags in `index.html` are ported into the root route head so tracking keeps firing.

## Deliverable

When it finishes I'll report every file changed, which routes are static vs. server-rendered, what stayed client-side, and anything that needs a follow-up pass.
