## Goal
Link the GitHub REST API connector so edge functions can call GitHub on your behalf. This does **not** sync your codebase — it lets the app itself read/write GitHub data at runtime.

## What this enables
Once linked, backend code (edge functions) can call the GitHub API through Lovable's connector gateway using `LOVABLE_API_KEY` + `GITHUB_API_KEY`. Typical uses:
- Open/track issues from admin actions
- List repo activity in the admin console
- Trigger workflows or read release info
- Sync tickets/leads to a GitHub project

## Steps
1. Use `standard_connectors--connect` with `connector_id: github` — you'll pick an existing connection or authorize a new one (personal access token, scoped per the endpoints you want to hit).
2. After the connection is linked, `GITHUB_API_KEY` will be available to edge functions automatically. No code changes needed yet.
3. Confirm with a quick verify call so we know the token works.

## What I need from you before coding anything
You haven't told me the specific workflow yet. Linking the connector alone doesn't do anything user-facing. So after step 1, tell me the use case (e.g., "When a new OSV quiz lead comes in, open a GitHub issue in `measurewise/ops`") and I'll build the edge function + admin UI in a follow-up plan.

## Not included in this plan
- Codebase sync to a GitHub repo (that's the Plus → GitHub UI flow, not something I can trigger)
- Any specific feature/edge function using the GitHub API (needs your use case first)
- Make integration (separate — you'd add a `MAKE_WEBHOOK_URL` secret when ready)

## Technical detail
Connector gateway pattern (for reference, will be used when we build the actual feature):
```typescript
const res = await fetch(`https://connector-gateway.lovable.dev/github/repos/${owner}/${repo}/issues`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
    'X-Connection-Api-Key': Deno.env.get('GITHUB_API_KEY')!,
    Accept: 'application/vnd.github+json',
  },
  body: JSON.stringify({ title, body }),
});
```
