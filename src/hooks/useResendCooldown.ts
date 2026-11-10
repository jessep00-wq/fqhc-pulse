import { useCallback, useEffect, useState } from "react";

/** Seconds a visitor must wait between "Resend confirmation email" clicks. */
export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Countdown used to rate-limit resend buttons on the client. `start()` begins
 * a fresh countdown; `remaining` is 0 when the button may be used again.
 */
export function useResendCooldown(seconds: number = RESEND_COOLDOWN_SECONDS) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const start = useCallback(() => setRemaining(seconds), [seconds]);

  return { remaining, coolingDown: remaining > 0, start };
}
