

# Fix: Enable Auto-Confirm for Email Signups

## Root Cause

The "violates row-level security" error occurs because new users sign up but never confirm their email (verification emails aren't being delivered). Without confirmation, they can't establish an authenticated session, and the RLS policy on `organizations` requires the `authenticated` role.

Your existing user (Jessica) works fine because she was confirmed earlier. New signups are stuck.

## Fix

Use the `configure_auth` tool to enable auto-confirm for email signups. This skips the email verification step, allowing users to sign in immediately after signup.

No code changes or migrations needed — just a single auth configuration update.

## Impact

- New users will be able to sign up and immediately proceed to onboarding
- Existing users are unaffected
- Google SSO continues to work as before

