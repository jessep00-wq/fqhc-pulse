import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface RunRow {
  id: string;
  organization_id: string;
  user_id: string | null;
  feature_type: string;
  entity_type: string | null;
  entity_id: string | null;
  model_name: string | null;
  prompt_version: string | null;
  status: string;
  latency_ms: number | null;
  created_at: string;
}

const FEATURE_LABEL: Record<string, string> = {
  evidence_auditor: "Evidence Auditor",
  measure_sentinel: "Measure Sentinel",
  action_copilot: "Action Copilot",
  executive_summary: "Executive Summary",
};

const STATUS_CLASS: Record<string, string> = {
  succeeded: "bg-success/10 text-success border-success/30",
  degraded: "bg-warning/10 text-warning border-warning/30",
  partial: "bg-warning/10 text-warning border-warning/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  running: "bg-muted text-muted-foreground border-border",
};

export default function AdminAiActivity() {
  const runsQuery = useQuery({
    queryKey: ["admin_ai_runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as RunRow[];
    },
  });

  const flagsQuery = useQuery({
    queryKey: ["admin_feature_flags"],
    queryFn: async () => {
      const { data } = await supabase
        .from("feature_flags")
        .select("id, flag_key, enabled, organization_id")
        .is("organization_id", null)
        .order("flag_key");
      return data ?? [];
    },
  });

  const outcomeQuery = useQuery({
    queryKey: ["admin_ai_finding_outcomes"],
    queryFn: async () => {
      const { data } = await supabase.from("ai_findings").select("status");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((f) => {
        const key = (f.status as string) ?? "unknown";
        counts[key] = (counts[key] ?? 0) + 1;
      });
      return counts;
    },
  });

  const feedbackQuery = useQuery({
    queryKey: ["admin_ai_feedback"],
    queryFn: async () => {
      const { data } = await supabase.from("ai_feedback").select("rating");
      const up = (data ?? []).filter((f) => f.rating === "up").length;
      const down = (data ?? []).filter((f) => f.rating === "down").length;
      return { up, down };
    },
  });

  const toggleFlag = async (id: string, enabled: boolean) => {
    const { error } = await supabase.from("feature_flags").update({ enabled }).eq("id", id);
    if (error) {
      toast.error("That switch could not be changed.");
      return;
    }
    toast.success(enabled ? "Feature turned on" : "Feature turned off");
    flagsQuery.refetch();
  };

  const runs = runsQuery.data ?? [];
  const failures = runs.filter((r) => r.status === "failed").length;
  const avgLatency =
    runs.filter((r) => r.latency_ms).reduce((a, r) => a + (r.latency_ms ?? 0), 0) /
    Math.max(1, runs.filter((r) => r.latency_ms).length);

  return (
    <div className="space-y-6 p-6">
      <Helmet>
        <title>AI Activity — MeasureWise Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Activity</h1>
        <p className="text-muted-foreground">
          Every AI run across all workspaces, with feature switches and outcomes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Runs (latest 200)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{runs.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed runs</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{failures}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average response time</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {Number.isFinite(avgLatency) ? `${Math.round(avgLatency / 100) / 10}s` : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Feedback</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {feedbackQuery.data ? `${feedbackQuery.data.up} / ${feedbackQuery.data.down}` : "—"}
            <span className="ml-2 text-xs font-normal text-muted-foreground">helpful / not</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature switches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {flagsQuery.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            (flagsQuery.data ?? []).map((f) => (
              <div key={f.id as string} className="flex items-center justify-between gap-4">
                <Label htmlFor={`flag-${f.id}`} className="text-sm">
                  {FEATURE_LABEL[(f.flag_key as string).replace("ai_", "")] ??
                    (f.flag_key as string)}
                </Label>
                <Switch
                  id={`flag-${f.id}`}
                  checked={!!f.enabled}
                  onCheckedChange={(v) => toggleFlag(f.id as string, v)}
                />
              </div>
            ))
          )}
          <p className="text-xs text-muted-foreground">
            Turning a switch off stops the feature immediately for every workspace — no release
            needed.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Finding outcomes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(outcomeQuery.data ?? {}).map(([status, count]) => (
            <Badge key={status} variant="outline">
              {status}: {count}
            </Badge>
          ))}
          {Object.keys(outcomeQuery.data ?? {}).length === 0 && (
            <p className="text-sm text-muted-foreground">No findings recorded yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent runs</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {runsQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No AI runs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Prompt</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs">
                      {FEATURE_LABEL[r.feature_type] ?? r.feature_type}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[11px] ${STATUS_CLASS[r.status] ?? ""}`}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{r.model_name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{r.prompt_version ?? "—"}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {r.latency_ms ? `${(r.latency_ms / 1000).toFixed(1)}s` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
