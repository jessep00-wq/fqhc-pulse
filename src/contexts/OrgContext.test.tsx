import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { useOrg, OrgProvider } from "./OrgContext";

let mockUser: { id: string } | null = { id: "user-1" };
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, loading: false }),
}));

// Sequenced responses for maybeSingle() calls — alternates profiles / organizations.
const responses: Array<{ data: unknown; error: unknown }> = [];
function pushResponses(...r: typeof responses) {
  responses.push(...r);
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () =>
            table === "user_roles" ? { data: null, error: null } : responses.shift() ?? { data: null, error: null },
          in: () => ({
            maybeSingle: async () =>
              table === "user_roles" ? { data: null, error: null } : responses.shift() ?? { data: null, error: null },
          }),
        }),
      }),
    }),
  },
}));

function Probe({ onState }: { onState: (s: ReturnType<typeof useOrg>) => void }) {
  const s = useOrg();
  onState(s);
  return null;
}

describe("OrgContext", () => {
  beforeEach(() => {
    responses.length = 0;
    mockUser = { id: "user-1" };
  });

  it("sets hasOrg=true after a successful org fetch", async () => {
    pushResponses(
      { data: { organization_id: "org-1" }, error: null },
      { data: { id: "org-1", name: "Acme", npi: "", data_mode: "live" }, error: null },
    );
    let snap: ReturnType<typeof useOrg> | null = null;
    render(<OrgProvider><Probe onState={(s) => (snap = s)} /></OrgProvider>);
    await waitFor(() => expect(snap?.hasOrg).toBe(true));
    expect(snap?.organization.name).toBe("Acme");
  });

  it("keeps hasOrg=true (sticky) when a later refetch errors — no /onboarding bounce", async () => {
    pushResponses(
      { data: { organization_id: "org-1" }, error: null },
      { data: { id: "org-1", name: "Acme", npi: "", data_mode: "live" }, error: null },
    );
    let snap: ReturnType<typeof useOrg> | null = null;
    render(<OrgProvider><Probe onState={(s) => (snap = s)} /></OrgProvider>);
    await waitFor(() => expect(snap?.hasOrg).toBe(true));

    // Next refetch: profile query fails (RLS/network).
    pushResponses({ data: null, error: { message: "RLS denied" } });
    act(() => snap!.refetchOrg());
    await waitFor(() => expect(snap?.error).toBe("RLS denied"));
    expect(snap?.hasOrg).toBe(true);
  });

  it("sets hasOrg=false when the profile has no organization_id", async () => {
    pushResponses({ data: { organization_id: null }, error: null });
    let snap: ReturnType<typeof useOrg> | null = null;
    render(<OrgProvider><Probe onState={(s) => (snap = s)} /></OrgProvider>);
    await waitFor(() => expect(snap?.loading).toBe(false));
    expect(snap?.hasOrg).toBe(false);
  });
});
