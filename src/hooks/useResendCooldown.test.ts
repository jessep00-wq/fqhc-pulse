import { describe, it, expect } from "vitest";
import { cooldownRemaining, RESEND_COOLDOWN_SECONDS } from "./useResendCooldown";

describe("resend confirmation cooldown", () => {
  it("is 60 seconds", () => {
    expect(RESEND_COOLDOWN_SECONDS).toBe(60);
  });

  it("allows resending before any email was sent", () => {
    expect(cooldownRemaining(null, 1_000_000)).toBe(0);
  });

  it("blocks resending for the full 60 seconds after a send", () => {
    const sentAt = 1_000_000;
    expect(cooldownRemaining(sentAt, sentAt)).toBe(60);
    expect(cooldownRemaining(sentAt, sentAt + 59_000)).toBe(1);
    expect(cooldownRemaining(sentAt, sentAt + 59_999)).toBe(1);
  });

  it("allows resending again at 60 seconds", () => {
    const sentAt = 1_000_000;
    expect(cooldownRemaining(sentAt, sentAt + 60_000)).toBe(0);
    expect(cooldownRemaining(sentAt, sentAt + 120_000)).toBe(0);
  });
});
