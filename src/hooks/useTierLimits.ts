import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useSubscription, type PlanTier } from "@/hooks/useSubscription";

export interface TierLimits {
  maxCycles: number;
  maxUsers: number;
  maxSites: number;
  watermarkExports: boolean;
  tier: PlanTier;
}

const LIMITS_BY_TIER: Record<PlanTier, TierLimits> = {
  free: { maxCycles: 3, maxUsers: 1, maxSites: 1, watermarkExports: true, tier: "free" },
  solo: { maxCycles: Infinity, maxUsers: Infinity, maxSites: 1, watermarkExports: false, tier: "solo" },
  multi: { maxCycles: Infinity, maxUsers: Infinity, maxSites: 5, watermarkExports: false, tier: "multi" },
  network: { maxCycles: Infinity, maxUsers: Infinity, maxSites: Infinity, watermarkExports: false, tier: "network" },
};

const LOCKED_LIMITS: TierLimits = {
  maxCycles: 0,
  maxUsers: 0,
  maxSites: 0,
  watermarkExports: true,
  tier: "free",
};

export function useTierLimits() {
  const { organization } = useOrg();
  const orgId = organization.id;
  const { plan, isLocked, isTrialing, isPaid } = useSubscription();

  const { data: cycleCount = 0 } = useQuery({
    queryKey: ["pdsa_cycle_count", orgId],
    queryFn: async () => {
      const { count } = await supabase
        .from("pdsa_cycles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .neq("status", "completed");
      return count ?? 0;
    },
    enabled: !!orgId,
  });

  const { data: memberCount = 1 } = useQuery({
    queryKey: ["org_member_count", orgId],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId);
      return count ?? 1;
    },
    enabled: !!orgId,
  });

  // During trial, give Solo-equivalent access (full features, single site).
  const effectivePlan: PlanTier = isPaid ? plan : isTrialing ? "solo" : "free";
  const limits: TierLimits = isLocked ? LOCKED_LIMITS : LIMITS_BY_TIER[effectivePlan];

  return {
    limits,
    cycleCount,
    memberCount,
    canCreateCycle: !isLocked && cycleCount < limits.maxCycles,
    canInviteUser: !isLocked && memberCount < limits.maxUsers,
    cyclesRemaining: Math.max(0, limits.maxCycles - cycleCount),
    isFreeTier: effectivePlan === "free",
    isTrialing,
    isLocked,
  };
}
