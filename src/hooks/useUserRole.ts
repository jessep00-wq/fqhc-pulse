import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "founder_admin" | "internal_support" | "org_admin" | "standard_user";

export function useUserRole() {
  const { user } = useAuth();

  const userId = user?.id;
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["user_roles", userId],
    queryFn: async () => {
      if (!userId) return [] as AppRole[];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (error) return [];
      return data.map((r) => r.role as AppRole);
    },
    enabled: !!userId,
  });

  return {
    roles,
    isFounderAdmin: roles.includes("founder_admin"),
    isInternalSupport: roles.includes("internal_support"),
    isAdmin: roles.includes("founder_admin") || roles.includes("internal_support"),
    loading: isLoading,
  };
}
