// Detects whether we're talking to Stripe sandbox or live based on the
// publishable token Lovable injects per build.
export type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function getStripeEnvironment(): StripeEnv {
  return clientToken?.startsWith("pk_live_") ? "live" : "sandbox";
}

export function isTestMode(): boolean {
  return getStripeEnvironment() === "sandbox";
}
