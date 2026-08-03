import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RecordRevision } from "@/lib/cycleHistory";

/** Reads the immutable revision log for a cycle (and optionally its tasks). */
export function useRecordHistory(
  recordType: "pdsa_cycle" | "task",
  recordIds: string[],
  organizationId?: string,
  enabled = true,
) {
  const ids = [...recordIds].sort();
  return useQuery({
    queryKey: ["record-revisions", recordType, organizationId, ids.join(",")],
    queryFn: async () => {
      if (ids.length === 0) return [] as RecordRevision[];
      const { data, error } = await supabase
        .from("record_revisions")
        .select("id,record_type,record_id,field_name,old_value,new_value,changed_by,created_at")
        .eq("record_type", recordType)
        .in("record_id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as RecordRevision[];
    },
    enabled: enabled && ids.length > 0 && !!organizationId,
  });
}
