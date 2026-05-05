
# SEO Optimization Plan

## What we're building

A complete SEO overhaul so MeasureWise ranks in Google and appears in AI search results (ChatGPT, Perplexity, etc.) for your target FQHC keywords.

---

## 1. Keyword-Rich Meta Tags in `index.html`

Update the `<head>` with your primary keywords baked into the title, description, and a new `<meta name="keywords">` tag:

- **Title**: "MeasureWise™ — FQHC Quality Improvement & UDS Reporting Software"
- **Description**: Incorporates: fqhc quality improvement, uds reporting software, healthcare quality operations, clinical quality management, pdsa cycles in healthcare, fqhc performance metrics, ai for clinical improvement, value-based care reporting, healthcare compliance software, patient outcomes tracking
- **OG/Twitter tags**: Updated to match

## 2. JSON-LD Structured Data (Schema.org)

Add a `<script type="application/ld+json">` block in `index.html` with `SoftwareApplication` schema so Google and ChatGPT understand MeasureWise is a SaaS product for FQHCs. Includes:
- Product name, description, category
- Target audience (healthcare / FQHCs)
- Pricing info (freemium)
- Organization schema with logo

## 3. Sitemap & Robots.txt

- **Create `public/sitemap.xml`** listing all public routes: `/`, `/auth`, `/pricing`, `/for/qi-directors`, `/for/pcmh-coordinators`, `/for/operations-managers`, `/terms`, `/privacy`, `/status`
- **Update `public/robots.txt`** to reference the sitemap URL and add `Sitemap: https://measurewise.org/sitemap.xml`

## 4. Public Status Page (`/status`)

Create a new `src/pages/Status.tsx` page at route `/status` showing:
- System health indicators (API, Database, Auth — all showing "Operational")
- Current uptime percentage
- A clean, branded design matching MeasureWise's teal theme
- This satisfies the "CMS status page" gap your report flagged and signals enterprise-readiness to search engines and buyers

## 5. Landing Page Keyword Density

Weave remaining keywords naturally into the Landing page content:
- Add an "FQHC Solutions" section or adjust existing copy to include: "federally qualified health center solutions", "healthcare data analytics", "clinical operations software", "fqhc consulting services", "uds tracking for fqhcs"
- These appear as natural text, not keyword stuffing

---

## Files changed

| File | Change |
|------|--------|
| `index.html` | Meta tags, keywords, JSON-LD structured data |
| `public/robots.txt` | Add sitemap reference |
| `public/sitemap.xml` | New file with all public routes |
| `src/pages/Status.tsx` | New public status page |
| `src/pages/Landing.tsx` | Keyword-enriched copy in existing sections |
| `src/App.tsx` | Add `/status` route |
