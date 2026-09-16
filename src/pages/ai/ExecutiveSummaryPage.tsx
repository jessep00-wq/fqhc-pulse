import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createAiExecutiveSummary } from "@/lib/ai/executiveSummary.functions";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Sparkles, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

interface Summary {
  id: string;
  created_at: string;
  period_start: string;
  period_end: string;
  summary: string;
  highlights: string[];
  risks: string[];
  evidence_state: string;
}

export default function ExecutiveSummaryPage() {
  const { organization } = useOrg();
  const queryClient = useQueryClient();
  const createFn = useServerFn(createAiExecutiveSummary);
  const [periodMonths, setPeriodMonths] = useState("3");

  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ["ai_executive_summaries", organization?.id],
    enabled: !!organization?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_executive_summaries")
        .select("id,created_at,period_start,period_end,summary,highlights,risks,evidence_state")
        .eq("organization_id", organization!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Summary[];
    },
  });

  const mutation = useMutation({
    mutationFn: () => createFn({ data: { periodMonths: Number(periodMonths) } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Executive summary generated");
        queryClient.invalidateQueries({ queryKey: ["ai_executive_summaries", organization?.id] });
      } else {
        toast.error(res.error ?? "Could not generate summary");
      }
    },
    onError: (e) => toast.error(`Failed: ${e?.message ?? ""}`),
  });

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Summaries</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Board-level quality-operations summaries generated from your PDSA cycles, signals, barriers, and financial data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodMonths} onValueChange={setPeriodMonths}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last month</SelectItem>
              <SelectItem value="3">Last quarter</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading…</CardContent></Card>
      ) : summaries.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No executive summaries yet"
          description="Generate one for the period you want to summarize. The AI drafts from your live workspace data; always review before sharing."
        />
      ) : (
        <div className="space-y-4">
          {summaries.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {new Date(s.period_start).toLocaleDateString()} –{" "}
                      {new Date(s.period_end).toLocaleDateString()}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Generated {new Date(s.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline">{s.evidence_state}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{s.summary}</p>
                {s.highlights.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Highlights</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {s.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {s.risks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Risks
                    </h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {s.risks.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
