import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type OrgViewFilter = "active" | "archived" | "all";

export function useAdminOrgs(filter: OrgViewFilter = "active") {
  const queryClient = useQueryClient();

  const queryKey = ["admin_orgs", filter];

  const { data: orgs = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter === "active") {
        query = query.is("archived_at", null);
      } else if (filter === "archived") {
        query = query.not("archived_at", "is", null);
      }
      // "all" — no archived_at filter

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin_orgs"] });
    queryClient.invalidateQueries({ queryKey: ["admin_all_orgs"] });
    queryClient.invalidateQueries({ queryKey: ["admin_pipeline_orgs"] });
    queryClient.invalidateQueries({ queryKey: ["admin_billing_orgs"] });
    queryClient.invalidateQueries({ queryKey: ["admin_adoption_orgs"] });
    queryClient.invalidateQueries({ queryKey: ["admin_all_subscriptions"] });
    queryClient.invalidateQueries({ queryKey: ["admin_billing_subs"] });
    queryClient.invalidateQueries({ queryKey: ["admin_health_latest"] });
    queryClient.invalidateQueries({ queryKey: ["admin_adoption_health"] });
  };

  const archiveMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const { error } = await supabase
        .from("organizations")
        .update({ archived_at: new Date().toISOString() } as any)
        .eq("id", orgId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Organization archived"); invalidateAll(); },
    onError: (err: Error) => toast.error(`Archive failed: ${err.message}`),
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const { error } = await supabase
        .from("organizations")
        .update({ archived_at: null } as any)
        .eq("id", orgId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Organization restored"); invalidateAll(); },
    onError: (err: Error) => toast.error(`Restore failed: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", orgId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Organization deleted"); invalidateAll(); },
    onError: (err: Error) => toast.error(`Delete failed: ${err.message}`),
  });

  return {
    orgs,
    isLoading,
    archiveMutation,
    unarchiveMutation,
    deleteMutation,
  };
}
