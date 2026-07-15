import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

type AuthCallback = (event: string, session: unknown) => void;
const h = vi.hoisted(() => ({
  capturedCb: null as AuthCallback | null,
  invokeMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: AuthCallback) => {
        h.capturedCb = cb;
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signOut: vi.fn(),
    },
    from: () => ({
      update: () => ({ eq: () => ({ then: (fn: () => void) => fn() }) }),
    }),
    functions: { invoke: h.invokeMock },
  },
}));
vi.mock("@/lib/trackEvent", () => ({ trackEvent: vi.fn() }));

import { AuthProvider } from "./AuthContext";

const SESSION = { user: { id: "user-42", email: "x@y.z" } };
const WELCOME_KEY = "mw_welcome_sent_user-42";

describe("AuthContext welcome email flag", () => {
  beforeEach(() => {
    h.capturedCb = null;
    h.invokeMock.mockReset();
    window.localStorage.clear();
  });

  it("sets the localStorage flag ONLY after send-welcome-email resolves successfully", async () => {
    h.invokeMock.mockResolvedValue({ error: null });
    render(<AuthProvider><div /></AuthProvider>);
    h.capturedCb!("SIGNED_IN", SESSION);

    expect(window.localStorage.getItem(WELCOME_KEY)).toBeNull();
    await waitFor(() => {
      expect(window.localStorage.getItem(WELCOME_KEY)).toBe("1");
    });
    expect(h.invokeMock).toHaveBeenCalledWith("send-welcome-email", { body: { user_id: "user-42" } });
  });

  it("does NOT set the flag when the welcome-email call errors", async () => {
    h.invokeMock.mockResolvedValue({ error: { message: "boom" } });
    render(<AuthProvider><div /></AuthProvider>);
    h.capturedCb!("SIGNED_IN", SESSION);
    await waitFor(() => expect(h.invokeMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    expect(window.localStorage.getItem(WELCOME_KEY)).toBeNull();
  });

  it("does NOT set the flag when the welcome-email call throws", async () => {
    h.invokeMock.mockRejectedValue(new Error("network"));
    render(<AuthProvider><div /></AuthProvider>);
    h.capturedCb!("SIGNED_IN", SESSION);
    await waitFor(() => expect(h.invokeMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    expect(window.localStorage.getItem(WELCOME_KEY)).toBeNull();
  });
});
