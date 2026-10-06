# Signed-in speed check: dashboard and admin

## Goal
Time the dashboard and admin pages while signed in as your founder admin account, on a normal connection and a slow one. Fix whatever makes them slow or jump around, then show you before and after numbers.

## Step 1: Measure (baseline)
- Use your signed-in preview session. If no session is available, I'll ask you to sign in and stop there.
- Pages: dashboard home, PDSA board, AI assistant, QI reports, staff tasks, network dashboard, settings, plus admin Accounts, Users, Billing, Adoption, AI activity, Email health, Store and Readiness leads.
- For each page, record: time until the main content shows, layout shift, time until the data appears, number of data requests, any duplicate or one-after-another requests, download size, and console errors.
- Repeat on a simulated slow connection (3G), with screenshots at 1s, 3s and finished.

## Step 2: Fix only what the numbers confirm
Likely suspects, based on the code:
- **Admin Accounts page** loads every subscription, every health snapshot and every profile row (all columns), then filters in the browser. Fetch only the needed columns and only the latest snapshot per account.
- **Requests that wait on each other** (sign-in, then workspace, then role, then data). Run the independent ones in parallel.
- **Loading placeholders** shaped like the real content where pages still show blank areas or spinners: dashboard cards, charts, admin tables.
- **Heavy chart code** on pages that open with no chart visible: load it only when needed.
- **Repeated requests** for the same data from different parts of a page: share one cached result.

## Step 3: Verify
- Re-run the same measurements and report a table per page: before and after, normal and slow.
- Confirm no console errors and that the site still builds.

## Out of scope
No design, wording, pricing or permission changes. Test failures from the earlier cleanup item are not part of this.

## Technical notes
- Playwright with a restored session, PerformanceObserver for LCP/CLS, CDP throttling for 3G, network log for request counts and waterfalls.
- Query changes keep explicit organization_id filters and RLS untouched.
