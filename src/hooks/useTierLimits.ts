import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

export interface TierLimits {
  maxCycles: number;
  maxUsers: number;
  maxSites: number;
  watermarkExports: boolean;
  tier: "free" | "solo" | "multi" | "network";
}

const FREE_LIMITS: TierLimits = {
  maxCycles: 3,
  maxUsers: 1,
  maxSites: 1,
  watermarkExports: true,
  tier: "free",
};

// For now, all users are on free tier until payment is integrated
// This hook will be updated when Stripe/Paddle is added
export function useTierLimits() {
  const { organization } = useOrg();
  const orgId = organization.id;

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

  const limits = FREE_LIMITS; // Will check org subscription tier later

  return {
    limits,
    cycleCount,
    memberCount,
    canCreateCycle: cycleCount < limits.maxCycles,
    canInviteUser: memberCount < limits.maxUsers,
    cyclesRemaining: Math.max(0, limits.maxCycles - cycleCount),
    isFreeTier: limits.tier === "free",
  };
}
