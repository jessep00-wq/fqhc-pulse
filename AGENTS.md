# Project rules

- Serve the free PDSA template as a pre-rendered US-Letter PDF through a Lovable Assets pointer so visitors can download and print it without an account or contact request.
- Carry homepage measure selections through the walkthrough route's validated search parameter so each teaser opens the corresponding example.
- Keep public pages free of automatic lead-capture popups so visitors can read and download the template without interruption.
- Use complete CSS color tokens directly in the shared SVG logo because the theme tokens already include their color function.
- Send Cloud Auth emails from the app server route `src/routes/lovable/email/auth/webhook.ts` directly through the Resend connector gateway (templates in `src/lib/email-templates/`), never via the platform queue, because the managed email hook only calls that route on this stack; `supabase/functions/auth-email-hook` is no longer invoked.
- Judge every UDS measure through `getMeasureStatus` in `src/lib/measureStatus.ts` (org goal from `measure_goals`, else the benchmark in `src/data/udsMeasures.ts`) so the dashboard, board report and settings never disagree.
- Trial follow-up emails (Day 3/7/10/13) are sent by the daily cron-called route `src/routes/api/public/trial-nurture.ts` (cron-secret auth, Resend gateway, dedupe via `email_send_log` template `trial-nurture-dayN`), because new Supabase edge functions are not allowed on this stack.
- Keep Barriers tab rules (status groups, sort, "Start here", suggestions, suggested owner) in `src/lib/barriers/barrierModel.ts` as pure functions, so the page, decision flow and tests share one definition.
