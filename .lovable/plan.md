# AthenaOne Playbook Lead Magnet

## 1. Assets & dependencies
- Copy the uploaded PDF to `public/downloads/MeasureWise_AthenaOne_Optimization_Playbook.pdf` so the download URL is stable.
- Generate a premium 3D book-cover mockup with imagegen (`src/assets/athenaone-playbook-cover.jpg`) — teal/navy brand palette, "AthenaOne Optimization Playbook" on the cover.
- Add `canvas-confetti` (`bun add canvas-confetti @types/canvas-confetti`) for the celebration burst.

## 2. Database (single migration)
New table `playbook_leads`:
- `full_name text not null`
- `work_email text not null`
- `health_center_name text not null`
- `role text not null` (QI Director | PCMH Coordinator | Operations Manager | Provider | Other)
- `source text not null default 'AthenaOne Playbook'`
- `created_at timestamptz default now()`
- Index on `(source, created_at)` for conversion reporting.

RLS:
- Public `INSERT` allowed (lead form is anonymous).
- `SELECT` restricted to `is_founder_admin(auth.uid())` so leads appear only in the founder admin console.

## 3. Edge function `capture-playbook-lead`
- Validates payload with zod (name 1–120, email RFC + business-domain blocklist for gmail/yahoo/hotmail/outlook/icloud/aol/proton, health center 1–160, role enum).
- Inserts row with `source = 'AthenaOne Playbook'` using service role.
- Calls Resend Contacts API via the existing `RESEND_API_KEY` connector secret to upsert the contact into the default audience with tag/label `Playbook Lead` (using `unsubscribed: false` + `firstName`/`lastName`). Failure to tag is logged but does not block the lead save.
- Sends a transactional delivery email (Resend) with the PDF download link and Jessica's signature, using existing branded template helpers in `supabase/functions/_shared/email-templates.ts`.
- Returns `{ ok: true, downloadUrl: '/downloads/MeasureWise_AthenaOne_Optimization_Playbook.pdf' }`.

## 4. Shared React component `PlaybookLeadMagnet`
`src/components/lead-magnets/PlaybookLeadForm.tsx` + `PlaybookLeadMagnet.tsx`:
- Form uses react-hook-form + zod (mirrors edge fn schema) with inline business-email error.
- On success: swap to a "Thank You" panel with a prominent `Download Now` button (anchor with `download` attr pointing at the PDF URL returned by the function) and fire `canvas-confetti` once.
- Variants via props: `variant: "section" | "dialog" | "sidebar"` to control padding/typography.
- Tracks `trackEvent('playbook_lead_submit', { surface })` on success for conversion attribution.

## 5. Placement
1. **Homepage section** (`src/pages/Landing.tsx`): insert two-column section above the existing final CTA — left column is the cover mockup with a soft teal glow, right column is heading "Master Your 2025 UDS Reporting", supporting copy, and `<PlaybookLeadForm variant="section" />`.
2. **Exit-intent popup** (`src/components/lead-magnets/ExitIntentPlaybookDialog.tsx` mounted in `PublicPageLayout`): triggers when `mouseleave` fires with `clientY <= 0` on desktop, once per session (`sessionStorage` key `playbook_exit_shown`), and only for users who haven't already submitted (`localStorage` key `playbook_lead_submitted`). Mobile fallback: trigger after 60s + 50% scroll. Uses shadcn `Dialog` wrapping `<PlaybookLeadForm variant="dialog" />`.
3. **Blog sidebar** (`src/pages/blog/BlogIndex.tsx` and `BlogPostDynamic.tsx`): wrap content in a `lg:grid-cols-[1fr_320px]` layout and add a sticky (`sticky top-24`) "Free Resource" card containing the cover thumbnail + condensed `<PlaybookLeadForm variant="sidebar" />`. Hidden below `lg`.

## 6. Admin visibility (small addition)
Surface lead count on `AdminOverview.tsx`: a single KPI "AthenaOne Playbook Leads (30d)" querying `playbook_leads` filtered by `source` so Jessica can see conversion without leaving the console.

## Technical notes
- Business-email blocklist lives in `src/lib/businessEmail.ts` and is re-exported to the edge function via inline copy (edge functions can't import from `src/`).
- The download link is a static `/public` file — no auth required, matching the existing `MeasureWise_Sample_Export.pdf` pattern.
- All new UI uses existing semantic tokens (primary, muted, card) — no raw colors.
- No changes to existing routes, billing, or RLS on other tables.
