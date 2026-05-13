## Diagnosis

Do I know what the issue is? Yes.

The live backend is healthy, and the organization trigger now exists. The recurring “Your free trial has ended” screen is being caused by a subscription model mismatch:

- New organization creation seeds a `free/trialing` subscription row with the default `environment = 'sandbox'`.
- The published site can run in `live` payments mode, and `useSubscription()` only reads rows matching the current environment.
- Result: a new live user can have an active sandbox trial row, but the app sees no live subscription row and treats the workspace as locked.
- The database still has `UNIQUE (organization_id)`, so it cannot safely store both sandbox and live subscription rows. That also explains the earlier `subscriptions_organization_id_key` duplicate-key errors when payment/webhook logic tried to create another row for the same organization.

## Plan

1. **Repair the subscription schema**
   - Replace the old one-row-per-organization uniqueness rule with one-row-per-organization-per-environment: `organization_id + environment`.
   - This allows a workspace to have separate test and live billing state without duplicate-key failures.

2. **Harden trial provisioning for new organizations**
   - Update `handle_new_org_subscription()` so every new organization receives active 14-day trial rows for both `sandbox` and `live`.
   - Keep the trigger idempotent so repeated trigger/migration runs cannot break signup.

3. **Repair currently affected accounts**
   - Backfill missing `live` trial rows for organizations that already have an active trial or were created recently.
   - Leave genuinely expired older workspaces locked unless they already have an active paid/trial row.

4. **Fix payment webhook sync**
   - Update the subscription webhook upsert to target `organization_id + environment`, so paid subscriptions update the existing trial row instead of trying to insert a conflicting second row.
   - Ensure webhook errors are logged if the subscription sync fails.

5. **Add frontend resilience**
   - Update `useSubscription()` so paid subscription reads remain environment-scoped, but an active free trial can be honored as an organization-level fallback if an environment-specific trial row is temporarily missing.
   - This prevents new users from being locked out by a provisioning race or environment mismatch.

6. **Add regression coverage**
   - Add tests that verify onboarding/trial provisioning expectations:
     - new orgs get a 14-day trial,
     - both payment environments are supported,
     - the client does not lock a new org that has an active free trial.

7. **Validate**
   - Query the database after changes to confirm affected new orgs have active trial access.
   - Run the targeted test suite for onboarding/subscription behavior.

<lov-actions>
  <lov-open-history>View History</lov-open-history>
</lov-actions>

<lov-actions>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>