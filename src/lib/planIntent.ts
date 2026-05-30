// Plan intent relay: persists the priceId the user selected on /pricing
// through the auth + onboarding flow so we can auto-launch Stripe checkout
// once the workspace is ready.

const KEY = "mw_plan_intent";

export type PlanIntent = {
  priceId: string;
  billing?: "monthly" | "annual";
  ts: number;
};

const MAX_AGE_MS = 1000 * 60 * 60 * 24; // 24h
const VALID_PRICE = /^[a-zA-Z0-9_-]+$/;

export function savePlanIntent(priceId: string, billing?: "monthly" | "annual") {
  if (!priceId || !VALID_PRICE.test(priceId)) return;
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ priceId, billing, ts: Date.now() } satisfies PlanIntent)
    );
  } catch {
    // sessionStorage may be unavailable (SSR, private mode); ignore.
  }
}

export function readPlanIntent(): PlanIntent | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlanIntent;
    if (!parsed?.priceId || !VALID_PRICE.test(parsed.priceId)) return null;
    if (Date.now() - parsed.ts > MAX_AGE_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPlanIntent() {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** Capture `plan` / `billing` from the current URL into sessionStorage. */
export function captureFromUrl(search: string | URLSearchParams) {
  const params =
    typeof search === "string" ? new URLSearchParams(search) : search;
  const priceId = params.get("plan");
  const billingRaw = params.get("billing");
  if (priceId && VALID_PRICE.test(priceId)) {
    const billing =
      billingRaw === "annual" || billingRaw === "monthly" ? billingRaw : undefined;
    savePlanIntent(priceId, billing);
  }
}

/** Append plan/billing query params to a URL (string). Returns the new URL. */
export function appendPlanToUrl(url: string, intent?: PlanIntent | null): string {
  const i = intent ?? readPlanIntent();
  if (!i) return url;
  try {
    const u = new URL(url, window.location.origin);
    u.searchParams.set("plan", i.priceId);
    if (i.billing) u.searchParams.set("billing", i.billing);
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    const billing = i.billing ? `&billing=${i.billing}` : "";
    return `${url}${sep}plan=${encodeURIComponent(i.priceId)}${billing}`;
  }
}
