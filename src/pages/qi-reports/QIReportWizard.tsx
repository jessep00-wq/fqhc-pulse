import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  buildReportSnapshot,
  currentQuarter,
  quarterRange,
} from "@/lib/qiReportBuilder";
import { deriveBoardSections } from "@/lib/qiReportBoardView";
import { MeasureSnapshotTable } from "@/components/qi-reports/MeasureSnapshotTable";
import type { CommitteeSections, QIReport } from "@/types/qiReport";
import { trackEvent } from "@/lib/trackEvent";

export default function QIReportWizard() {
  const { organization } = useOrg();
  const { isAdmin } = useUserRole();
  const { user } = useAuth();
  const navigate = useNavigate();
  const cq = useMemo(() => currentQuarter(), []);
  const now = new Date();
  const [year, setYear] = useState(cq.label.split(" ")[1]);
  const [quarter, setQuarter] = useState(cq.label.charAt(1));
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<Pick<CommitteeSections, "active_pdsa" | "prior_quarter_outcomes" | "measures" | "safety_events"> | null>(null);

  const selected = useMemo(
    () => quarterRange(parseInt(year), parseInt(quarter) as 1 | 2 | 3 | 4),
    [year, quarter],
  );

  const handlePreview = async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const snap = await buildReportSnapshot({ organizationId: organization.id, period: selected });
      setSnapshot(snap);
    } catch (e) {
      toast({ title: "Could not build snapshot", description: e instanceof Error ? e.message : "Unknown", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!organization?.id) {
      toast({
        title: "No organization selected",
        description: "Pick an organization in the admin header before generating an AI draft.",
        variant: "destructive",
      });
      return;
    }
    if (!snapshot) return;
    setLoading(true);

    // Step 1: AI draft
    let aiData: { narratives?: Record<string, string>; meta?: unknown } | null = null;
    try {
      const { data, error: aiErr } = await supabase.functions.invoke("draft-qi-report", {
        body: {
          orgName: organization.name,
          periodLabel: selected.label,
          snapshot,
        },
      });
      if (aiErr) {
        // FunctionsHttpError carries the response body on `context` — pull
        // the real status + message so the toast isn't generic.
        let detail = aiErr.message ?? "Unknown error";
        const ctx = (aiErr as unknown as { context?: Response }).context;
        if (ctx && typeof ctx.json === "function") {
          try {
            const body = await ctx.clone().json();
            if (body?.error) detail = `${body.error} (status ${ctx.status})`;
          } catch {
            try {
              const text = await ctx.clone().text();
              if (text) detail = `${text.slice(0, 300)} (status ${ctx.status})`;
            } catch { /* ignore */ }
          }
        }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      aiData = data as typeof aiData;
    } catch (e) {
      console.error("draft-qi-report failed:", e);
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({
        title: "AI draft failed",
        description: msg.includes("Subscription required")
          ? "Your trial has ended. Please subscribe to use AI drafting."
          : msg,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }


    const narratives = (aiData?.narratives ?? {}) as Record<string, string>;
    if (!narratives.exec_summary && !narratives.performance_narrative) {
      toast({
        title: "AI draft empty",
        description: "The model didn't return a draft. Please try again in a moment.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Step 2: persist report
    try {
      const committee: CommitteeSections = {
        ...snapshot,
        exec_summary: narratives.exec_summary,
        performance_narrative: narratives.performance_narrative,
        pdsa_narrative: narratives.pdsa_narrative,
        gaps_narrative: narratives.gaps_narrative,
        prior_quarter_narrative: narratives.prior_quarter_narrative,
        safety_narrative: narratives.safety_narrative,
        satisfaction_narrative: narratives.satisfaction_narrative,
        board_recommendations: narratives.board_recommendations,
      };
      const board = deriveBoardSections(committee);
      const safeCommittee = JSON.parse(JSON.stringify(committee));
      const safeBoard = JSON.parse(JSON.stringify(board));
      const safeMeta = aiData?.meta ? JSON.parse(JSON.stringify(aiData.meta)) : {};

      const client = supabase as unknown as { from: (t: string) => any };
      const { data: inserted, error: insErr } = await client
        .from("qi_reports")
        .insert({
          organization_id: organization.id,
          period_label: selected.label,
          period_start: selected.start,
          period_end: selected.end,
          report_type: "quarterly",
          status: "draft",
          committee_sections: safeCommittee,
          board_sections: safeBoard,
          ai_draft_meta: safeMeta,
          generated_by: user?.id ?? null,
        })
        .select("*")
        .single();
      if (insErr) throw insErr;
      const row = inserted as QIReport;
      toast({ title: "Report drafted", description: "AI narrative ready for your review." });
      trackEvent("qi_report_generated", { period_label: selected.label });
      navigate(`/dashboard/qi-reports/${row.id}`);
    } catch (e) {
      console.error("qi_reports insert failed:", e);
      toast({
        title: "Could not save report",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const years = [now.getUTCFullYear() - 1, now.getUTCFullYear(), now.getUTCFullYear() + 1];

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/qi-reports")}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to reports
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Generate quarterly report</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick a reporting quarter, preview the auto-pulled snapshot, then let the AI draft the narrative.
        </p>
        {organization?.id && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">Generating for</span>
            <span className="font-semibold">{organization.name}</span>
          </div>
        )}
      </div>

      {!organization?.id ? (
        isAdmin ? (
          <Card className="p-5 border-amber-300 bg-amber-50">
            <h3 className="font-semibold text-amber-900 mb-1">No health center selected</h3>
            <p className="text-sm text-amber-900/90 mb-4">
              Open the Admin Console and pick a health center from the "Acting as" dropdown, then return here to generate a quarterly report.
            </p>
            <Button variant="outline" onClick={() => navigate("/admin")}>
              Open Admin Console
            </Button>
          </Card>
        ) : (
          <Card className="p-5 border-amber-300 bg-amber-50">
            <h3 className="font-semibold text-amber-900 mb-1">Finish setting up your health center</h3>
            <p className="text-sm text-amber-900/90 mb-4">
              We need your health center details before we can pull a quarterly snapshot.
            </p>
            <Button variant="outline" onClick={() => navigate("/dashboard/settings")}>
              Go to Settings
            </Button>
          </Card>
        )
      ) : (
      <>
      <Card className="p-5">
        <h3 className="font-semibold mb-3">1. Choose period</h3>
        <div className="flex gap-3">
          <Select value={quarter} onValueChange={setQuarter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["1", "2", "3", "4"].map((q) => (
                <SelectItem key={q} value={q}>Q{q}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePreview} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Preview snapshot
          </Button>
        </div>
      </Card>

      {snapshot && (
        <>
          <Card className="p-5">
            <h3 className="font-semibold mb-3">2. Snapshot preview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Stat label="Active PDSA" value={snapshot.active_pdsa.length} />
              <Stat label="Prior quarter cycles" value={snapshot.prior_quarter_outcomes.length} />
              <Stat label="Measures tracked" value={snapshot.measures.length} />
              <Stat label="Safety events" value={snapshot.safety_events.length} />
            </div>
            {(snapshot.measures.length === 0 ||
              snapshot.active_pdsa.length === 0) && (
              <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-xs">
                Some sections have no data for this period. The AI draft will explicitly state these gaps rather than fabricate content.
              </div>
            )}
            <MeasureSnapshotTable measures={snapshot.measures} />
          </Card>


          <Card className="p-5">
            <h3 className="font-semibold mb-2">3. Draft with AI</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The AI quality assistant will draft narrative for every section using the snapshot above.
              You'll review and edit before sending the report for approval.
            </p>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate AI draft
            </Button>
          </Card>
        </>
      )}
      </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
