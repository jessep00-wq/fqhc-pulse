import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

let auth: { session: unknown; loading: boolean } = { session: null, loading: false };
let org: { hasOrg: boolean; loading: boolean } = { hasOrg: false, loading: false };

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => auth,
}));
vi.mock("@/contexts/OrgContext", () => ({
  useOrg: () => org,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  },
}));
vi.mock("@/integrations/lovable/index", () => ({
  lovable: { track: vi.fn() },
}));
vi.mock("@/lib/planIntent", () => ({
  captureFromUrl: vi.fn(),
  readPlanIntent: () => null,
  appendPlanToUrl: (s: string) => s,
}));
vi.mock("@/lib/trackEvent", () => ({
  trackAnonEvent: vi.fn(),
  trackEvent: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

import Auth from "./Auth";

function renderAuth() {
  return render(
    <MemoryRouter initialEntries={["/auth"]}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<div>DASH</div>} />
        <Route path="/onboarding" element={<div>ONBOARDING</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Auth page redirects", () => {
  beforeEach(() => {
    auth = { session: null, loading: false };
    org = { hasOrg: false, loading: false };
  });

  it("renders the auth form when unauthenticated", () => {
    renderAuth();
    expect(screen.queryByText("DASH")).not.toBeInTheDocument();
    expect(screen.queryByText("ONBOARDING")).not.toBeInTheDocument();
  });

  it("redirects authenticated users with an org to /dashboard", () => {
    auth = { session: { user: { id: "u1" } }, loading: false };
    org = { hasOrg: true, loading: false };
    renderAuth();
    expect(screen.getByText("DASH")).toBeInTheDocument();
    expect(screen.queryByText("ONBOARDING")).not.toBeInTheDocument();
  });

  it("redirects to /dashboard (never /onboarding) when hasOrg is transiently false", () => {
    // Race-condition snapshot: session present, both loadings false, hasOrg=false.
    auth = { session: { user: { id: "u1" } }, loading: false };
    org = { hasOrg: false, loading: false };
    renderAuth();
    expect(screen.getByText("DASH")).toBeInTheDocument();
    expect(screen.queryByText("ONBOARDING")).not.toBeInTheDocument();
  });

  it("shows spinner while orgLoading, then lands on /dashboard without flashing /onboarding", async () => {
    auth = { session: { user: { id: "u1" } }, loading: false };
    org = { hasOrg: false, loading: true };
    const { rerender } = renderAuth();
    // Spinner phase — no redirect, no onboarding flash.
    expect(screen.queryByText("ONBOARDING")).not.toBeInTheDocument();
    expect(screen.queryByText("DASH")).not.toBeInTheDocument();

    // Org finishes loading with hasOrg still false (the race shape).
    org = { hasOrg: false, loading: false };
    rerender(
      <MemoryRouter initialEntries={["/auth"]}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<div>DASH</div>} />
          <Route path="/onboarding" element={<div>ONBOARDING</div>} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("DASH")).toBeInTheDocument());
    expect(screen.queryByText("ONBOARDING")).not.toBeInTheDocument();
  });

  it("shows spinner while authLoading (no auth form flash, no redirect)", () => {
    auth = { session: { user: { id: "u1" } }, loading: true };
    org = { hasOrg: false, loading: false };
    renderAuth();
    expect(screen.queryByText("DASH")).not.toBeInTheDocument();
    expect(screen.queryByText("ONBOARDING")).not.toBeInTheDocument();
  });
});
