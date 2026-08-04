import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Save, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { COMMITTEE_SECTIONS } from "@/data/qiReportTemplate";
import { SectionCard } from "@/components/qi-reports/SectionCard";
import { ApprovalChain } from "@/components/qi-reports/ApprovalChain";
import { BoardActionsTable } from "@/components/qi-reports/BoardActionsTable";
import { MeasureSnapshotTable } from "@/components/qi-reports/MeasureSnapshotTable";
import { ExportReportDialog } from "@/components/qi-reports/ExportReportDialog";
import { deriveBoardSections } from "@/lib/qiReportBoardView";
import {
  APPROVAL_ROLE_ORDER,
  STAFF_ROLE_TO_APPROVAL,
  type ApprovalRole,
  type CommitteeSections,
  type QIReport,
  type QIReportApproval,
  type QIReportBoardAction,
} from "@/types/qiReport";
import { WorkstreamRibbon } from "@/components/workstream/WorkstreamRibbon";
import { DownstreamImpactPanel } from "@/components/workstream/DownstreamImpactPanel";
import { getQIReportWorkstream } from "@/lib/workstream/qiReportWorkstream";

export default function QIReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organization } = useOrg();
  const { user } = useAuth();
  const { isFounderAdmin } = useUserRole();
  const qc = useQueryClient();
  const [exportOpen, setExportOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyApproval, setBusyApproval] = useState(false);
  const [committeeDraft, setCommitteeDraft] = useState<CommitteeSections | null>(null);

  const reportQuery = useQuery({
    queryKey: ["qi_report", id],
    enabled: !!id,
    queryFn: async () => {
      const client = supabase as unknown as { from: (t: string) => any };
      const { data, error } = await client.from("qi_reports").select("*").eq("id", id).single();
      if (error) throw error;
      return data as QIReport;
    },
  });

  const approvalsQuery = useQuery({
    queryKey: ["qi_report_approvals", id],
    enabled: !!id,
    queryFn: async () => {
      const client = supabase as unknown as { from: (t: string) => any };
      const { data, error } = await client
        .from("qi_report_approvals")
        .select("*")
        .eq("report_id", id);
      if (error) throw error;
      return (data ?? []) as QIReportApproval[];
    },
  });

  const actionsQuery = useQuery({
    queryKey: ["qi_report_board_actions", id],
    enabled: !!id,
    queryFn: async () => {
      const client = supabase as unknown as { from: (t: string) => any };
      const { data, error } = await client
        .from("qi_report_board_actions")
        .select("*")
        .eq("report_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as QIReportBoardAction[];
    },
  });

  const profileQuery = useQuery({
    queryKey: ["profile-staff-role", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("staff_role, full_name")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) return null;
      return data as { staff_role: string | null; full_name: string | null } | null;
    },
  });

  const report = reportQuery.data;
  const committee = useMemo(() => {
    if (committeeDraft) return committeeDraft;
    return (report?.committee_sections ?? null) as CommitteeSections | null;
  }, [committeeDraft, report]);

  const currentUserRole: ApprovalRole | null = useMemo(() => {
    const staff = profileQuery.data?.staff_role;
    if (!staff) return null;
    return STAFF_ROLE_TO_APPROVAL[staff] ?? null;
  }, [profileQuery.data]);

  if (reportQuery.isLoading) {
    return (
      <div className="space-y-4 p-1">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (reportQuery.isError || !report || !committee) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">We couldn't load this report</h2>
          <p className="text-sm text-muted-foreground">
            {reportQuery.isError
              ? "Something went wrong fetching the report. It may have been deleted, or you may not have access to it."
              : "This report exists but has no saved content yet."}
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard/qi-reports")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to reports
            </Button>
            <Button onClick={() => reportQuery.refetch()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  const updateSection = (key: keyof CommitteeSections, value: string) => {
    setCommitteeDraft({ ...(committeeDraft ?? committee), [key]: value });
  };

  const handleSave = async () => {
    if (!report) return;
    setSaving(true);
    try {
      const next = committeeDraft ?? committee;
      const board = deriveBoardSections(next);
      const client = supabase as unknown as { from: (t: string) => any };
      const { error } = await client
        .from("qi_reports")
        .update({ committee_sections: next, board_sections: board })
        .eq("id", report.id);
      if (error) throw error;
      toast({ title: "Saved" });
      setCommitteeDraft(null);
      qc.invalidateQueries({ queryKey: ["qi_report", report.id] });
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleApprovalDecision = async (
    role: ApprovalRole,
    decision: "approved" | "changes_requested",
  ) => {
    if (!report || !organization) return;
    setBusyApproval(true);
    try {
      const client = supabase as unknown as { from: (t: string) => any };
      const { error } = await client.from("qi_report_approvals").insert({
        report_id: report.id,
        organization_id: organization.id,
        role,
        approver_user_id: user?.id ?? null,
        approver_name_snapshot: profileQuery.data?.full_name ?? user?.email ?? "Unknown",
        approver_title_snapshot: profileQuery.data?.staff_role ?? null,
        decision,
        decision_note: null,
      });
      if (error) throw error;

      // Compute new status
      const all = [
        ...(approvalsQuery.data ?? []),
        {
          id: "tmp",
          report_id: report.id,
          organization_id: organization.id,
          role,
          decision,
          decided_at: new Date().toISOString(),
        } as QIReportApproval,
      ];
      const allApproved = APPROVAL_ROLE_ORDER.every((r) =>
        all.some((a) => a.role === r && a.decision === "approved"),
      );
      const newStatus = allApproved
        ? "approved"
        : decision === "changes_requested"
        ? "draft"
        : "in_review";
      await client.from("qi_reports").update({ status: newStatus }).eq("id", report.id);

      toast({
        title: decision === "approved" ? "Approved" : "Changes requested",
      });
      qc.invalidateQueries({ queryKey: ["qi_report", report.id] });
      qc.invalidateQueries({ queryKey: ["qi_report_approvals", report.id] });
    } catch (e) {
      toast({
        title: "Could not record decision",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setBusyApproval(false);
    }
  };

  const isApproved = report.status === "approved" || report.status === "board_presented";

  const workstreamFacts = getQIReportWorkstream(
    report,
    approvalsQuery.data ?? [],
    actionsQuery.data ?? [],
  );

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/qi-reports")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            All reports
          </Button>
          <h1 className="text-2xl font-bold tracking-tight mt-2">
            {report.period_label} QI/QA Report
          </h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Badge variant="outline">{report.status.replace("_", " ")}</Badge>
            <span>
              {report.period_start} – {report.period_end}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {committeeDraft && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save changes
            </Button>
          )}
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <WorkstreamRibbon facts={workstreamFacts} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">


      <Tabs defaultValue="committee">
        <TabsList>
          <TabsTrigger value="committee">Committee version</TabsTrigger>
          <TabsTrigger value="board">Board version</TabsTrigger>
          <TabsTrigger value="approval">Approval chain</TabsTrigger>
        </TabsList>

        <TabsContent value="committee" className="space-y-4 mt-4">
          <MeasureSnapshotTable measures={committee.measures ?? []} />
          {COMMITTEE_SECTIONS.map((def) => (
            <SectionCard
              key={def.key}
              title={def.title}
              hrsaAnchor={def.hrsa_anchor}
              helper={def.helper}
              value={(committee[def.key] as string) ?? ""}
              onChange={(v) => updateSection(def.key, v)}
              aiGenerated={!!(report.ai_draft_meta as { model?: string })?.model}
              readOnly={isApproved}
            />
          ))}
          <BoardActionsTable
            actions={actionsQuery.data ?? []}
            readOnly={isApproved}
            onAdd={async (a) => {
              if (!organization) return;
              const client = supabase as unknown as { from: (t: string) => any };
              const { error } = await client.from("qi_report_board_actions").insert({
                report_id: report.id,
                organization_id: organization.id,
                kind: a.kind,
                title: a.title,
                detail: a.detail,
                due_date: a.due_date,
              });
              if (error) {
                toast({ title: "Could not add", description: error.message, variant: "destructive" });
                return;
              }
              qc.invalidateQueries({ queryKey: ["qi_report_board_actions", report.id] });
            }}
            onRemove={async (rid) => {
              const client = supabase as unknown as { from: (t: string) => any };
              await client.from("qi_report_board_actions").delete().eq("id", rid);
              qc.invalidateQueries({ queryKey: ["qi_report_board_actions", report.id] });
            }}
          />
        </TabsContent>

        <TabsContent value="board" className="space-y-4 mt-4">
          <div className="rounded-lg border p-5 bg-muted/30">
            <h3 className="font-semibold mb-2">Board-ready summary</h3>
            <p className="text-sm text-muted-foreground">
              Auto-derived from the committee version — strips PHI specifics and staff names.
              Regenerated whenever you save committee changes.
            </p>
          </div>
          <BoardSummaryView report={report} />
        </TabsContent>

        <TabsContent value="approval" className="mt-4">
          <ApprovalChain
            approvals={approvalsQuery.data ?? []}
            currentUserRole={currentUserRole}
            isFounderAdmin={isFounderAdmin}
            onDecision={handleApprovalDecision}
            busy={busyApproval}
          />
        </TabsContent>
      </Tabs>
        </div>
        <div>
          <DownstreamImpactPanel facts={workstreamFacts} className="sticky top-4" />
        </div>
      </div>

      <ExportReportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        report={report}
        approvals={approvalsQuery.data ?? []}
        boardActions={actionsQuery.data ?? []}
        orgName={organization?.name ?? ""}
      />
    </div>
  );
}


function BoardSummaryView({ report }: { report: QIReport }) {
  const b = report.board_sections;
  return (
    <div className="space-y-3">
      <div className="rounded-lg border p-4">
        <div className="text-xs uppercase text-muted-foreground mb-1">Executive Summary</div>
        <p className="text-sm whitespace-pre-line">{b.exec_summary ?? "—"}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border p-4">
          <div className="text-xs uppercase text-muted-foreground mb-2">Performance</div>
          <p className="text-sm">{b.performance_summary ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-2">{b.pdsa_summary}</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-xs uppercase text-muted-foreground mb-2">Trend</div>
          <p className="text-sm capitalize">{b.measure_trend}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border p-4">
          <div className="text-xs uppercase text-muted-foreground mb-2">Top wins</div>
          <ul className="text-sm space-y-1 list-disc pl-4">
            {(b.top_wins ?? []).map((w, i) => <li key={i}>{w}</li>)}
            {!b.top_wins?.length && <li className="list-none text-muted-foreground italic">No wins identified.</li>}
          </ul>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-xs uppercase text-muted-foreground mb-2">Top risks</div>
          <ul className="text-sm space-y-1 list-disc pl-4">
            {(b.top_risks ?? []).map((r, i) => <li key={i}>{r}</li>)}
            {!b.top_risks?.length && <li className="list-none text-muted-foreground italic">No risks flagged.</li>}
          </ul>
        </div>
      </div>
      {b.recommendations && (
        <div className="rounded-lg border p-4">
          <div className="text-xs uppercase text-muted-foreground mb-2">Recommendations to board</div>
          <p className="text-sm whitespace-pre-line">{b.recommendations}</p>
        </div>
      )}
    </div>
  );
}
