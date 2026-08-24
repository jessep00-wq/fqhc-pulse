import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CompletenessRing } from "./CompletenessRing";
import { ArrowRight, GitBranch } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChainCycle {
  id: string;
  title: string;
  status: string;
  start_date: string | null;
  created_at: string;
  baseline_rate: number | null;
  actual_outcome: string | null;
  next_cycle_decision: string | null;
  completeness_score: number | null;
}

const DECISION_TONE: Record<string, string> = {
  adopt: "bg-success/15 text-success border-success/30",
  adapt: "bg-warning/15 text-warning border-warning/30",
  abandon: "bg-destructive/15 text-destructive border-destructive/30",
};

export function CycleChain({
  organizationId,
  udsMeasure,
  focusArea,
  highlightCycleId,
}: {
  organizationId: string;
  udsMeasure: string | null;
  focusArea?: string | null;
  highlightCycleId?: string;
}) {
  const topic = udsMeasure || focusArea || null;
  const { data: chain = [], isLoading } = useQuery({
    queryKey: ["pdsa_chain", organizationId, udsMeasure, focusArea],
    queryFn: async () => {
      if (!topic) return [];
      let q = supabase
        .from("pdsa_cycles")
        .select("id,title,status,start_date,created_at,baseline_rate,actual_outcome,next_cycle_decision,completeness_score")
        .eq("organization_id", organizationId)
        .is("deleted_at", null);
      q = udsMeasure ? q.eq("uds_measure", udsMeasure) : q.eq("focus_area", topic);
      const { data, error } = await q
        .order("start_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as ChainCycle[];
    },
    enabled: !!topic,
  });

  if (!topic) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Link a UDS measure or set a focus area on this cycle to see its iteration chain.
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading chain…</p>;
  }

  if (chain.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        No cycles yet for this measure.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <GitBranch className="h-4 w-4" />
        Iteration chain for <span className="text-foreground">{topic}</span>
      </div>
      <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
        {chain.map((c, i) => (
          <div key={c.id} className="flex items-stretch gap-2">
            <div
              className={cn(
                "min-w-[200px] rounded-lg border p-3 space-y-2 bg-card",
                c.id === highlightCycleId && "border-primary ring-2 ring-primary/30",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold line-clamp-2">{c.title}</p>
                <CompletenessRing score={c.completeness_score ?? 0} size={32} showLabel={false} />
              </div>
              <div className="text-xs text-muted-foreground">
                {c.start_date
                  ? format(new Date(c.start_date), "MMM d, yyyy")
                  : format(new Date(c.created_at), "MMM d, yyyy")}
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <Badge variant="outline" className="text-[10px]">{c.status.toUpperCase()}</Badge>
                {c.next_cycle_decision && (
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] capitalize", DECISION_TONE[c.next_cycle_decision])}
                  >
                    {c.next_cycle_decision}
                  </Badge>
                )}
              </div>
              {(c.baseline_rate !== null || c.actual_outcome) && (
                <div className="text-xs text-muted-foreground">
                  {c.baseline_rate !== null && <>Baseline: <span className="text-foreground">{c.baseline_rate}</span></>}
                  {c.baseline_rate !== null && c.actual_outcome && " · "}
                  {c.actual_outcome && <span className="line-clamp-1">→ {c.actual_outcome}</span>}
                </div>
              )}
            </div>
            {i < chain.length - 1 && (
              <div className="flex items-center text-muted-foreground">
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
