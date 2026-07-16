## Connector audit

I mapped every connector to actual code paths. Here's the state and my recommendation.

### Keep — actively powering the core product

| Connector | Why keep |
|---|---|
| **Stripe (live)** | Paid product funnel — `payments-webhook`, `create-checkout`, `create-subscription-checkout`, `create-billing-portal`, `get-order`, `resend-purchase-email`, `download-watermarked-manual`, `StoreSuccess.tsx`. |
| **Stripe (sandbox)** | Same functions run against sandbox via `env` param. Preview-mode testing depends on this. |
| **Jessica's Resend** | Every transactional email — welcome, contact form, task deadlines, purchase delivery, readiness quiz report, playbook nurture, weekly digest. |

### Disconnect — zero code references

| Connector | Findings |
|---|---|
| **Jessica's Google Search Console** (`std_01krhj4jddfavr2ncevwk6fag2`) | No code path reads it. It was added during the SEO/growth push. Nothing in the surviving app calls it. Safe to disconnect. |
| **jrsmith13@mc.edu — GitHub API** (`std_01kxc5wmmnfpnr0de7pa49t6nb`) | You just added this earlier this session with no consumer. Zero `Octokit` / `github.com/api` / `/repos/` references anywhere in `src/` or `supabase/functions/`. This is the runtime GitHub API connector, not the separate Lovable ⇄ GitHub repo sync — disconnecting it does NOT unlink your repo. Safe to disconnect. |

### Not app connectors — no action

| Item | Note |
|---|---|
| **PostHog** | Only exists as an MCP/chat connector (`mcp_posthog_sChir`) — it powers agent tooling during building, not runtime app code. `src/lib/trackEvent.ts` is already a no-op. Nothing to disconnect. |
| **Notion** | Only exists as an MCP/chat connector (`mcp_notion_xNquj`) — chat-only. Nothing to disconnect. |
| **Second Resend on `jrsmith13@mc.edu`** | Not linked to this project — noise in the workspace list, nothing to do. |

### Related loose end (separate from connectors)

- **`weekly-digest` edge function** is still deployed and scheduled via `supabase/config.toml`, but it was built for the removed newsletter feature. I'd recommend deleting it in a follow-up so it stops running against Resend on a cron.

### Execution

Once you approve:

1. `standard_connectors--disconnect` on `std_01krhj4jddfavr2ncevwk6fag2` (Google Search Console).
2. `standard_connectors--disconnect` on `std_01kxc5wmmnfpnr0de7pa49t6nb` (GitHub API).

No code changes needed — nothing imports these secrets.

### Confirm before I run

1. Disconnect **Google Search Console**? (yes/no)
2. Disconnect **GitHub API**? (yes/no)
3. Also delete the orphan **`weekly-digest`** edge function while I'm here? (yes/no)
