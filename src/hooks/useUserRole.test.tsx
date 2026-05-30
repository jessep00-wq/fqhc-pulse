import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const eqMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: eqMock }),
    }),
  },
}));

let currentUser: { id: string } | null = null;
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: currentUser }),
}));

import { useUserRole } from "./useUserRole";

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useUserRole", () => {
  beforeEach(() => {
    eqMock.mockReset();
    currentUser = null;
  });

  it("returns empty roles and does not crash when user is undefined", () => {
    currentUser = null;
    const { result } = renderHook(() => useUserRole(), { wrapper });
    expect(result.current.roles).toEqual([]);
    expect(result.current.isFounderAdmin).toBe(false);
    expect(eqMock).not.toHaveBeenCalled();
  });

  it("queries roles when user id is present", async () => {
    currentUser = { id: "user-1" };
    eqMock.mockResolvedValue({ data: [{ role: "founder_admin" }], error: null });
    const { result } = renderHook(() => useUserRole(), { wrapper });
    await waitFor(() => expect(result.current.roles.length).toBe(1));
    expect(result.current.isFounderAdmin).toBe(true);
    expect(eqMock).toHaveBeenCalledWith("user_id", "user-1");
  });
});
