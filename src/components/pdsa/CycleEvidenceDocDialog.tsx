import { useCallback, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useTierLimits } from "@/hooks/useTierLimits";
import { useRecordHistory } from "@/hooks/useRecordHistory";
import { confirmDemoExport } from "@/lib/demoExportGate";
import { getPdsaProgress, STAGE_FIELDS, type PdsaCycleFields as PdsaCycleForScore } from "@/lib/pdsaProgress";
import { exportNodeToPdf, printNode, slugify } from "@/lib/evidencePdf";
import {
  buildStageTimeline, cyclePace, docId, fieldLabel, fmtDate, fmtDateTime,
  displayValue, lastChangedAt, sectionAsOf, CREATED_FIELD,
} from "@/lib/cycleHistory";
import {
  TEAL, GRAY_TEXT, pageStyle, tableStyle, thStyle, tdStyle,
  PageHeader, PageFooter, SectionHeading, Field, AsOf, MetricRow, TimelineStrip, PendingPanel,
} from "@/components/evidence/packetStyles";
import { FileText, Loader2, Download, Printer } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export interface EvidenceDocCycle extends PdsaCycleForScore {
  id: string;
  organization_id: string;
  title: string;
  status: string;
  created_at: string;
  opened_at?: string | null;
  target_end_date?: string | null;
  doc_version?: number | null;
  root_cause?: string | null;
  target_goal?: string | null;
  clinical_workflow_impact?: string | null;
  assigned_staff?: string[] | null;
  improvement_pct?: number | null;
  prediction?: string | null;
  test_description?: string | null;
  study_results?: string | null;
  analysis_summary?: string | null;
  what_worked?: string | null;
  what_didnt_work?: string | null;
  act_next_steps?: string | null;
  decision?: string | null;
  next_cycle_id?: string | null;
  previous_cycle_id?: string | null;
  completeness_score?: number | null;
}

interface DocTask {
  id: string;
  title: string;
  status: string;
  assigned_role: string | null;
  due_date: string | null;
}

interface DocEvidence {
  id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

const STAGE_LABEL: Record<string, string> = {
  plan: "Plan",
  do: "Do",
  study: "Study",
  act: "Act",
  completed: "Completed",
};

const STAGE_RANK: Record<string, number> = { plan: 0, do: 1, study: 2, act: 3, completed: 4 };



function humanSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CycleEvidenceDocDialog({
  cycle,
  open,
  onClose,
}: {
  cycle: EvidenceDocCycle | null;
  open: boolean;
  onClose: () => void;
}) {
  const { organization, isDemo } = useOrg();
  const { isFreeTier } = useTierLimits();
  const [busy, setBusy] = useState<"pdf" | "print" | null>(null);
  const [rendered, setRendered] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const cycleId = cycle?.id;

  const { data: tasks = [] } = useQuery({
    queryKey: ["cycle-evidence-doc-tasks", cycleId],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id,title,status,assigned_role,due_date")
        .eq("pdsa_cycle_id", cycleId!)
        .eq("organization_id", organization.id);
      return (data || []) as DocTask[];
    },
    enabled: open && !!cycleId && !!organization.id,
  });

  const { data: files = [] } = useQuery({
    queryKey: ["cycle-evidence-doc-files", cycleId],
    queryFn: async () => {
      const client = supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (col: string, v: string) => {
              eq: (col: string, v: string) => Promise<{ data: DocEvidence[] | null }>;
            };
          };
        };
      };
      const { data } = await client
        .from("pdsa_evidence")
        .select("id,file_name,mime_type,size_bytes,created_at")
        .eq("pdsa_cycle_id", cycleId!)
        .eq("organization_id", organization.id);
      return data || [];
    },
    enabled: open && !!cycleId && !!organization.id,
  });

  const { data: revisions = [] } = useRecordHistory(
    "pdsa_cycle",
    cycleId ? [cycleId] : [],
    organization.id,
    open,
  );

  const orgName = organization.name || "Health Center";
  const isComplete = cycle?.status === "completed";
  const progress = cycle ? getPdsaProgress(cycle, { evidenceCount: files.length }) : null;
  const score = progress?.completenessPct ?? 0;
  const missing = progress?.missing ?? [];
  const currentStageLabel = progress?.currentStageLabel ?? "Plan";

  const emptyNote = cycle
    ? `Not yet documented — cycle currently in ${currentStageLabel}.`
    : "Not yet documented.";

  const renderThen = useCallback(async (fn: () => void | Promise<void>) => {
    setRendered(true);
    await new Promise((r) => setTimeout(r, 500));
    if (!printRef.current) return;
    await fn();
  }, []);

  const handleDownload = useCallback(async () => {
    if (!cycle) return;
    if (!confirmDemoExport(isDemo, "This PDSA evidence document")) return;
    setBusy("pdf");
    try {
      await renderThen(async () => {
        const watermark = isFreeTier
          ? "SAMPLE — UPGRADE TO REMOVE"
          : isComplete
            ? undefined
            : "DRAFT — CYCLE IN PROGRESS";
        const pages = await exportNodeToPdf(
          printRef.current!,
          `PDSA_Evidence_${slugify(cycle.title)}_${format(new Date(), "yyyy-MM-dd")}.pdf`,
          { watermark },
        );
        toast.success(`Evidence document exported (${pages} pages)`);
      });
    } catch (err) {
      console.error("Cycle evidence export failed:", err);
      toast.error("Failed to export evidence document");
    } finally {
      setBusy(null);
    }
  }, [cycle, isDemo, isFreeTier, isComplete, renderThen]);

  const handlePrint = useCallback(async () => {
    if (!cycle) return;
    if (!confirmDemoExport(isDemo, "This PDSA evidence document")) return;
    setBusy("print");
    try {
      await renderThen(() => {
        const ok = printNode(printRef.current!, `PDSA Evidence — ${cycle.title}`);
        if (!ok) toast.error("Allow pop-ups to print this document");
      });
    } finally {
      setBusy(null);
    }
  }, [cycle, isDemo, renderThen]);

  if (!cycle) return null;

  const topic = cycle.uds_measure || cycle.focus_area || "Not linked to a measure";
  const generatedOn = format(new Date(), "MMMM d, yyyy");
  const docLabel = "PDSA Evidence Document";
  const version = cycle.doc_version ?? 1;
  const reference = docId(cycle.id, version);

  const timeline = buildStageTimeline(cycle as never, revisions).map((s) => ({
    label: s.label,
    date: s.enteredAt ? fmtDate(s.enteredAt) : null,
    reached: s.reached,
    current: s.current,
  }));
  const pace = cyclePace(cycle as never);
  const rank = STAGE_RANK[cycle.status] ?? 0;

  const baseline = cycle.baseline_rate;
  const openTasks = tasks.filter((t) => t.status !== "completed").length;
  const editedOn = (f: string) => {
    const at = lastChangedAt(revisions, f);
    return at ? fmtDate(at) : null;
  };

  const planAsOf = sectionAsOf(revisions, [
    "aim_statement", "root_cause", "target_goal", "predicted_outcome", "prediction",
    "measurement_plan", "baseline_rate",
  ]);
  const doAsOf = sectionAsOf(revisions, ["intervention_description", "test_description", "clinical_workflow_impact"]);
  const studyAsOf = sectionAsOf(revisions, ["actual_outcome", "study_results", "analysis_summary", "what_worked", "what_didnt_work"]);
  const actAsOf = sectionAsOf(revisions, ["next_cycle_decision", "decision", "act_next_steps"]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setRendered(false); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            PDSA Evidence Document
          </DialogTitle>
          <DialogDescription>
            A branded, audit-ready progression record for this cycle. Available at any stage — it opens
            with a dashboard and timeline, then shows each phase with the date its entries were made.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium truncate">{cycle.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{topic} · {reference}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center mt-4">
              <div><p className="text-2xl font-bold text-primary">{currentStageLabel}</p><p className="text-xs text-muted-foreground">Stage</p></div>
              <div><p className="text-2xl font-bold text-foreground">{score}%</p><p className="text-xs text-muted-foreground">Complete</p></div>
              <div><p className="text-2xl font-bold text-foreground">{tasks.length}</p><p className="text-xs text-muted-foreground">Linked tasks</p></div>
              <div><p className="text-2xl font-bold text-foreground">{revisions.length}</p><p className="text-xs text-muted-foreground">Logged changes</p></div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{pace.label}</p>
          </div>

          {!isComplete && (
            <p className="text-xs text-muted-foreground">
              This cycle is still in progress, so the export is stamped “Draft — cycle in progress”.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={handlePrint} disabled={busy !== null}>
            {busy === "print" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
            Print
          </Button>
          <Button onClick={handleDownload} disabled={busy !== null}>
            {busy === "pdf" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download PDF
          </Button>
        </DialogFooter>

        {/* Off-screen printable document */}
        {rendered && (
          <div style={{ position: "absolute", left: "-9999px", top: 0 }} aria-hidden>
            <div ref={printRef} style={{ background: "#fff" }}>

              {/* COVER */}
              <div style={{ width: "800px", minHeight: "1050px", background: "#1a2e3b", color: "#fff", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "28px 48px 16px", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
                  <p style={{ fontSize: "20px", fontWeight: 700 }}>MeasureWise</p>
                  <p style={{ fontSize: "12px", color: "#5eead4", marginTop: "2px" }}>HRSA • PCMH • UDS Quality Intelligence</p>
                </div>
                <div style={{ flex: 1, padding: "0 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <p style={{ fontSize: "16px", color: "#94a3b8", marginBottom: "4px" }}>QUALITY IMPROVEMENT</p>
                  <h1 style={{ fontSize: "38px", fontWeight: 700, marginBottom: "8px" }}>PDSA Progression Record</h1>
                  <div style={{ width: "80px", height: "4px", backgroundColor: TEAL, marginBottom: "28px" }} />
                  <p style={{ fontSize: "20px", marginBottom: "20px", lineHeight: 1.4 }}>{cycle.title}</p>
                  <p style={{ fontSize: "13px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>Health Center:</span> {orgName}</p>
                  <p style={{ fontSize: "13px", marginTop: "4px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>Measure / Focus Area:</span> {topic}</p>
                  <p style={{ fontSize: "13px", marginTop: "4px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>Current Stage:</span> {currentStageLabel}</p>
                  <p style={{ fontSize: "13px", marginTop: "4px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>Cycle Pace:</span> {pace.label}</p>
                  <p style={{ fontSize: "13px", marginTop: "4px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>Opened:</span> {fmtDate(cycle.opened_at || cycle.created_at)}</p>
                  <p style={{ fontSize: "13px", marginTop: "4px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>Target End:</span> {fmtDate(cycle.target_end_date, "Not set")}</p>
                  {organization.npi && <p style={{ fontSize: "13px", marginTop: "4px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>NPI:</span> {organization.npi}</p>}
                  <p style={{ fontSize: "13px", marginTop: "4px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>Document ID:</span> {reference}</p>

                  <div style={{ marginTop: "36px", padding: "14px 18px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.05)" }}>
                    <p style={{ fontSize: "12px", color: isComplete ? "#5eead4" : "#fcd34d", fontWeight: 700, letterSpacing: "0.05em" }}>
                      {isComplete ? "COMPLETED CYCLE — FINAL RECORD" : "DRAFT — CYCLE IN PROGRESS"}
                    </p>
                    <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                      {isComplete
                        ? "All stages of this Plan-Do-Study-Act cycle have been documented and closed out."
                        : "This document reflects the cycle as of the generation date. Phases not yet reached are marked pending."}
                    </p>
                  </div>
                </div>
                <div style={{ padding: "24px 48px", textAlign: "center" }}>
                  <p style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
                    Generated by MeasureWise on {generatedOn} · Version {version}
                  </p>
                </div>
              </div>

              {/* 01 — Progression dashboard */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} docLabel={docLabel} />
                <SectionHeading label="SECTION 01 — AT A GLANCE" title="Cycle Progression" />
                <TimelineStrip stages={timeline} />
                <MetricRow
                  metrics={[
                    { val: `${score}%`, label: "Documentation complete" },
                    { val: baseline != null ? `${baseline}%` : "—", label: "Baseline rate" },
                    {
                      val: cycle.improvement_pct != null ? `${cycle.improvement_pct > 0 ? "+" : ""}${cycle.improvement_pct}%` : "—",
                      label: "Change to date",
                    },
                    { val: pace.dayNumber ?? "—", label: "Days elapsed", tone: pace.overdue ? "warning" : "default" },
                  ]}
                />
                <div style={{ height: "24px" }} />
                <table style={tableStyle}>
                  <tbody>
                    {[
                      ["Current stage", currentStageLabel],
                      ["Pace", pace.label],
                      ["Opened", fmtDate(cycle.opened_at || cycle.created_at)],
                      ["Start date", fmtDate(cycle.start_date, "Not set")],
                      ["Target end date", fmtDate(cycle.target_end_date, "Not set")],
                      ["Open tasks", `${openTasks} of ${tasks.length}`],
                      ["Evidence artifacts", `${files.length}`],
                      ["Logged changes", `${revisions.length}`],
                      ["Assigned staff", (cycle.assigned_staff || []).join(", ") || "None assigned"],
                      ["Part of a cycle chain", cycle.previous_cycle_id || cycle.next_cycle_id ? "Yes" : "No"],
                    ].map((row, i) => (
                      <tr key={row[0] as string}>
                        <td style={{ ...tdStyle, fontWeight: 600, width: "40%", backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{row[0]}</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{row[1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={2} note={`${reference} — ${orgName}`} />
              </div>

              {/* 02 — Accountability */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} docLabel={docLabel} />
                <SectionHeading label="SECTION 02 — ACCOUNTABILITY" title="Who Is Doing What" />
                {tasks.length === 0 ? (
                  <PendingPanel stage="accountability" note="No tasks have been linked to this cycle yet. Assign owners so the work is traceable." />
                ) : (
                  <table style={tableStyle}>
                    <thead>
                      <tr>{["Task", "Assigned role", "Due date", "Status"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {tasks.map((t, i) => (
                        <tr key={t.id}>
                          {[
                            t.title,
                            t.assigned_role || "Unassigned",
                            t.due_date ? format(new Date(t.due_date), "MMM d, yyyy") : "—",
                            t.status.replace("_", " "),
                          ].map((cell, j) => (
                            <td key={j} style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={3} note={`${reference} — ${orgName}`} />
              </div>

              {/* 03 — Plan */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} docLabel={docLabel} />
                <SectionHeading label="SECTION 03 — PLAN" title="Plan" />
                <AsOf date={planAsOf ? fmtDate(planAsOf) : null} />
                <Field label="Aim statement" value={cycle.aim_statement} emptyNote={emptyNote} editedOn={editedOn("aim_statement")} />
                <Field label="Root cause" value={cycle.root_cause} emptyNote={emptyNote} editedOn={editedOn("root_cause")} />
                <Field label="Target goal" value={cycle.target_goal} emptyNote={emptyNote} editedOn={editedOn("target_goal")} />
                <Field label="Prediction" value={cycle.predicted_outcome || cycle.prediction} emptyNote={emptyNote} editedOn={editedOn("predicted_outcome")} />
                <Field label="Measurement plan" value={cycle.measurement_plan} emptyNote={emptyNote} editedOn={editedOn("measurement_plan")} />
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={4} note={`${reference} — ${orgName}`} />
              </div>

              {/* 04 — Do */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} docLabel={docLabel} />
                <SectionHeading label="SECTION 04 — DO" title="Do" />
                {rank < 1 ? (
                  <PendingPanel stage="Do" />
                ) : (
                  <>
                    <AsOf date={doAsOf ? fmtDate(doAsOf) : null} />
                    <Field label="Intervention description" value={cycle.intervention_description} emptyNote={emptyNote} editedOn={editedOn("intervention_description")} />
                    <Field label="Action description" value={cycle.test_description} emptyNote={emptyNote} editedOn={editedOn("test_description")} />
                    <Field label="Clinical workflow impact" value={cycle.clinical_workflow_impact} emptyNote={emptyNote} editedOn={editedOn("clinical_workflow_impact")} />
                  </>
                )}
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={5} note={`${reference} — ${orgName}`} />
              </div>

              {/* 05 — Study */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} docLabel={docLabel} />
                <SectionHeading label="SECTION 05 — STUDY" title="Study" />
                {rank < 2 ? (
                  <PendingPanel stage="Study" />
                ) : (
                  <>
                    <AsOf date={studyAsOf ? fmtDate(studyAsOf) : null} />
                    <Field label="Actual outcome" value={cycle.actual_outcome} emptyNote={emptyNote} editedOn={editedOn("actual_outcome")} />
                    <Field label="Study results" value={cycle.study_results} emptyNote={emptyNote} editedOn={editedOn("study_results")} />
                    <Field label="Analysis summary" value={cycle.analysis_summary} emptyNote={emptyNote} editedOn={editedOn("analysis_summary")} />
                    <Field label="What worked" value={cycle.what_worked} emptyNote={emptyNote} editedOn={editedOn("what_worked")} />
                    <Field label="What didn't work" value={cycle.what_didnt_work} emptyNote={emptyNote} editedOn={editedOn("what_didnt_work")} />
                  </>
                )}
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={6} note={`${reference} — ${orgName}`} />
              </div>

              {/* 06 — Act */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} docLabel={docLabel} />
                <SectionHeading label="SECTION 06 — ACT" title="Act" />
                {rank < 3 ? (
                  <PendingPanel stage="Act" />
                ) : (
                  <>
                    <AsOf date={actAsOf ? fmtDate(actAsOf) : null} />
                    <Field
                      label="Next-cycle decision"
                      value={cycle.next_cycle_decision || cycle.decision}
                      emptyNote={emptyNote}
                      editedOn={editedOn("next_cycle_decision")}
                    />
                    <Field label="Next steps" value={cycle.act_next_steps} emptyNote={emptyNote} editedOn={editedOn("act_next_steps")} />
                    <Field
                      label="Follow-on cycle"
                      value={cycle.next_cycle_id ? "A follow-on PDSA cycle has been created from this cycle." : null}
                      emptyNote="No follow-on cycle has been created yet."
                    />
                  </>
                )}
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={7} note={`${reference} — ${orgName}`} />
              </div>

              {/* 07 — Supporting artifacts */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} docLabel={docLabel} />
                <SectionHeading label="SECTION 07 — SUPPORTING ARTIFACTS" title="Attached Evidence Files" />
                {files.length === 0 ? (
                  <PendingPanel stage="evidence" note="No supporting files have been attached to this cycle yet." />
                ) : (
                  <table style={tableStyle}>
                    <thead>
                      <tr>{["File name", "Type", "Size", "Uploaded"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {files.map((f, i) => (
                        <tr key={f.id}>
                          {[
                            f.file_name,
                            f.mime_type || "—",
                            humanSize(f.size_bytes),
                            format(new Date(f.created_at), "MMM d, yyyy"),
                          ].map((cell, j) => (
                            <td key={j} style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <p style={{ fontSize: "12px", color: GRAY_TEXT, marginTop: "16px", fontStyle: "italic" }}>
                  Files themselves are stored securely in MeasureWise and can be retrieved from the cycle's Evidence tab.
                </p>
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={8} note={`${reference} — ${orgName}`} />
              </div>

              {/* 08 — Completeness checklist */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} docLabel={docLabel} />
                <SectionHeading label="SECTION 08 — READINESS" title="Documentation Completeness" />
                <table style={tableStyle}>
                  <thead>
                    <tr>{["Documentation item", "Present"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {[
                      ...STAGE_FIELDS.plan.map((f) => f.label),
                      ...STAGE_FIELDS.do.map((f) => f.label),
                      ...STAGE_FIELDS.study.map((f) => f.label),
                      ...STAGE_FIELDS.act.map((f) => f.label),

                    ].map((item, i) => {
                      const present = !missing.includes(item);
                      return (
                        <tr key={item}>
                          <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{item}</td>
                          <td style={{ ...tdStyle, fontWeight: 600, color: present ? TEAL : "#b45309", backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                            {present ? "Yes" : "Outstanding"}
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td style={{ ...tdStyle, backgroundColor: "#f9fafb" }}>Supporting evidence attached</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: files.length > 0 ? TEAL : "#b45309", backgroundColor: "#f9fafb" }}>
                        {files.length > 0 ? `Yes (${files.length})` : "Outstanding"}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p style={{ fontSize: "14px", lineHeight: 1.7, marginTop: "24px" }}>
                  Documentation completeness for this cycle is <strong>{score}%</strong>. Items marked
                  outstanding are the fastest way to raise the score before a site visit.
                </p>
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={9} note={`${reference} — ${orgName}`} />
              </div>

              {/* 09 — Change log */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} docLabel={docLabel} />
                <SectionHeading label="SECTION 09 — AUDIT TRAIL" title="Change Log" />
                {revisions.length === 0 ? (
                  <PendingPanel stage="audit trail" note="No changes have been recorded for this cycle yet." />
                ) : (
                  <table style={tableStyle}>
                    <thead>
                      <tr>{["Date", "Field", "Previous value", "New value"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {revisions.slice(0, 40).map((r, i) => (
                        <tr key={r.id}>
                          {[
                            fmtDateTime(r.created_at),
                            fieldLabel(r.field_name),
                            r.field_name === CREATED_FIELD ? "—" : truncate(displayValue(r.field_name, r.old_value)),
                            r.field_name === CREATED_FIELD ? "Cycle created" : truncate(displayValue(r.field_name, r.new_value)),
                          ].map((cell, j) => (
                            <td key={j} style={{ ...tdStyle, fontSize: "11px", backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <p style={{ fontSize: "12px", color: GRAY_TEXT, marginTop: "16px", fontStyle: "italic" }}>
                  Entries are immutable. Previous values are retained in full inside MeasureWise; long
                  values are abbreviated here for print.
                </p>
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={10} note={`${reference} — ${orgName}`} />
              </div>

            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function truncate(value: string, max = 90) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}
