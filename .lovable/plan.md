

# Public Landing Page, Password UX, Legal Links & Google SSO

## 1. Public Landing Page (`src/pages/Landing.tsx`)

New page shown to unauthenticated visitors at `/`. Sections:

- **Hero**: "QualityOS" headline, tagline ("The QI operating system for FQHCs"), CTA buttons (Sign Up / Sign In)
- **Features grid** (3-4 cards): PDSA Cycle Management, UDS Measure Tracking, SPC Analytics, Playbook Library — each with icon, title, one-liner
- **Social proof / stats strip**: e.g. "Track 20+ UDS measures", "Built for HRSA compliance"
- **Footer**: Links to Terms of Service, Privacy Policy, Sign In

**Routing change in `src/App.tsx`:**
- Move `/` to render `Landing` for unauthenticated users
- Authenticated dashboard moves to `/dashboard`
- Update all nav links (`AppSidebar`) to use `/dashboard` as home
- Update `ProtectedRoute` redirect target from `/auth` to `/` (landing has auth CTAs)

## 2. Password Requirements on Signup (`src/pages/Auth.tsx`)

- Add a password requirements checklist below the password field (visible only during signup):
  - At least 8 characters
  - Contains uppercase, lowercase, number
- Show each requirement with green check / gray circle as user types
- Disable submit until all requirements met

## 3. Terms of Service & Privacy Policy

- Add placeholder pages: `src/pages/TermsOfService.tsx` and `src/pages/PrivacyPolicy.tsx` with boilerplate text noting the app handles QI data and outlining standard terms
- Add public routes `/terms` and `/privacy` in `App.tsx`
- Add checkbox on signup form: "I agree to the Terms of Service and Privacy Policy" (links open in new tab)
- Disable signup button until checkbox is checked

## 4. Google SSO

- Use Lovable Cloud's managed Google OAuth via `lovable.auth.signInWithOAuth("google")`
- Run the Configure Social Auth tool to generate the lovable module
- Add a "Sign in with Google" button on the Auth page (both login and signup views)
- Add the same button on the Landing page hero

## Technical Summary

| File | Change |
|------|--------|
| `src/pages/Landing.tsx` | New — public landing page |
| `src/pages/TermsOfService.tsx` | New — placeholder ToS |
| `src/pages/PrivacyPolicy.tsx` | New — placeholder Privacy Policy |
| `src/pages/Auth.tsx` | Password strength indicators, ToS checkbox, Google SSO button |
| `src/App.tsx` | New public routes (`/`, `/terms`, `/privacy`), dashboard route change to `/dashboard` |
| `src/components/AppSidebar.tsx` | Update home link to `/dashboard` |
| `src/components/ProtectedRoute.tsx` | Redirect to `/` instead of `/auth` |
| `src/components/NavLink.tsx` | Update if referencing `/` |

