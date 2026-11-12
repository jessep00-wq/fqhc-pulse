import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Current calendar year, the measurement year goals are set for. */
export const currentMeasurementYear = () => new Date().getFullYear();

/** Fetches this year's measure goals for the org as measure_id -> goal_value. */
export function useMeasureGoals(orgId: string | null | undefined) {
  const year = currentMeasurementYear();
  return useQuery({
    queryKey: ["measure_goals", orgId, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("measure_goals")
        .select("measure_id, goal_value")
        .eq("organization_id", orgId!)
        .eq("measurement_year", year);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data ?? []) map[row.measure_id] = Number(row.goal_value);
      return map;
    },
    enabled: !!orgId,
  });
}
