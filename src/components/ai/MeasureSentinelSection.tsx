import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, RefreshCw, Radar } from "lucide-react";
import { toast } from "sonner";
import { SEVERITY_CLASS, SEVERITY_LABEL, SIGNAL_TYPE_LABEL } from "@/lib/ai/labels";
import type { FindingSeverity } from "@/lib/ai/evidenceRules";
import { refreshMeasureSignals } from "@/lib/ai/measureSentinel.functions";
import { explainMeasureSignal } from "@/lib/ai/measureSignals.functions";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useUserRole } from "@/hooks/useUserRole";
import { ActionCopilotDialog } from "./ActionCopilotDialog";
import { EvidenceStateBadge } from "./EvidenceStateBadge";

interface Signal {
  id: string;
  signal_type: string;
  severity: FindingSeverity;
  measure_id: string | null;
  pdsa_id: string | null;
  site_id: string | null;
  detection_rule: string;
  explanation: string | null;
  underlying_data: Record<string, unknown> | null;
  detected_at: string;
  status: string;
  assigned_to: string | null;
}

export function MeasureSentinelSection() {
  const { isEnabled, loading: flagsLoading } = useFeatureFlags();
  const { isOrgAdmin, isAdmin } = useUserRole();
  const qc = useQueryClient();
  const refresh = useServerFn(refreshMeasureSignals);
  const explain = useServerFn(explainMeasureSignal);

  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copilotFor, setCopilotFor] = useState<Signal | null>(null);

  const canAct = isOrgAdmin || isAdmin;

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["measure_signals"],
    enabled: isEnabled("ai_measure_sentinel"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("measure_signals")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as Signal[];
    },
  });

  const filtered = useMemo(
    () =>
      signals.filter(
        (s) =>
          (severityFilter === "all" || s.severity === severityFilter) &&
          (typeFilter === "all" || s.signal_type === typeFilter) &&
          (statusFilter === "all" || s.status === statusFilter),
      ),
    [signals, severityFilter, typeFilter, statusFilter],
  );

  const types = useMemo(
    () => Array.from(new Set(signals.map((s) => s.signal_type))),
    [signals],
  );

  if (flagsLoading || !isEnabled("ai_measure_sentinel")) return null;

  const setStatus = async (signal: Signal, status: string) => {
    const patch: Record<string, unknown> = { status };
    if (status === "snoozed") {
      const until = new Date();
      until.setDate(until.getDate() + 14);
      patch.snoozed_until = until.toISOString();
    }
    const { error } = await supabase
      .from("measure_signals")
      .update(patch as never)
      .eq("id", signal.id);
    if (error) {
      toast.error("That change could not be saved.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["measure_signals"] });
  };

  const handleRefresh = async () => {
    setBusyId("refresh");
    try {
      const res = await refresh({ data: undefined as never });
      if (!res.ok) toast.error(res.error);
      else {
        qc.invalidateQueries({ queryKey: ["measure_signals"] });
        toast.success(
          res.created > 0 ? `${res.created} new signal(s) detected` : "No new signals",
        );
      }
    } catch {
      toast.error("Signals could not be refreshed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleExplain = async (signal: Signal) => {
    setBusyId(signal.id);
    try {
      const res = await explain({ data: { signalId: signal.id } });
      if (!res.ok) toast.error(res.error);
      else qc.invalidateQueries({ queryKey: ["measure_signals"] });
    } catch {
      toast.error("The explanation could not be generated.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radar className="h-4 w-4 text-primary" />
          Measure Sentinel
        </CardTitle>
        {canAct && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={busyId === "refresh"}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${busyId === "refresh" ? "animate-spin" : ""}`}
            />
            Check for signals
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="snoozed">Snoozed</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
              <SelectItem value="all">All statuses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-[220px] text-xs">
              <SelectValue placeholder="Signal type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All signal types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {SIGNAL_TYPE_LABEL[t] ?? t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No signals match these filters.
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <div key={s.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={`text-[11px] ${SEVERITY_CLASS[s.severity]}`}>
                        {SEVERITY_LABEL[s.severity]}
                      </Badge>
                      <Badge variant="secondary" className="text-[11px]">
                        {s.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium">
                      {SIGNAL_TYPE_LABEL[s.signal_type] ?? s.signal_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.measure_id ? `${s.measure_id} · ` : ""}Detected{" "}
                      {new Date(s.detected_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Collapsible className="mt-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      <ChevronDown className="mr-1 h-3.5 w-3.5" />
                      Detail
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-2 text-sm">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">System rule: </span>
                      {s.detection_rule}
                    </p>
                    {s.underlying_data && (
                      <pre className="overflow-x-auto rounded bg-muted p-2 text-[11px]">
                        {JSON.stringify(s.underlying_data, null, 2)}
                      </pre>
                    )}
                    {s.explanation ? (
                      <div className="space-y-1">
                        <EvidenceStateBadge state="inferred" />
                        <p className="text-sm text-muted-foreground">{s.explanation}</p>
                      </div>
                    ) : (
                      canAct && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={busyId === s.id}
                          onClick={() => handleExplain(s)}
                        >
                          Explain in plain language
                        </Button>
                      )
                    )}
                    {canAct && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setStatus(s, "investigating")}
                        >
                          Investigate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setStatus(s, "snoozed")}
                        >
                          Snooze 14 days
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setStatus(s, "dismissed")}
                        >
                          Dismiss
                        </Button>
                        {isEnabled("ai_action_copilot") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setCopilotFor(s)}
                          >
                            Explore next action
                          </Button>
                        )}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {copilotFor && (
        <ActionCopilotDialog
          open={!!copilotFor}
          onOpenChange={(o) => !o && setCopilotFor(null)}
          signalId={copilotFor.id}
          subjectLabel={SIGNAL_TYPE_LABEL[copilotFor.signal_type] ?? copilotFor.signal_type}
        />
      )}
    </Card>
  );
}
