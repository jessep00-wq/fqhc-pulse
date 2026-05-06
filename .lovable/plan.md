
## Add keyword-targeted feature pages and blog for SEO

The app is a client-side SPA — Google must execute JS to see content. While Googlebot can render JS, it's slower and less reliable than static HTML. We'll address this with two approaches: (1) keyword-rich content pages, and (2) a Vite prerender plugin that generates static HTML at build time so crawlers get fully rendered pages.

---

### 1. Install `vite-plugin-prerender` for static HTML generation

Add a Vite plugin that renders key public pages to static HTML at build time. This gives Google real HTML to crawl instead of an empty `<div id="root">`.

Pages to prerender:
- `/` (homepage)
- `/pricing`
- `/for/qi-directors`, `/for/pcmh-coordinators`, `/for/operations-managers`
- All new feature and blog pages below

---

### 2. Add `react-helmet-async` for per-page meta tags

Each page will set its own `<title>`, `<meta description>`, canonical URL, and JSON-LD structured data. This is critical for keyword targeting.

---

### 3. Create feature pages targeting high-intent FQHC keywords

| Route | Target keyword | H1 |
|-------|---------------|-----|
| `/features/pdsa-cycle-manager` | "PDSA cycle manager health center" | "PDSA Cycle Management Built for FQHCs" |
| `/features/uds-tracking` | "UDS tracking software FQHC" | "UDS Measure Tracking for Federally Qualified Health Centers" |
| `/features/hrsa-audit-binder` | "HRSA site visit preparation software" | "Generate Your HRSA Audit Binder in One Click" |
| `/features/spc-charts` | "SPC charts healthcare quality" | "Statistical Process Control Charts for FQHC Quality Teams" |
| `/features/pcmh-evidence` | "PCMH recertification evidence" | "PCMH Q-PASS Evidence Collection, Automated" |

Each page: ~800 words of keyword-rich copy, feature screenshots, JSON-LD SoftwareApplication schema, CTA to signup.

---

### 4. Create a blog section for long-tail keywords

| Route | Target keyword |
|-------|---------------|
| `/blog` | Blog index |
| `/blog/pdsa-cycle-fqhc-guide` | "how to run PDSA cycle FQHC" |
| `/blog/uds-clinical-quality-measures-2026` | "UDS clinical quality measures 2026" |
| `/blog/hrsa-site-visit-checklist` | "HRSA site visit checklist" |
| `/blog/quality-improvement-fqhc-staff` | "quality improvement FQHC" |

Each post: ~1,200 words, educational content, internal links to feature pages, JSON-LD Article schema, author attribution.

---

### 5. Update sitemap and navigation

- Add all new routes to `sitemap.xml` and `sitemap.txt`
- Add a "Features" dropdown and "Blog" link to the landing page nav
- Add internal links between feature pages and blog posts for link equity

---

### Files changed

| File | Change |
|------|--------|
| `package.json` | Add `react-helmet-async`, prerender plugin |
| `vite.config.ts` | Configure prerender for public routes |
| `src/main.tsx` | Wrap app in `HelmetProvider` |
| `src/components/SEO.tsx` | Reusable SEO component (title, desc, JSON-LD) |
| `src/pages/features/*.tsx` | 5 new feature pages |
| `src/pages/blog/*.tsx` | 4 blog posts + index |
| `src/App.tsx` | Add routes for features and blog |
| `src/pages/Landing.tsx` | Add Features dropdown + Blog link to nav |
| `public/sitemap.xml`, `public/sitemap.txt` | Add new URLs |

---

### Technical notes

- Prerendering runs at build time via headless Chromium — no runtime SSR needed
- JSON-LD schema (`SoftwareApplication` for features, `Article` for blog) helps rich snippets
- All pages share the existing header/footer pattern from persona pages
- Blog content is hardcoded (no CMS) — simple, fast, no backend dependency
