# Notify the outreach campaign when an org starts a trial

Goal: when a real organization's subscription enters trial, ping the separate campaign project so that contact is suppressed from cold outreach.

The SQL as pasted would install cleanly but never fire, and if it did fire it would error. Three fixes are needed before applying it.

## Issues found in the pasted SQL

1. **`environment = 'production'` never matches.** This database only uses `sandbox` and `live` (current rows: 4 live trialing, 5 sandbox trialing, 1 live active). The condition must be `new.environment = 'live'`.
2. **`extensions.net.http_post` does not exist.** `pg_net` is installed in the `extensions` schema, but its function is exposed as `net.http_post` (that's what the existing email-queue functions call). The pasted call would raise an error, and because the trigger runs inside the same transaction, it would break every subscription insert/update — including new-org signup.
3. **Bearer token hardcoded in the function body.** Anyone able to read the function definition sees the campaign project's key. Store it in Vault (as this project already does for the email queue key) and read it at call time.

## Plan

Single migration that:

- Ensures `pg_net` is available.
- Creates `public.notify_campaign_trial_signup()` (security definer, `search_path = public`) with:
  - gate on `new.status = 'trialing'` and `new.environment = 'live'`; skip when an UPDATE was already `trialing`;
  - owner email lookup via `organizations` → `auth.users`, then all other org member emails via `profiles` → `auth.users`;
  - `net.http_post(...)` per distinct email, with the Authorization bearer read from Vault;
  - the whole POST section wrapped in an exception handler so a webhook failure can never roll back a subscription write.
- Recreates the `after insert or update of status on public.subscriptions` row trigger.

Before that migration, the campaign webhook token is stored as a Vault secret (`campaign_webhook_token`) so it is not written into the function source.

## Note

Existing live trialing rows will not fire the trigger — it only covers new transitions from here on. If you want the 4 current live trial contacts suppressed, they can be posted to the webhook as a one-off.
