
# Newsletter System for MeasureWise

## What We're Building

A full newsletter system with three parts:
1. **Public archive page** at `/newsletter` — visitors browse past issues rendered in your brand aesthetic
2. **Admin authoring** — founder admin creates/edits newsletter issues via `/admin/newsletter`
3. **Email subscription & delivery** — visitors subscribe, and new issues are emailed weekly

The uploaded HTML serves as the design reference. Each issue will be stored as structured content (headline, sections, callouts, etc.) so the rendering can vary week-to-week while staying on-brand.

---

## Database

### `newsletters` table
- `id`, `title`, `subtitle`, `hero_emoji`, `hero_summary`, `published_at`, `status` (draft/published), `created_at`
- Content stored as a JSONB `sections` column — an array of typed blocks: `intro`, `comparison`, `checklist`, `roles_grid`, `sprint_steps`, `quote`, `callout`, `body_text`, `divider`
- RLS: public SELECT for published issues; founder_admin full CRUD

### `newsletter_subscribers` table
- `id`, `email` (unique), `subscribed_at`, `unsubscribed_at`, `token` (for one-click unsubscribe)
- RLS: anon INSERT (subscribe); no public SELECT/UPDATE/DELETE

---

## Public Pages

### `/newsletter` — Archive index
- Lists all published issues (newest first) with title, date, and excerpt
- Each links to `/newsletter/:id`
- Subscribe form (email input + button) at top and bottom
- Uses `PublicPageLayout` for consistent header/footer
- Brand-aligned card design with teal accents

### `/newsletter/:id` — Single issue view
- Renders the JSONB sections using React components that mirror the uploaded HTML aesthetic:
  - Navy header with gradient teal accent line
  - Teal hero band
  - Comparison cards (red/green), checklists, role grids, sprint steps, quote blocks, callout boxes
  - CTA section at bottom
- Responsive, matches your teal/navy palette using design tokens
- Social share buttons (copy link, LinkedIn)

---

## Admin Pages

### `/admin/newsletter` — Newsletter management
- Table of all issues (drafts + published), with edit/delete/publish actions
- "New Issue" button opens a structured editor
- Editor has fields for: title, subtitle, hero emoji, hero summary
- Sections editor: add/remove/reorder typed blocks (body text, callout, comparison, checklist, roles grid, sprint steps, quote)
- Each block type has a simple form (no rich text needed — just text inputs/textareas)
- Preview button renders the issue in-page
- Publish button sets `published_at = now()` and triggers email send to all subscribers

---

## Email Delivery

- **Subscribe**: Public form calls an Edge Function that inserts into `newsletter_subscribers` with a unique unsubscribe token
- **Send**: When an issue is published, an Edge Function iterates subscribers and sends each a rendered HTML email
  - Email HTML matches the uploaded aesthetic (navy header, teal accents, CTA)
  - Includes one-click unsubscribe link
- **Unsubscribe**: Edge Function + page at `/newsletter/unsubscribe` validates token and sets `unsubscribed_at`

Note: Since newsletters are bulk/marketing emails, they will NOT use Lovable's transactional email system. Instead, we'll use the existing Resend connector for delivery, which is already configured in the project.

---

## Routing Changes

- Add `/newsletter` and `/newsletter/:id` as public routes
- Add `/admin/newsletter` inside the admin layout
- Add "Newsletter" nav item to admin sidebar

---

## Technical Details

- ~8 new files: 2 pages (archive + detail), 1 admin page, section renderer components, subscriber Edge Function, send Edge Function, unsubscribe Edge Function
- 1 migration: `newsletters` + `newsletter_subscribers` tables with RLS
- Uses existing `PublicPageLayout`, `AdminLayout`, and Resend connector
- Newsletter section components are reusable and map JSONB block types to styled React components matching the uploaded design
