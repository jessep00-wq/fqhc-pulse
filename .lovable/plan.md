## Scope

Address four UX/site-quality findings from the audit. Frontend-only except for: (a) one new edge-function passthrough field set for the contact form, and (b) a small client-side index for search. No DB schema changes required (contact form already emails out via the `contact-form` edge function — no DB write — so we just expand the payload).

---

## 1. Case Studies link → "redirected to signup"

**Diagnosis.** Cards in `src/pages/CaseStudies.tsx` link to static files at `/case-studies/{slug}.html` (files exist in `public/case-studies/`). On the published Lovable host these load, but in some flows (SPA history navigation, missing trailing handling, or a stale CDN cache) the path falls through to the React router → `NotFound` and the default redirect lands on `/auth`. Result: a real visitor sees signup, not the case study.

**Fix.**
- Convert the three case studies to first-class React routes:
  - Add `src/pages/case-studies/CaseStudyValleyCommunityHealth.tsx`, `CaseStudyNorthsideFamilyHealth.tsx`, `CaseStudySunriseHealthPartners.tsx`. Port the HTML content from `public/case-studies/*.html` into JSX, wrapped in `PublicPageLayout` + `SEO` (unique title, meta, canonical, `Article` JSON-LD).
  - Register routes in `src/App.tsx`: `/case-studies/:slug` mapping to a small dispatcher, or three explicit routes.
  - Update `src/pages/CaseStudies.tsx` cards to use `<Link to="/case-studies/${slug}">` instead of `href="...html"`.
  - Remove the now-orphaned `public/case-studies/*.html` (or keep them but add 301-style `<meta http-equiv="refresh">` to the React route for any old indexed link).
  - Add the three new URLs to `public/sitemap.xml`.
- Audit `src/pages/NotFound.tsx` to confirm it does NOT push unauthenticated users to `/auth`; if it does, change it to render a real 404 with a "Back to home" CTA.

**Why a real route, not the .html file.** Internal `<Link>` keeps users in the SPA, gives us SEO control via the existing `<SEO>` component, and removes the failure mode that caused the signup redirect.

---

## 2. Sample export friction (PDF/Word)

**Diagnosis.** `src/pages/Landing.tsx` ~lines 824–849 links directly to `/MeasureWise_Sample_Export.pdf` and `.docx`. Both files exist in `public/`. Two real friction sources:
- The PDF is opened in a new tab via `target="_blank"` — on slow connections the tab appears blank for several seconds with no feedback, looking like a timeout.
- The `.docx` link uses `download` but provides no fallback if the click is blocked (Safari, popup blockers).

**Fix.**
- Replace the two anchor buttons with a small `SampleExportButtons` component that:
  - Shows a `Loader2` + "Preparing preview…" state for ~400ms before opening the PDF, so the user gets feedback.
  - Uses `window.open(url, "_blank", "noopener")` with a fallback `<a>` if blocked.
  - Tracks `sample_pdf_opened` / `sample_docx_downloaded` via the existing `trackEvent` helper.
- Add an inline PDF preview option: a `Dialog` with an `<iframe src="/MeasureWise_Sample_Export.pdf#view=FitH">` so users can scan it without leaving the page, plus a "Download PDF" button inside.
- Add `<link rel="prefetch" href="/MeasureWise_Sample_Export.pdf">` in `index.html` so the file is warm by the time the user clicks.
- Verify both files exist at build time with a tiny check in `vite.config.ts` (or just a doc note); flag the `.docx` as missing if absent.

---

## 3. Contact form too generic for FQHCs

**Diagnosis.** `src/components/ContactForm.tsx` collects only name/email/message. The `contact-form` edge function emails the body — no DB insert — so we can extend the payload freely without a migration.

**Fix.** Expand the form with FQHC-specific qualifying fields, all validated with `zod`:

- `organizationName` (text, required, ≤120)
- `role` (select: Quality Director, PCMH Coordinator, COO/Ops, CMO, CFO, CEO, Other)
- `fqhcSize` (select: <5k, 5–15k, 15–30k, 30–60k, 60k+ patients/yr)
- `numberOfSites` (select: 1, 2–3, 4–10, 11+)
- `emr` (select: Athenahealth, Epic, eClinicalWorks, NextGen, Cerner, OCHIN Epic, Greenway, Other) + `emrOther` text when "Other"
- `interest` (multi-select chips: UDS Tracking, PCMH Evidence, HRSA OSV Audit Binder, PDSA Cycles, SPC Charts, Pricing question, Demo request)
- `timeline` (select: Now, This quarter, Next 6 months, Just exploring) — optional
- Existing: `name`, `email`, `message` (message becomes optional if `interest` is set)

Implementation:
- New zod schema `contactSchema` in the component.
- Use shadcn `Select`, `Checkbox`, `Input`, `Textarea`. Two-column responsive layout.
- Submit the full payload to `contact-form`. Update `supabase/functions/contact-form/index.ts` email template to render the new fields in a clean key/value table; keep backward compatibility (skip empty fields).
- Add a "We'll reply within 1 business day" trust line and a privacy note linking to `/privacy`.

---

## 4. No internal search for blog/resources

**Diagnosis.** `BlogIndex` lists all `blog_posts` rows (status='published') with no filter. As the library grows this gets unmanageable.

**Fix.** Add lightweight client-side search + tag filter on the blog index (no extra dependency, no edge function):

- In `src/pages/blog/BlogIndex.tsx`:
  - Add a search `<Input>` (icon: Search) above the post grid, debounced ~150ms.
  - Filter the already-fetched posts client-side on `title`, `excerpt`, and `tags` (case-insensitive substring + simple token match).
  - Add a tag chip row built from the union of `posts[].tags`. Clicking toggles a tag filter that AND-combines with the search.
  - Empty-state component: "No articles match '{query}'" with a "Clear filters" button.
  - Persist the query in `?q=...&tag=...` URL params so results are linkable.
- Add a "Search articles" link to the global header search affordance? **Out of scope** — keep the search local to `/blog` for now to avoid a full-site search infra build.

For future scale: leave a `// TODO: switch to a Postgres FTS RPC when posts > 200` comment.

---

## Files changed (summary)

- `src/App.tsx` — register case-study routes
- `src/pages/CaseStudies.tsx` — switch cards to `<Link>`
- `src/pages/case-studies/*.tsx` — 3 new pages (port HTML → JSX)
- `public/case-studies/*.html` — delete (or stub redirect)
- `public/sitemap.xml` — add 3 case-study URLs
- `src/pages/NotFound.tsx` — verify no auth redirect
- `src/pages/Landing.tsx` — swap raw `<a>` for new `SampleExportButtons`
- `src/components/SampleExportButtons.tsx` (new) — preview dialog + tracked download
- `index.html` — `<link rel="prefetch">` for sample PDF
- `src/components/ContactForm.tsx` — expanded form + zod
- `supabase/functions/contact-form/index.ts` — render new fields in email
- `src/pages/blog/BlogIndex.tsx` — search input + tag chips + URL params

## Out of scope

- Full-site search (Algolia/Meilisearch/PG FTS).
- Storing contact submissions in a DB table — current flow is email-only; can be a follow-up.
- Rebuilding the static case-study HTML files into MDX — straight JSX port is enough.
