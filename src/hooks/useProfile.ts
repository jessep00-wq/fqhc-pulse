import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProfileSummary {
  id: string;
  full_name: string | null;
  staff_role: string | null;
  organization_id: string | null;
}

/**
 * The signed-in user's profile row.
 *
 * The auth token is NOT a reliable source for display name: OAuth paths,
 * restored sessions, and admin-minted sessions can all arrive without
 * `user_metadata.full_name`. `profiles.full_name` is the durable record.
 */
export function useProfile() {
  const { user } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, staff_role, organization_id")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ProfileSummary | null;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });

  const metadataName =
    typeof user?.user_metadata?.full_name === "string"
      ? (user.user_metadata.full_name as string)
      : null;

  const fullName = query.data?.full_name?.trim() || metadataName?.trim() || null;
  const firstName =
    fullName?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  return { profile: query.data ?? null, fullName, firstName, loading: query.isLoading };
}
