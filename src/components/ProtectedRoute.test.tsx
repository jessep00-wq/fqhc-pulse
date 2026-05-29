import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

let auth = { session: null as unknown, loading: false };
let org = { hasOrg: false, loading: false };

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => auth,
}));
vi.mock("@/contexts/OrgContext", () => ({
  useOrg: () => org,
}));

import { ProtectedRoute } from "./ProtectedRoute";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/dashboard" element={<ProtectedRoute><div>DASH</div></ProtectedRoute>} />
        <Route path="/auth" element={<div>AUTH PAGE</div>} />
        <Route path="/onboarding" element={<div>ONBOARDING</div>} />
        <Route path="/" element={<div>HOME</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users to /auth (not /)", () => {
    auth = { session: null, loading: false };
    org = { hasOrg: false, loading: false };
    renderAt("/dashboard");
    expect(screen.getByText("AUTH PAGE")).toBeInTheDocument();
    expect(screen.queryByText("HOME")).not.toBeInTheDocument();
  });

  it("redirects authenticated users without org to /onboarding", () => {
    auth = { session: { user: { id: "u1" } }, loading: false };
    org = { hasOrg: false, loading: false };
    renderAt("/dashboard");
    expect(screen.getByText("ONBOARDING")).toBeInTheDocument();
  });

  it("renders children when authenticated and org exists", () => {
    auth = { session: { user: { id: "u1" } }, loading: false };
    org = { hasOrg: true, loading: false };
    renderAt("/dashboard");
    expect(screen.getByText("DASH")).toBeInTheDocument();
  });
});
