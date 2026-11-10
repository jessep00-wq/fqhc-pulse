import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useResendCooldown, RESEND_COOLDOWN_SECONDS } from "./useResendCooldown";

afterEach(() => {
  vi.useRealTimers();
});

describe("resend confirmation cooldown", () => {
  it("is 60 seconds", () => {
    expect(RESEND_COOLDOWN_SECONDS).toBe(60);
  });

  it("blocks resending for 60 seconds, then allows it again", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useResendCooldown());
    expect(result.current.coolingDown).toBe(false);

    act(() => result.current.start());
    expect(result.current.remaining).toBe(60);
    expect(result.current.coolingDown).toBe(true);

    for (let i = 0; i < 59; i++) act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.remaining).toBe(1);
    expect(result.current.coolingDown).toBe(true);

    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.remaining).toBe(0);
    expect(result.current.coolingDown).toBe(false);
  });
});
