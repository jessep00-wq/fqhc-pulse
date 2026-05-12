## What you're getting

1. **Header link audit** — Confirm Blog (`/blog`) and Newsletter (`/newsletter`) routes resolve correctly, keep Case Studies in the public nav.
2. **Database-backed Blog** with an Admin Console authoring tool so you can publish a new post each month without code changes.
3. **About the Author page** at `/about` with Jessica Smith's full bio, credentials, focus areas, and author statement.

---

### 1. Public header fix

Header already renders Features · How It Works · Case Studies · Blog · Pricing. Newsletter is currently only in the footer (correct — secondary destination). I'll:

- Verify `/blog` and `/newsletter` both render (they do — `BlogIndex` and `NewsletterIndex` are wired in `App.tsx`).
- Add an **About** link to the public header so the new author page is reachable.
- Keep Case Studies in the nav as-is.

---

### 2. Admin Blog (database-backed posts)

Today `BlogIndex` and the four post pages are hardcoded `.tsx` files — you can't add a post without an engineer. I'll convert blog to a DB-driven model with an admin authoring page, while keeping the existing 4 posts visible.

**New `blog_posts` table** (with RLS):
- `id`, `slug` (unique), `title`, `excerpt`, `cover_emoji`, `content_md` (markdown body), `read_time_minutes`, `status` ('draft' | 'published'), `published_at`, `author_name`, `created_at`, `updated_at`
- RLS: anyone can SELECT where `status='published'`; founder admins can do everything.

**Public pages**:
- `/blog` (`BlogIndex.tsx`) — fetch published posts from DB ordered by `published_at desc`, merged with the 4 existing hardcoded legacy posts so nothing disappears.
- `/blog/:slug` — new dynamic route that renders DB posts (markdown via `react-markdown`, which I'll add). Existing hardcoded routes (`/blog/pdsa-cycle-fqhc-guide`, etc.) keep working — the dynamic route only matches when no static route does.

**Admin Console**:
- New nav item **Blog** in `AdminLayout.tsx` (icon: `FileText`).
- New page `/admin/blog` (`AdminBlog.tsx`) modeled on `AdminNewsletter.tsx`:
  - List table (Title · Status · Published date · Actions)
  - "New Post" dialog with fields: Title, Slug (auto-generated from title, editable), Excerpt, Cover emoji, Read time, Markdown body (large textarea with a live preview tab), Status, Publish date.
  - Edit / Delete / Publish actions per row.
- Route added under the existing `/admin/*` block in `App.tsx`, gated by `AdminRoute`.

---

### 3. About the Author page

New route `/about` → `src/pages/About.tsx` using `PublicPageLayout` + `SEO`. Sections, in order:

- Hero: name, "Jessica Smith, RN" + the role line "FQHC Quality, Clinical Operations, Risk Management, and Data Integrity Leader".
- **Bio** — your two intro paragraphs.
- **Professional Background** — the nursing/operations history paragraph + Access Family Health detail + LifeCore / Mantachie / NMMC / Kindred Hospice paragraph.
- **Credentials & Professional Training** — both education paragraphs as a clean two-column card layout (Education / Continuing Ed & Certifications).
- **FQHC Quality Leadership** — three paragraphs followed by your focus-area list rendered as a 2-column bullet grid:
  - UDS measure performance and data integrity
  - HRSA audit readiness and documentation
  - AthenaOne workflow optimization
  - Population health and care gap workflows
  - Provider and staff education
  - Risk management and patient safety
  - Clinical quality reporting
  - Chronic disease measure improvement
  - PDSA cycle structure and accountability
  - Operational dashboards and executive reporting
- **Proof of Experience** — paragraph + the Employee of the First Quarter (2019) callout.
- **Author Statement** — rendered as a pulled-quote / italicized block ending with "It is about building the system that makes the measure true."
- Closing CTA strip linking to Contact and Start trial.

I'll add JSON-LD `Person` schema (name, jobTitle, alumniOf, knowsAbout) for SEO/E-E-A-T, plus a footer link under "Company" → About.

---

### Technical details (for reference)

**Files created**
- `src/pages/About.tsx`
- `src/pages/admin/AdminBlog.tsx`
- `src/pages/blog/BlogPostDynamic.tsx` (renders DB-backed post by slug)

**Files edited**
- `supabase/migrations/...` — `blog_posts` table + RLS
- `src/App.tsx` — add `/about`, `/admin/blog`, and dynamic `/blog/:slug` route (placed *after* the four static blog routes so they take priority)
- `src/components/PublicPageLayout.tsx` — add "About" link in header + footer
- `src/pages/Landing.tsx` — add "About" in nav + footer
- `src/components/AdminLayout.tsx` — add Blog nav item
- `src/pages/blog/BlogIndex.tsx` — fetch DB posts and merge with legacy list
- `package.json` — add `react-markdown` for post body rendering

**No changes** to: existing 4 hardcoded blog post pages, auth, billing, RLS on other tables.

---

### One quick confirmation before I build

Two small content choices — pick whichever, or tell me to use the defaults:

- **Author page URL**: `/about` (default) or `/about/jessica-smith`?
- **Credential label in the bio header**: you wrote "Jessica Smith, RN" but the footer/sig elsewhere on the site says "Jessica R. Smith, BSN". Should I use **RN** (matches this bio) or **BSN** (matches site footer)? I recommend "Jessica Smith, RN, BSN" if you hold both — say the word and I'll standardize across the site.
