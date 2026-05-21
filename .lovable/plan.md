# Centralize brand naming + standardize legal/email signatures

## Goal

Replace ad-hoc `"MeasureWise"` / `"MeasureWise™"` / `"measurewise.org"` / footer-and-signature string literals scattered across the app and edge functions with a single source of truth, and standardize:

- Where the `™` symbol appears (first/prominent mention only)
- Legal entity line in footer + email footers
- Founder email signature
- Canonical domain string used in SEO, emails, and CTAs

Audit scope confirmed:
- Only brand variants in use today are `MeasureWise` and `MeasureWise™` (no `Measure-Wise`, `MeasureWise.com`, `measurewise.io`, etc.).
- Only canonical domain in use is `measurewise.org` (no alternates).
- ~309 occurrences of `MeasureWise` across ~70 files; the highest-density files are `src/pages/Landing.tsx`, `src/pages/Auth.tsx`, `src/pages/Pricing.tsx`, `src/components/SEO.tsx`, `src/components/PublicPageLayout.tsx`, and `supabase/functions/*`.

## 1. Frontend constants module

Create **`src/lib/brand.ts`** as the single naming source for client code:

```ts
export const BRAND = {
  name: "MeasureWise",               // bare name, used in body copy
  nameTm: "MeasureWise\u2122",       // with ™, for first/prominent mention
  tagline: "PDSA & UDS Quality Operations for FQHCs",
  legalEntity: "MeasureWise",        // shown in © line; update if entity changes
  legalLocation: "Fulton, MS",
  domain: "measurewise.org",
  url: "https://measurewise.org",
  supportEmail: "support@measurewise.org",
  helloEmail: "hello@measurewise.org",
  founder: {
    name: "Jessica Smith",
    formalName: "Jessica R. Smith, BSN",
    title: "Founder, MeasureWise",
    email: "jessica@measurewise.org",
  },
} as const;

export const copyright = (year = new Date().getFullYear()) =>
  `© ${year} ${BRAND.legalEntity}. All rights reserved.`;
```

Helper exports (`brandTitle(pageTitle)`, `footerLine()`) only if they remove real repetition — keep the module small.

## 2. Edge-function constants module

Edge functions cannot import from `src/`. Create the Deno-side mirror at **`supabase/functions/_shared/brand.ts`**:

```ts
export const BRAND = { /* same shape as src/lib/brand.ts */ };
export const copyright = (year = new Date().getFullYear()) =>
  `© ${year} ${BRAND.legalEntity}. All rights reserved.`;
export const fromAddress = (mailbox: "hello" | "jessica" | "newsletter") => /* … */;
```

Both files hold the same values; a short comment in each points at the other so they stay in sync. (A build-time sync script is out of scope — two files, ~30 lines each, is acceptable duplication for the boundary between Vite and Deno.)

## 3. Apply constants across files

For each target file, replace string literals with `BRAND.*` references. Visible-copy sentences inside long paragraphs are *not* mechanically replaced — only branded references (name, domain, email, signature, copyright, page-title prefix) become constants. Body copy that happens to mention "MeasureWise" stays as-is (replacing every word would hurt readability and is not what the user asked for).

### Frontend files

- **`src/components/SEO.tsx`** — replace `"MeasureWise"`, `"MeasureWise™"`, and `"https://measurewise.org"` with `BRAND.name`, `BRAND.nameTm`, `BRAND.url`. Page-title formatter becomes `${title} | ${BRAND.nameTm}`.
- **`src/components/PublicPageLayout.tsx`** — footer copyright uses `copyright()` + `BRAND.legalLocation`; support email link uses `BRAND.supportEmail`.
- **`src/pages/Landing.tsx`** — `SEO` title, JSON-LD `name`/`url`, hero `<img alt>`, founder authority sig, store/comparison/persona labels reference `BRAND.name` / `BRAND.nameTm`. FAQ/long-form paragraphs keep their inline "MeasureWise" mentions.
- **`src/pages/Auth.tsx`** — `<CardTitle>` brand label, welcome-email HTML (subject, header `<h1>`, founder sig line, copyright row) read from `BRAND` + `copyright()`. The transactional HTML in this file is the duplicated welcome path; it should call into `supabase/functions/_shared/email-templates.ts` longer-term, but for this pass we just swap the string literals for constants in place.
- **`src/pages/Pricing.tsx`** — JSON-LD `name`, SEO title, hero headline, and the few FAQ answers that hard-code the brand name use `BRAND.name` / `BRAND.nameTm`.

### Edge functions

For each function below, replace the corresponding literals with `BRAND.*` from `supabase/functions/_shared/brand.ts`:

- `_shared/email-templates.ts` — header `<h1>`, footer copyright, dashboard URL, founder sig.
- `send-welcome-email/index.ts` — header, copyright, dashboard URL, founder sig block, `from:` address, subject.
- `send-playbook-followups/index.ts` — header, copyright, founder sig, `from:`, `CALENDLY_URL` (currently `https://measurewise.org/contact`).
- `send-newsletter/index.ts` — `baseUrl`, `from:`, header/footer brand mentions.
- `contact-form/index.ts` — `COMPANY_INBOX`, header, copyright, `from:`, subject, CTA URL.
- `check-task-deadlines/index.ts` — `from:`.
- `weekly-digest/index.ts` — subject suffix, `from:`.
- `send-email/index.ts` — default `from:`.
- `resend-purchase-email/index.ts` — `from:`, subject.
- `capture-playbook-lead/index.ts` — `ABSOLUTE_DOWNLOAD_URL` base, `from:`, founder sig.
- `create-checkout/index.ts` + `create-billing-portal/index.ts` — `ALLOWED_ORIGINS` set + fallback origin.

### ™ standardization rule

After this change, `™` appears exactly in: the static `<title>` / SEO page title (via `BRAND.nameTm`), the Auth/email `<h1>` header (via `BRAND.nameTm`), the newsletter footer (already uses ™). Everywhere else (body copy, footer copyright, founder sig, comparison-table column header, store/store-card labels) uses bare `BRAND.name`. This matches the common "trademark on first prominent mention" convention and removes the current inconsistency where ™ sometimes appears in body copy and sometimes doesn't.

### Legal entity / signature standardization

- Footer copyright everywhere: `© {year} MeasureWise. All rights reserved.` plus `· Fulton, MS` only on the public site footer + welcome email (consistent with current behavior).
- Founder signature block everywhere: line 1 `— Jessica R. Smith, BSN`, line 2 `Founder, MeasureWise` (matches current Auth.tsx; aligns the welcome-email / playbook-lead emails that today render the title inline).
- Canonical URL everywhere: `https://measurewise.org` (no trailing slash; per-route paths append).

## 4. Out of scope

- Renaming the legal entity itself (still "MeasureWise"; the constant exists so a future rename is one edit).
- Rewriting body-copy paragraphs that mention the brand name.
- Migrating the inline `Auth.tsx` welcome-email HTML to the shared `_shared/email-templates.ts` template (separate refactor).
- The other 60+ files containing the brand string — they keep inline mentions for now; the request lists Landing/Auth/Pricing/SEO/email templates as the standardization surface.
- Any visual or layout change.

## Files touched

- New: `src/lib/brand.ts`, `supabase/functions/_shared/brand.ts`
- Edited (frontend): `src/components/SEO.tsx`, `src/components/PublicPageLayout.tsx`, `src/pages/Landing.tsx`, `src/pages/Auth.tsx`, `src/pages/Pricing.tsx`
- Edited (edge): `supabase/functions/_shared/email-templates.ts`, `send-welcome-email`, `send-playbook-followups`, `send-newsletter`, `contact-form`, `check-task-deadlines`, `weekly-digest`, `send-email`, `resend-purchase-email`, `capture-playbook-lead`, `create-checkout`, `create-billing-portal`
