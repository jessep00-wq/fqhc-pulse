# Resource Library for MeasureWise

Add a scalable, SEO-focused Resource Library at `/resources` plus 10 individual article routes, reusing the existing brand, layout, and SEO components. No redesign, no page removals, no invented regulatory claims.

## What gets built

**1. Content registry (one file, the source of truth)**
A typed registry holding each resource's slug, title, SEO title, meta description, category, published/updated dates, author (Jessica R. Smith, BSN), reading time, related-resource slugs, a product/feature link, sources list, and the article body as structured sections (H2/H3 + paragraphs). Adding a future article = adding one entry. The sitemap and the hub both read from this registry, so nothing drifts.

**2. Resource hub — `/resources`**
- Hero: "FQHC Quality & Compliance Resource Library" with the supplied subheading.
- Featured Resources row near the top.
- Category sections / filter chips: HRSA & Operational Site Visits, UDS Reporting, Clinical Quality Measures, PDSA & Quality Improvement, Templates & Tools.
- Cards show title, short description, category, updated date, reading time, and a normal `<a>`-backed link.
- Professional and readable — same cards, type scale, and teal accents already used on Features.

**3. Article template — `/resources/:slug`**
Single reusable page component rendering: breadcrumb (Home › Resources › Category › Article), one H1, meta block (category, published, updated, author, reading time), table of contents for longer pieces, semantic H2/H3 sections, inline internal links to related resources, a Related Resources block, one contextual CTA to the relevant product/feature page, optional download CTA (only where a real asset already exists in the store/manual), and a Sources & references section.

**4. Content honesty**
Only non-regulatory framing copy is written by me (what the article will cover, why it matters operationally). Every place that would require citing a HRSA/UDS/CMS requirement gets a clearly marked "Content in review — awaiting verified source" block instead of invented text. Sources sections list the official source that must be cited, not fabricated citations. Pages that are still mostly placeholder ship with `noindex` on that route so thin pages never get indexed; removing the flag on an entry is the single switch that publishes it.

**5. SEO plumbing (reusing what exists)**
- Per-page `<SEO>` component already in the project handles title, description, canonical, OG, Twitter, and JSON-LD — reused, not duplicated.
- Article + BreadcrumbList JSON-LD per resource page; CollectionPage on the hub.
- `public/sitemap.xml` gains `/resources` and every non-noindex resource URL; all existing entries preserved verbatim.
- `robots.txt` needs no change (it doesn't block `/resources`) — will be re-verified.

**6. Navigation**
Add "Resources" to the public header nav (between Features and Pricing), the mobile sheet, and a footer link under Product. The static `index.html` shell for `/` gets a matching Resources link so the no-JS fallback stays consistent. Nothing else in the nav changes.

## Technical notes

- Routes are lazy-loaded in `src/App.tsx` alongside existing public routes; article content is rendered from the registry at module scope (not fetched), so the DOM is complete on first render.
- Honest caveat: this app is a client-rendered Vite SPA. Google executes JS and will crawl and index these pages fine, but non-JS social crawlers (LinkedIn, Slack, Facebook) only see the static `index.html` head, so per-article social previews won't be accurate. If accurate per-page previews matter, the app can get SSR by upgrading to Lovable's latest template — type "/" in chat and choose "Migrate to TanStack Start", or ask me to do it ([what the upgrade gives you](https://lovable.dev/blog/building-apps-using-tanstack-start)).

## Files

- New: `src/lib/resources/registry.ts`, `src/lib/resources/types.ts`, `src/pages/resources/ResourcesIndex.tsx`, `src/pages/resources/ResourceArticle.tsx`, plus small components for cards, breadcrumb, and TOC.
- Edited: `src/App.tsx` (2 routes), `src/components/PublicPageLayout.tsx` (nav + footer link), `public/sitemap.xml`, `index.html` (static shell nav link only).

## What I need from you

Verified article copy (or approved sources) for each of the 10 topics. Until that lands, each page ships with the structure, headings, internal links, and metadata in place but a visible "content in review" marker and `noindex`, so nothing thin or unverified reaches the index.
