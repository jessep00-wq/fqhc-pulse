import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

interface SiteOption {
  id: string;
  name: string;
}

export function useSiteOptions(): SiteOption[] {
  const { organization } = useOrg();
  const orgId = organization?.id;

  const { data = [] } = useQuery({
    queryKey: ["sites", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("id,name")
        .eq("organization_id", orgId!)
        .order("name");
      if (error) throw error;
      return (data ?? []) as SiteOption[];
    },
    staleTime: 300_000,
  });

  return data;
}
