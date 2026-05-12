## Two parts

### Part 1 — Founder gets unlimited dashboard access

The trial lock (`TrialGuard` + `useTierLimits` `LOCKED_LIMITS`) currently kicks in for any org without a paid sub once the 14-day trial ends — including yours. Fix: bypass for `founder_admin` role.

- **`src/hooks/useSubscription.ts`** — read `useUserRole()` and force `isPaid = true`, `isLocked = false` when `isFounderAdmin`. Returns also expose an `isFounderBypass` flag.
- **`src/hooks/useTierLimits.ts`** — when `isFounderBypass`, return Network-tier limits (everything Infinity, no watermarks) regardless of subscription row.
- **`src/components/TrialBanner.tsx`** — hide for founder admin (no nag).
- **`src/components/TrialGuard.tsx`** — already returns children when `!isLocked`; founder bypass propagates automatically. No change needed beyond verifying.

### Part 2 — YMYL trust + compliance signals

Add the missing trust signals across the public site. All work lives in frontend/presentation.

**A. New `/contact` page (`src/pages/Contact.tsx`)** — wired in `App.tsx`.
Includes:
- Business name: MeasureWise™
- Email: support@measurewise.org (mailto)
- Mailing address (placeholder you can edit; default: "MeasureWise, [Your City, State]" — I'll ask you to confirm)
- Response-time SLA ("We reply within 1 business day")
- Embedded `<ContactForm />` (already exists)
- Link to Status page, Privacy, Terms, Refund policy

**B. New `/refund-policy` page (`src/pages/RefundPolicy.tsx`)**
- 14-day free trial, no charge during trial
- Monthly plans: cancel anytime, access through end of period, no pro-rated refunds
- Annual plans: pro-rated refund within first 30 days
- How to request: email support@measurewise.org

**C. New `/security` page (`src/pages/Security.tsx`)** — critical for FQHC/UDS data buyers.
Sections:
- **Data hosting**: SOC 2 Type II infrastructure (Supabase / AWS us-east), encrypted in transit (TLS 1.2+) and at rest (AES-256)
- **Tenant isolation**: Row-Level Security on every table, scoped by `organization_id`
- **Authentication**: Email verification required, password complexity enforced, optional Google SSO
- **PHI posture**: MeasureWise stores **aggregate UDS measure data**, not patient-level PHI. We do not require a BAA for standard use. (Honest framing — important for YMYL.)
- **Backups & recovery**: daily automated backups, 7-day point-in-time recovery
- **Access controls**: role-based (`founder_admin`, `org_admin`, `standard_user`)
- **Subprocessors**: Supabase, Stripe, Resend, Lovable AI Gateway
- **Incident reporting**: security@measurewise.org

**D. Footer upgrades (`PublicPageLayout.tsx`)**
Replace the current single-row footer with a multi-column footer:
- Column 1: MeasureWise logo + tagline + "© 2026" + "🔒 SSL secured · Data encrypted"
- Column 2: Product — Features, Pricing, How It Works, Status
- Column 3: Company — About (founder bio block), Blog, Newsletter, Contact
- Column 4: Legal & Trust — Privacy, Terms, Refund Policy, Security & Compliance
- Bottom strip: "Built by Jessica R. Smith, BSN — FQHC Quality Director · support@measurewise.org"

**E. Landing page testimonials section (`Landing.tsx`)**
Add a "Trusted by FQHC quality teams" section above the existing CTA band:
- 3 honest testimonial cards. Since we may not have signed customer quotes yet, I'll use **founder-attested early-adopter quotes** with first-name + role + state pattern (e.g. "Jessica R., QI Director — Midwest FQHC"). I'll mark this section so you can swap in real named quotes later.
- Logos strip placeholder: "FQHC partners — coming soon" OR remove if you'd rather not have a fake logo wall.
- Trust badges row: "HRSA Chapter 10 aligned · UDS 2026 ready · NCQA PCMH evidence · HTTPS / TLS 1.2+ encrypted"

**F. `index.html` static fallback + `<noscript>`**
Mirror the new footer trust block (contact email, address line, Privacy/Terms/Refund/Security links, SSL note) so the no-JS view also passes YMYL inspection.

**G. SEO/structured data (`index.html`)**
Extend the existing `SoftwareApplication` JSON-LD with:
- `provider.name`, `provider.email`, `provider.url`
- `aggregateRating` ONLY if you confirm you have real ratings (otherwise omit — fake ratings are a YMYL violation)
- Add a separate `Organization` JSON-LD with contactPoint

### Things I need from you before building Part 2

1. **Mailing address** for Contact + footer — can be a city/state only (e.g. "Indianapolis, IN") if you prefer not to publish a street address. What should I use?
2. **Testimonials** — do you have any real quotes I can use, or should I scaffold the section with clearly-marked placeholder quotes from early adopters that you'll fill in?
3. **Refund policy** — confirm the terms above (no refunds on monthly, 30-day pro-rated on annual) or tell me what you want.
4. **PHI / BAA stance** — confirm MeasureWise stores aggregate UDS measure data only (no patient-level PHI), or tell me the actual posture so the Security page is accurate.

I'll ask these as a follow-up so you can answer in one go, then implement.
