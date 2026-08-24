import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

export interface OrgSite {
  id: string;
  name: string;
}

/**
 * Sites belonging to the current organization. Single-site orgs have none,
 * in which case every site selector hides itself.
 */
export function useSites() {
  const { organization } = useOrg();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["sites", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("id, name")
        .eq("organization_id", orgId as string)
        .order("name");
      if (error) throw error;
      return (data ?? []) as OrgSite[];
    },
    enabled: !!orgId,
  });

  return { sites: query.data ?? [], isLoading: query.isLoading };
}
