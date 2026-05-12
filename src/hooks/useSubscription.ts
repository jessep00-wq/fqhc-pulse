import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { getStripeEnvironment } from "@/lib/stripe";
import { useUserRole } from "@/hooks/useUserRole";

export type PlanTier = "free" | "solo" | "multi" | "network";

export interface OrgSubscription {
  id: string;
  organization_id: string;
  plan: PlanTier;
  status: string;
  stripe_price_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  environment: string;
}

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

export function useSubscription() {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const env = getStripeEnvironment();

  const query = useQuery({
    queryKey: ["org_subscription", orgId, env],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("organization_id", orgId!)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as OrgSubscription | null) ?? null;
    },
    enabled: !!orgId,
  });

  const sub = query.data;
  const plan: PlanTier = (sub?.plan as PlanTier) ?? "free";
  const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end) : null;
  const trialEndsAt = sub?.trial_end ? new Date(sub.trial_end) : null;
  const now = new Date();

  const isPaid =
    !!sub &&
    plan !== "free" &&
    (ACTIVE_STATUSES.has(sub.status) ||
      (sub.status === "canceled" && periodEnd && periodEnd > now));

  const isTrialing =
    !isPaid && plan === "free" && !!trialEndsAt && trialEndsAt > now;

  const isLocked = !isPaid && !isTrialing;

  const daysLeftInTrial =
    trialEndsAt && trialEndsAt > now
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86_400_000))
      : null;

  return {
    ...query,
    subscription: sub,
    plan,
    isActive: isPaid,
    isPaid,
    isTrialing,
    isLocked,
    trialEndsAt,
    daysLeftInTrial,
    cancelAtPeriodEnd: !!sub?.cancel_at_period_end,
    periodEnd,
  };
}
