// Single source of truth for the public plan catalog. Both /pricing and the
// signup plan-summary card read from here so displayed prices can never drift.

export type Billing = "monthly" | "annual";
export type PlanId = "solo" | "multi" | "network";

export interface PlanFeature {
  text: string;
  locked?: boolean;
  lockedLabel?: string;
}

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  /** Displayed monthly price when billed monthly. */
  monthlyPrice: number;
  /** Displayed effective monthly price when billed annually. */
  annualMonthlyPrice: number;
  /** Total charged once per year on annual billing. */
  annualTotal: number;
  highlight?: boolean;
  badge?: string;
  features: PlanFeature[];
}

export const PLANS: Plan[] = [
  {
    id: "solo",
    name: "Solo Clinic",
    description: "One site, unlimited everything else.",
    monthlyPrice: 149,
    annualMonthlyPrice: 124,
    annualTotal: 1490,
    features: [
      { text: "1 clinic site" },
      { text: "Unlimited users — MAs, RNs, providers, QI staff" },
      { text: "Unlimited PDSA cycles" },
      { text: "UDS measure dashboards & SPC charts" },
      { text: "HRSA Audit Binder export" },
      { text: "Board report PDF export" },
      { text: "QI/QA committee & board reports" },
      { text: "Email support" },
      { text: "Network dashboard", locked: true, lockedLabel: "Available in Multi-Site" },
    ],
  },
  {
    id: "multi",
    name: "Multi-Site",
    description: "For health centers with 2–5 locations.",
    monthlyPrice: 349,
    annualMonthlyPrice: 291,
    annualTotal: 3490,
    highlight: true,
    badge: "Most Popular",
    features: [
      { text: "Up to 5 clinic sites" },
      { text: "Unlimited users — no per-seat fees" },
      { text: "Unlimited PDSA cycles" },
      { text: "Network dashboard & cross-site comparison" },
      { text: "UDS dashboards & SPC charts" },
      { text: "HRSA Audit Binder export" },
      { text: "Board report PDF export" },
      { text: "QI/QA committee & board reports" },
      { text: "Priority support" },
    ],
  },
  {
    id: "network",
    name: "Health Center Network",
    description: "For networks with 6+ sites or PCA/HCCN programs.",
    monthlyPrice: 699,
    annualMonthlyPrice: 582,
    annualTotal: 6990,
    features: [
      { text: "Unlimited clinic sites" },
      { text: "Unlimited users across the network" },
      { text: "Unlimited PDSA cycles" },
      { text: "Network-wide analytics & benchmarking" },
      { text: "Cross-site measure comparison" },
      { text: "All dashboards, charts & exports" },
      { text: "HRSA Audit Binder export" },
      { text: "Dedicated onboarding" },
      { text: "Priority support & SLA" },
    ],
  },
];

export const TRIAL_DAYS = 14;

export const lookupKey = (id: PlanId, billing: Billing) => `${id}_${billing}`;

export const usd = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

export interface PlanSelection {
  plan: Plan;
  billing: Billing;
  /** The Stripe lookup key for the selection. */
  lookupKey: string;
  /** Price shown per month for the chosen billing cycle. */
  monthlyDisplay: string;
  /** e.g. "$3,490 annually after trial" or "$349 monthly after trial". */
  billingTiming: string;
}

/**
 * Validate `?plan=&billing=` query params against the catalog. Accepts either
 * a lookup key ("multi_annual") or a bare plan id ("multi"). Returns null for
 * anything unrecognized so signup never shows a misleading summary.
 */
export function parsePlanSelection(
  planParam: string | null | undefined,
  billingParam: string | null | undefined,
): PlanSelection | null {
  if (!planParam) return null;
  const raw = planParam.trim().toLowerCase();
  const [idPart, billingPart] = raw.split("_");
  const plan = PLANS.find((p) => p.id === idPart);
  if (!plan) return null;

  const billingRaw = (billingParam ?? billingPart ?? "monthly").trim().toLowerCase();
  if (billingRaw !== "monthly" && billingRaw !== "annual") return null;
  const billing: Billing = billingRaw;

  const monthly = billing === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice;
  return {
    plan,
    billing,
    lookupKey: lookupKey(plan.id, billing),
    monthlyDisplay: `${usd(monthly)}/month`,
    billingTiming:
      billing === "annual"
        ? `${usd(plan.annualTotal)} annually after trial`
        : `${usd(plan.monthlyPrice)} monthly after trial`,
  };
}
