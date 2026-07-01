# Admin Console: Growth Ops + Store Polish

Three coordinated changes: (1) a new **Growth Ops** area in Admin that unifies lead, email, newsletter, download, traffic, and failure signals; (2) a **visual refresh of the Store admin** that removes emojis in favor of real icons/thumbnails; (3) cohesion pass so admin pages share layout, typography, and navigation.

Note on Make: no code changes to your Make workflows — MeasureWise keeps recording every send in `email_send_log`, and the new dashboard reads from there, so Resend-sent and Make-sent emails both show up as long as Make POSTs a lightweight webhook to a new `log-external-email` endpoint (optional, described below).

---

## 1) Growth Ops hub (new)

New sidebar group **"Growth Ops"** with four pages that replace the scattered Readiness / Waitlist / Newsletter admin links:

```text
Growth Ops
├── Overview        /admin/growth              (KPIs + activity stream)
├── Leads           /admin/growth/leads        (all lead sources unified)
├── Email Activity  /admin/growth/email        (email_send_log dashboard)
└── Traffic         /admin/growth/traffic      (PostHog + funnel)
```

### 1a. Overview (`/admin/growth`)

Single scannable page with time-range filter (24h / 7d / 30d / custom):

- KPI tiles: **New leads**, **Newsletter subscribers**, **Free product downloads**, **Emails sent**, **Emails failed**, **Unique visitors (7d)**
- **Recent activity stream** (unified feed): new lead, newsletter signup, playbook/free-download claim, waitlist application, order, email failure — each row links to detail
- **Alerts strip** at top: red banner when any email failed in last 24h, yellow when bounce rate > 2%

### 1b. Leads (`/admin/growth/leads`)

Unified table pulling from `playbook_leads`, `readiness_submissions`, `waitlist_applications`, `newsletter_subscribers` — one row per contact with:

- Email, name, source (playbook / readiness / waitlist / newsletter), captured at, current status, tags
- Filters: source, date range, status, "has converted to org"
- Row actions: view detail, copy email, export CSV, mark contacted
- CSV export of current filter

### 1c. Email Activity (`/admin/growth/email`)

Built to the **six-feature email dashboard spec** (already in project guidance):

1. Time range filter (24h / 7d / 30d / custom, default 7d)
2. Template filter (multi-select from distinct `template_name`)
3. Status filter (All / Sent / Failed / Suppressed) with color badges
4. Summary stats: deduplicated by `message_id` — total unique, sent, failed, suppressed
5. Log table: latest row per `message_id`, sortable, paginated 50/page, error shown on failed rows
6. Resend action on failed rows (calls existing `resend-purchase-email` / generic resend)

Includes a **"Suppressed emails"** panel from the `suppressed_emails` table (bounces/complaints/unsubscribes).

### 1d. Traffic (`/admin/growth/traffic`)

Embeds visitor + funnel data from PostHog via the existing `analytics--read_project_analytics` bridge:

- Unique visitors, pageviews, sessions, bounce rate (7d vs prior 7d)
- Top 5 pages, top 5 traffic sources
- Funnel: `pricing_viewed → plan_selected → signup_started → signup_completed → onboarding_completed`
- Newsletter signup conversion by source page

### Optional: Make integration hook

If you want Make-sent emails to also show up in Email Activity, we add an edge function `log-external-email` (HMAC-signed) that Make calls after each send with `{template, recipient, status, message_id, error?}`. Zero disruption to your existing Make scenarios. Skip this if you'd rather keep Make emails separate.

---

## 2) Store admin visual refresh

Kills the emoji-as-hero look on `/admin/store` and the public storefront.

- Replace `hero_emoji` display with either an uploaded **cover image** (new `hero_image_url` column on `store_products`, stored in existing `product-previews` bucket) or a **Lucide icon** chosen from a curated palette (FileText, ClipboardCheck, ShieldCheck, BarChart3, Users, Layers) rendered inside a branded tile
- Each product card in admin gets: cover thumbnail (or icon tile), name, category chip, status chip, price, "Files (n)" count — laid out in a proper 2-column grid with muted borders instead of stacked full-width cards
- Inline editing kept but reorganized into a right-hand drawer (`Sheet`) with tabs: **Details**, **Files**, **Previews**, **Pricing** — reduces the wall-of-forms feel
- Public `StoreIndex.tsx` and `ProductCard` updated to render the new hero image / icon tile — no more `📋` fallback rendered at 32–48px
- Bundles get the same treatment (`hero_image_url` on `store_bundles`)
- Emoji fields remain in DB for backward compatibility but are hidden from UI

Result: consistent card grid, real imagery where uploaded, on-brand teal icon tiles otherwise.

---

## 3) Cohesion pass

- Every admin page adopts the shared `PageHeader` + `SectionCard` + `KpiCard` primitives already used in `AdminOverview` — currently `AdminStore`, `AdminNewsletter`, `AdminBlog` each roll their own headings
- Sidebar re-grouped:
  ```text
  Oversight:  Accounts, Users, Adoption
  Growth Ops: Overview, Leads, Email Activity, Traffic
  Content:    Content Ops, Blog, Newsletter, Store
  ```
  Retires standalone `Readiness Leads`, `Waitlist Tester`, `Waitlist Status` links (their data lives in Growth Ops → Leads and Email Activity)
- Consistent empty states, loading skeletons, and destructive-action confirms across all admin tables
- Uniform date formatting (`formatDistanceToNow`) and status badges

---

## Technical section

**New tables/columns**
- `store_products.hero_image_url text`, `store_products.hero_icon text` (Lucide name)
- `store_bundles.hero_image_url text`, `store_bundles.hero_icon text`
- Migration includes GRANT + no RLS changes (existing policies cover)

**New files**
- `src/pages/admin/growth/GrowthOverview.tsx`
- `src/pages/admin/growth/GrowthLeads.tsx`
- `src/pages/admin/growth/GrowthEmail.tsx`
- `src/pages/admin/growth/GrowthTraffic.tsx`
- `src/components/admin/growth/*` (KPI strip, ActivityStream, LeadsTable, EmailLogTable, SuppressedPanel, TrafficFunnel)
- `src/components/store/ProductHero.tsx` (image | icon tile renderer)
- Optional: `supabase/functions/log-external-email/index.ts` for Make webhook

**Edited files**
- `src/App.tsx` — new routes under `/admin/growth/*`
- `src/components/AdminSidebar.tsx` — regrouped nav
- `src/pages/admin/AdminStore.tsx` — Sheet-based editor, grid layout, ProductHero
- `src/pages/store/StoreIndex.tsx`, `src/components/store/ProductCard.tsx`, `BundleCard.tsx` — swap emoji hero for ProductHero
- `src/pages/admin/AdminNewsletter.tsx`, `AdminBlog.tsx` — adopt shared PageHeader/SectionCard

**Data sources per KPI**

| KPI                       | Source                                      |
|---------------------------|---------------------------------------------|
| New leads                 | union of playbook_leads, readiness_submissions, waitlist_applications |
| Newsletter subscribers    | `newsletter_subscribers` count              |
| Free downloads            | `download_log` + `manual_downloads`         |
| Emails sent / failed      | `email_send_log` (dedup by message_id)      |
| Unique visitors, funnel   | PostHog via `analytics--read_project_analytics` |
| Bounces / complaints      | `suppressed_emails`                         |

All queries founder-admin scoped via existing `is_founder_admin()` RLS.

**Out of scope (ask if wanted)**
- Rewriting Make scenarios
- Removing Resend / switching provider
- Public store visual redesign beyond the emoji swap
