import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Target, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { currentMeasurementYear } from "@/hooks/useMeasureGoals";
import { UDS_MEASURE_LIST } from "@/data/udsMeasures";

/** Staff roles that may edit goals (mirrors the database rule). */
export const GOAL_EDITOR_STAFF_ROLES = ["QI Manager", "Quality Director"];

interface TrendRow {
  measure_id: string;
  month: string;
  value: number | string;
}

interface GoalRow {
  id: string;
  measure_id: string;
  goal_value: number;
  set_by: string | null;
  updated_at: string;
}

const fmtPct = (n: number) => `${Number.isInteger(n) ? n : Number(n.toFixed(1))}%`;

export function MeasureGoalsSection({ trends, staffRole }: { trends: TrendRow[]; staffRole: string | null }) {
  const { organization } = useOrg();
  const { user } = useAuth();
  const { roles } = useUserRole();
  const queryClient = useQueryClient();
  const orgId = organization.id;
  const year = currentMeasurementYear();

  const canEdit =
    roles.includes("founder_admin") ||
    roles.includes("org_admin") ||
    (!!staffRole && GOAL_EDITOR_STAFF_ROLES.includes(staffRole));

  const { data: goalRows = [], isLoading } = useQuery({
    queryKey: ["measure_goals", orgId, year, "rows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("measure_goals")
        .select("id, measure_id, goal_value, set_by, updated_at")
        .eq("organization_id", orgId)
        .eq("measurement_year", year);
      if (error) throw error;
      return (data ?? []) as GoalRow[];
    },
    enabled: !!orgId,
  });

  const { data: orgProfiles = [] } = useQuery({
    queryKey: ["org_profiles", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,staff_role")
        .eq("organization_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  const goalsByMeasure = useMemo(
    () => Object.fromEntries(goalRows.map((g) => [g.measure_id, g])) as Record<string, GoalRow>,
    [goalRows],
  );

  const latestByMeasure = useMemo(() => {
    const out: Record<string, { month: string; value: number }> = {};
    for (const t of trends) {
      const prev = out[t.measure_id];
      if (!prev || t.month > prev.month) out[t.measure_id] = { month: t.month, value: Number(t.value) };
    }
    return out;
  }, [trends]);

  const nameFor = (id: string | null) => {
    if (!id) return "A team member";
    return orgProfiles.find((p) => p.id === id)?.full_name || "A team member";
  };

  const saveGoal = useMutation({
    mutationFn: async ({ measureId, value }: { measureId: string; value: number | null }) => {
      if (value === null) {
        const { error } = await supabase
          .from("measure_goals")
          .delete()
          .eq("organization_id", orgId)
          .eq("measure_id", measureId)
          .eq("measurement_year", year);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("measure_goals").upsert(
        {
          organization_id: orgId,
          measure_id: measureId,
          measurement_year: year,
          goal_value: value,
          set_by: user?.id ?? null,
        },
        { onConflict: "organization_id,measure_id,measurement_year" },
      );
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["measure_goals"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding_checklist"] });
      toast.success(vars.value === null ? "Goal cleared" : "Goal saved");
    },
    onError: (err: Error) => toast.error(err.message || "Couldn't save the goal"),
  });

  const handleBlur = (measureId: string, input: HTMLInputElement) => {
    const current = goalsByMeasure[measureId] ? Number(goalsByMeasure[measureId].goal_value) : null;
    const raw = input.value.trim();
    const next = raw === "" ? null : Number(raw);
    if (next !== null && (!Number.isFinite(next) || next < 0 || next > 100)) {
      toast.error("Goals must be a percentage between 0 and 100.");
      input.value = current === null ? "" : String(current);
      return;
    }
    if (next === current) return;
    saveGoal.mutate({ measureId, value: next });
  };

  return (
    <Card id="measure-goals" className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" /> Measure Goals
          {saveGoal.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </CardTitle>
        <CardDescription>
          Set your {year} goal for each UDS measure. Where no goal is set, MeasureWise compares you to the HRSA UDS
          2024 national average.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!canEdit && (
          <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Only QI Managers, Quality Directors, and account admins can edit goals.
          </p>
        )}
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Measure</TableHead>
                <TableHead className="text-right">Latest</TableHead>
                <TableHead className="text-right">National avg (UDS 2024)</TableHead>
                <TableHead className="text-right">Your {year} goal</TableHead>
                <TableHead>Last set by · date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {UDS_MEASURE_LIST.map((m) => {
                const goal = goalsByMeasure[m.id];
                const latest = latestByMeasure[m.id];
                const goalValue = goal ? Number(goal.goal_value) : null;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">
                      <span className="font-medium">{m.id}</span>
                      <span className="text-muted-foreground"> · {m.short}</span>
                      {m.inverse && <span className="block text-muted-foreground">(lower is better)</span>}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {latest ? fmtPct(latest.value) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{fmtPct(m.benchmark.value)}</TableCell>
                    <TableCell className="text-right">
                      {canEdit ? (
                        <Input
                          key={`${m.id}-${goalValue ?? "none"}`}
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          inputMode="decimal"
                          aria-label={`${year} goal for ${m.short}`}
                          className="ml-auto h-8 w-24 text-right text-xs"
                          defaultValue={goalValue ?? ""}
                          placeholder={String(m.benchmark.value)}
                          disabled={isLoading}
                          onBlur={(e) => handleBlur(m.id, e.currentTarget)}
                        />
                      ) : (
                        <span className="text-xs tabular-nums">{goalValue !== null ? fmtPct(goalValue) : "Not set"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {goal ? `${nameFor(goal.set_by)} · ${format(new Date(goal.updated_at), "MMM d, yyyy")}` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default MeasureGoalsSection;
