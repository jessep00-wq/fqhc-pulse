// Plan → monthly USD cents. Source of truth for admin MRR/ARR calculations.
// Mirrors the public pricing page (Solo $149 / Multi $349 / Network $699).
export const PLAN_MONTHLY_CENTS: Record<string, number> = {
  solo: 14900,
  multi: 34900,
  network: 69900,
};

export const PAID_PLANS = ["solo", "multi", "network"] as const;
export type PaidPlan = (typeof PAID_PLANS)[number];

export function planMonthly(plan: string | null | undefined): number {
  if (!plan) return 0;
  return PLAN_MONTHLY_CENTS[plan] ?? 0;
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function planLabel(plan: string | null | undefined): string {
  if (!plan) return "Free";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}
