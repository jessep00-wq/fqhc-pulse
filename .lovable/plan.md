## Full QA sweep — what I'll check

I'll run through the site end-to-end in the browser at desktop and mobile widths, hitting every route and the main interactive buttons, then report findings as a single pass/fail list. Anything broken gets fixed in the follow-up build.

### Public site (logged out)
- `/` Landing — header nav links (Features, How It Works, Case Studies, Blog, About, Pricing), hero CTAs, footer columns
- `/about` — renders, JSON-LD present, CTA buttons work
- `/case-studies` — index + each of the 3 standalone HTML pages load
- `/blog` — index lists 4 legacy posts; each `/blog/:slug` opens
- `/blog/:slug` dynamic — confirm the new dynamic route does not shadow the 4 static routes
- `/newsletter`, `/newsletter/:id`, `/newsletter/unsubscribe`
- `/pricing`, `/how-it-works`, `/status`, `/contact`, `/security`, `/refund-policy`, `/privacy`, `/terms`
- `/for/qi-directors`, `/for/pcmh-coordinators`, `/for/operations-managers`
- `/features/*` (PDSA, UDS, HRSA, SPC, PCMH)
- `/store` index + a product + a bundle
- Page refresh on a deep link (e.g., `/blog/pdsa-cycle-fqhc-guide`) returns 200 (SPA fallback)
- 404 (`/does-not-exist`) renders NotFound

### Auth + onboarding
- `/auth` sign-in tab loads, sign-up tab loads, password reset link
- Confirm "Start 14-day free trial" routes to `/auth?signup=true`

### Authenticated app (founder bypass)
- `/dashboard` — loads without trial lock, no TrialBanner for founder
- Sidebar links: PDSA Lab, Network, Playbooks, AI Assistant, Staff Tasks, Settings
- Quick interactions: open a PDSA card, open AI Assistant, open Settings tabs
- Founder tier limits = network (no upgrade prompts)

### Admin console
- `/admin` loads, all 6 nav buttons work: Overview, Pipeline, Billing, Adoption, Newsletter, **Blog**, Store
- `/admin/blog` — table renders, "New Post" dialog opens, all fields editable, Markdown preview tab works
- Create a draft post, edit it, publish it, verify it appears on `/blog` and at `/blog/:slug`, then delete it (cleanup)
- Confirm slug auto-generation, status pill, View / Publish / Edit / Delete actions

### Cross-cutting
- Console: no new red errors (router future-flag warnings are expected)
- Network: no failing 4xx/5xx besides intentional auth redirects
- Responsive: re-check Landing + Blog + Admin/Blog at 390px width
- SEO: Helmet sets `<title>` per route, canonical present, About page emits Person JSON-LD

### Output
A single report grouped by area: ✅ working / ⚠️ minor / ❌ broken, with the exact route or button for each. After approval, I'll switch to build mode and fix anything in the ❌ / ⚠️ lists.

### One question before I start
The Admin Blog test will create a real "QA test post" in the database. I'll delete it at the end, but for ~30 seconds it would be visible at `/blog` to anyone hitting the site. Two options:

- **A. Use a draft-only test** — create the post as draft, verify edit + preview + publish-toggle UI, but don't actually publish to the public site. Safer.
- **B. Full publish test** — briefly publish, view it at `/blog/qa-test-post`, then delete. Most thorough.

Pick one and I'll proceed. (Default if you don't answer: **A — draft only**.)
