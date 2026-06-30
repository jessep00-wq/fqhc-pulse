# Diagnostic plan — two outstanding issues

Since the two issues didn't come through in the message, I'm defaulting to the two you've raised repeatedly in this thread and that still have open symptoms:

1. **QI/QA "Generate AI draft" still throws an error**
2. **Founder/owner account is still being pushed into `/onboarding` / forced re-sign-in instead of going straight to admin**

Here's how I'll diagnose each before changing any code.

---

## Issue 1 — QI/QA AI draft error

### What I'll check, in order
1. **Edge function logs for `draft-qi-report`** — pull the most recent invocations and read the actual error string. Last code change switched the model to `google/gemini-3-pro`. I need to confirm:
   - Is the gateway accepting that exact model id? (If not, it returns 400 and the function returns `"AI service unavailable"`.)
   - Is the request ever reaching the model, or failing at auth / org-lock / parse?
   - Is the model returning a tool call, or finishing with `length` / `content_filter` / empty?
2. **Client-side toast text** — confirm whether the error you see says "AI did not return a draft", "AI service unavailable", "Subscription required", or "Could not build snapshot" (each maps to a different root cause).
3. **Snapshot builder** — verify `buildReportSnapshot` is not the source by checking whether "Preview snapshot" succeeds before "Generate AI draft" fails. If preview works, snapshot is fine and the error is in the edge function.
4. **Model id sanity** — cross-check `google/gemini-3-pro` against the current chat-model catalog. If the supported id is actually `google/gemini-3-pro-preview` (or similar), that alone explains a 100% failure rate.

### Likely root causes (ranked)
- **A. Wrong model id** — gateway rejects `google/gemini-3-pro`, function returns 500. Fix: switch to a verified id from the catalog (most likely `google/gemini-3-pro-preview` or fall back to `google/gemini-2.5-flash`).
- **B. Tool-call not returned** — Gemini 3 sometimes returns the JSON in `content` instead of `tool_calls[0].function.arguments`; current parser only looks at tool_calls and 502s with `"AI did not return a draft (model finish_reason=stop)"`. Fix: parse `content` as JSON fallback.
- **C. Org access locked** — `org_access_status` returns `"locked"` → 402 "Subscription required". Founder account should bypass this; if it doesn't, that's a second bug.

### What I'll deliver
A one-line root cause + the exact one-file fix (model id swap and/or parser fallback), not a rewrite.

---

## Issue 2 — Founder onboarding / forced sign-in

### What I'll check
1. **`src/pages/Auth.tsx`** — where does it redirect after a successful sign-in for a user whose role is `founder_admin`? Today it likely sends everyone to `/dashboard`, which then bounces to `/onboarding` if `organization_id` is null on the profile.
2. **`src/pages/Onboarding.tsx`** — is there a founder bypass, or does it unconditionally require org creation?
3. **`src/components/ProtectedRoute.tsx`** — what's the null-org gate? Does it exempt `founder_admin`?
4. **`profiles` row for your account** — is `organization_id` actually null? If yes, the gate is correct in concept but wrong for a founder; if no, the gate has a bug.
5. **Session persistence** — why are you being asked to sign in repeatedly? Check whether `AuthContext` is calling `signOut` anywhere on focus / route change, and whether the Supabase session is being cleared by a stale onboarding flow.

### Likely root causes (ranked)
- **A. Founder profile has `organization_id = null`** and `ProtectedRoute` / `Onboarding` doesn't exempt `founder_admin`. Fix: either backfill your profile to point at a "MeasureWise HQ" org, or add a `founder_admin` bypass that routes straight to `/admin`.
- **B. `/admin` is gated behind the same org check** as `/dashboard`, so even a founder gets bounced. Fix: split the gates — `AdminRoute` should only require `founder_admin`, not an org.
- **C. Repeated sign-in prompt** — likely the post-onboarding redirect calls `supabase.auth.signOut()` or navigates to `/auth` because of the null-org gate, creating a loop.

### What I'll deliver
- Confirmed state of your profile row (org id, role) via a read-only query.
- The minimal patch: usually a single conditional in `ProtectedRoute` and a redirect tweak in `Auth.tsx` so `founder_admin` lands at `/admin` and never sees `/onboarding`.

---

## Order of operations (once you approve)

1. Read `draft-qi-report` edge logs + your profile row + role row (read-only, no code changes yet).
2. Report exact root cause for each.
3. Apply the smallest possible fix per issue (1 file each, ideally).
4. Verify: re-run "Generate AI draft" against logs; sign out / sign in as you and confirm you land on `/admin` with no onboarding prompt.

**If these are not the two issues you meant, reply with the two you want diagnosed and I'll redo the plan against those instead.**
