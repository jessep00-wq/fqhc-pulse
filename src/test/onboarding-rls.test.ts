import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Regression guard for the "row-level security policy violation" bug
 * users hit while creating their organization during onboarding.
 *
 * The `organizations` INSERT RLS policy is:
 *   WITH CHECK (owner_id = auth.uid())
 *
 * Plus a BEFORE INSERT trigger (force_org_owner) now stamps owner_id = auth.uid()
 * server-side. Both layers together mean: the client MUST send a valid
 * authenticated request, AND the payload should include owner_id so it
 * matches the policy at evaluation time.
 *
 * This test reads the Onboarding source and asserts the insert payload
 * includes owner_id — a fast, deterministic regression check that doesn't
 * require spinning up Postgres in CI.
 */
describe("Onboarding org creation payload", () => {
  it("includes owner_id so it satisfies the organizations RLS INSERT policy", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../pages/Onboarding.tsx"),
      "utf8",
    );
    // The .from("organizations").insert({ ... }) block must reference owner_id.
    const insertBlock = src.match(
      /\.from\(["']organizations["']\)\s*\.insert\(\{[^}]*\}\)/s,
    );
    expect(insertBlock, "expected an organizations.insert(...) call in Onboarding.tsx").not.toBeNull();
    expect(insertBlock![0]).toMatch(/owner_id\s*:\s*user\.id/);
  });
});

// Light mock so the test file doesn't accidentally import network-bound
// Supabase code if something resolves it transitively.
beforeEach(() => {
  vi.resetModules();
});
