# MeasureWise.org revamp (phased, approve per phase)

## Audit: what exists today
- Public pages: home (Landing), Features (+ per-feature pages), How it works, Pricing, About, Contact, Demo (PublicDemo), Security, Status, Privacy, Terms, Refund policy, persona pages (QI directors, PCMH coordinators, operations managers), Resources library, Store, Manual landing + thank-you, Readiness score quiz.
- Forms: Contact, Readiness leads (admin view exists), Store waitlist, Manual purchase.
- Auth: email + Google sign-in, email verification, mandatory onboarding, team invites. Not touched.
- Authenticated app under /dashboard and /admin. Not touched except adding activation events.
- Security page and trust copy already exist. Em-dashes appear across most public pages and need removal.

## Phase 1: Homepage and messaging
- Rewrite home hero with the core offer and the AthenaOne/Azara supporting line. Category: "PDSA and QI evidence management for FQHCs."
- Add 3-step section, "does / does not do" section, data statement ("monthly aggregate measure values, no patient-level data, no EHR or Azara connection"), security summary, two CTAs (Measure Rescue call, free PDSA Study Template).
- Update Features page and nav to match; remove "UDS software" wording, surveyor-expectation phrasing, unlabeled stats, em/en dashes, filler words across public pages.

## Phase 2: Lead capture (priority)
- Reusable email capture form: email, optional measure dropdown, honeypot, consent line, instant download on thank-you.
- New `leads` table (public insert only, no public read) with UTM capture.
- Server function: add contact to Resend segment "PDSA Template Leads", send Day 0 email with download link; duplicates handled quietly.
- Lead magnet page "PDSA Study Template + OSV QI Interview Checklist" with no nav.
- Gate existing AthenaOne guide and UDS playbook with the same form.
- Footer: unsubscribe info, mailing address [TODO], privacy, terms.
- "Request a Measure Rescue call" form saving to `demo_requests`, confirmation to prospect, notification to you.

## Phase 3: Measure Rescue demo
- Replace current demo with a guided walkthrough: pick a measure, then baseline, intervention, owner, 30-day result, Study, Act, export preview.
- Sample content for CMS130, CMS122, CMS165, CMS124 plus a generic "Other". Every screen labeled "Illustrative example, not customer data." Ends with call/trial CTA.

## Phase 4: Security page and one-pager
- Rebuild /security with: no-PHI rule, encryption, tenant isolation, role-based access, hosting, retention/deletion, vendor attestations (as vendors', not ours). Unverified items marked [TODO: confirm].
- Print stylesheet and downloadable PDF.
- The "no SOC 2 attestation" line stays held as [TODO: confirm] until you approve it.

## Phase 5: Analytics and activation
- PostHog events listed in the brief, wired at each action.
- `activated_at` set on the organization once all five activation events fire; funnel view on the admin side.
- Identify users by email at signup and form submit.

## Phase 6: SEO and QA
- Unique titles, descriptions, OG tags, canonicals, sitemap, robots for new and changed pages.
- Image compression, lazy loading, no layout shift.
- QA report: forms store data, emails arrive, links work, 375px checks, console clean, full list of [TODO] items for you.

Each phase ends with a summary, what to test, and decisions needed.

## Technical notes
- Server logic uses server functions/server routes, not new edge functions; Resend key read from server secrets only.
- `leads` and `demo_requests`: RLS on, anon INSERT only, founder admin SELECT; inserts go through a validated server function (zod).
- Activation stored on organizations via a column plus a server-side check when each tracked event is logged.
- Static homepage fallback shell and Google Ads tag preserved.

## Decisions needed before starting
- Download files: do the PDSA Study Template and OSV QI Interview Checklist already exist, or should I draft them? (Placeholders until provided.)
- Notification email address for Measure Rescue requests (default: hello@measurewise.org).
- Booking: should the call CTA open the form only, or also a calendar link [TODO]?
