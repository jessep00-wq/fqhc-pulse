import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import type { QIReport, QIReportStatus } from "@/types/qiReport";
import { currentQuarter } from "@/lib/qiReportBuilder";

const STATUS_META: Record<QIReportStatus, { label: string; className: string; Icon: typeof Clock }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground", Icon: Clock },
  in_review: { label: "In review", className: "bg-warning/10 text-warning border-warning/30", Icon: Clock },
  approved: { label: "Approved", className: "bg-success/10 text-success border-success/30", Icon: CheckCircle2 },
  board_presented: { label: "Presented to board", className: "bg-primary/10 text-primary border-primary/30", Icon: CheckCircle2 },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground", Icon: AlertCircle },
};

export default function QIReportsList() {
  const { organization } = useOrg();
  const navigate = useNavigate();
  const cq = useMemo(() => currentQuarter(), []);
  const [creating, setCreating] = useState(false);

  const { data: reports = [] } = useQuery({
    queryKey: ["qi_reports", organization?.id],
    enabled: !!organization?.id,
    queryFn: async () => {
      const client = supabase as unknown as { from: (t: string) => any };
      const { data, error } = await client
        .from("qi_reports")
        .select("*")
        .eq("organization_id", organization!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as QIReport[];
    },
  });

  const currentExists = reports.some((r) => r.period_label === cq.label);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quarterly QI/QA Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            HRSA-aligned committee and board reports — auto-populated from your live QI data.
          </p>
        </div>
        <Button
          disabled={creating || currentExists}
          onClick={() => {
            setCreating(true);
            navigate("/dashboard/qi-reports/new");
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {currentExists ? `${cq.label} started` : `Generate ${cq.label}`}
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card className="p-10 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="font-semibold mb-1">No reports yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Generate your first quarterly QI/QA report. The AI assistant will draft narrative
            sections from your live PDSA cycles, measures, and safety events.
          </p>
          <Button onClick={() => navigate("/dashboard/qi-reports/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Generate {cq.label} report
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((r) => {
            const meta = STATUS_META[r.status];
            const Icon = meta.Icon;
            return (
              <Card
                key={r.id}
                className="p-5 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
                onClick={() => navigate(`/dashboard/qi-reports/${r.id}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold">{r.period_label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {r.period_start} – {r.period_end}
                    </p>
                  </div>
                  <Badge variant="outline" className={meta.className}>
                    <Icon className="h-3 w-3 mr-1" />
                    {meta.label}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Updated {new Date(r.updated_at).toLocaleDateString()}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
