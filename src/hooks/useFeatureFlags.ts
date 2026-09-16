import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

export type AiFeatureFlag =
  | "ai_evidence_auditor"
  | "ai_measure_sentinel"
  | "ai_action_copilot"
  | "ai_executive_summary";

interface FlagRow {
  flag_key: string;
  organization_id: string | null;
  enabled: boolean;
}

/**
 * Resolves feature flags for the current workspace: an organization-level row
 * overrides the global default. The server re-checks every flag independently,
 * so this only governs what is shown.
 */
export function useFeatureFlags() {
  const { organization } = useOrg();
  const orgId = organization.id || null;

  const { data = [], isLoading } = useQuery({
    queryKey: ["feature_flags", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("flag_key, organization_id, enabled");
      if (error) return [] as FlagRow[];
      return (data ?? []) as FlagRow[];
    },
    staleTime: 60_000,
  });

  const isEnabled = (key: AiFeatureFlag) => {
    const orgRow = data.find((f) => f.flag_key === key && f.organization_id === orgId);
    if (orgRow) return orgRow.enabled;
    const globalRow = data.find((f) => f.flag_key === key && f.organization_id === null);
    return globalRow?.enabled ?? false;
  };

  return { isEnabled, loading: isLoading, flags: data };
}
