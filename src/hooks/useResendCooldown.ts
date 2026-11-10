import { useCallback, useEffect, useState } from "react";

/** Seconds a visitor must wait between "Resend confirmation email" clicks. */
export const RESEND_COOLDOWN_SECONDS = 60;

/** Whole seconds left in a cooldown that began at `startedAtMs`. */
export function cooldownRemaining(
  startedAtMs: number | null,
  nowMs: number,
  seconds: number = RESEND_COOLDOWN_SECONDS,
): number {
  if (startedAtMs == null) return 0;
  return Math.max(0, Math.ceil((startedAtMs + seconds * 1000 - nowMs) / 1000));
}

/**
 * Countdown used to rate-limit resend buttons on the client. `start()` begins
 * a fresh countdown; `remaining` is 0 when the button may be used again.
 */
export function useResendCooldown(seconds: number = RESEND_COOLDOWN_SECONDS) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const remaining = cooldownRemaining(startedAt, now, seconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(id);
  }, [remaining, now]);

  const start = useCallback(() => {
    const t = Date.now();
    setStartedAt(t);
    setNow(t);
  }, []);

  return { remaining, coolingDown: remaining > 0, start };
}
