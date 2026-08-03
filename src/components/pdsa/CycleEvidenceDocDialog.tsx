import { useCallback, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useTierLimits } from "@/hooks/useTierLimits";
import { confirmDemoExport } from "@/lib/demoExportGate";
import { computeCompleteness, type PdsaCycleForScore } from "@/lib/pdsaCompleteness";
import { exportNodeToPdf, printNode, slugify } from "@/lib/evidencePdf";
import {
  TEAL, TEAL_LIGHT, GRAY_BORDER, GRAY_TEXT, pageStyle, tableStyle, thStyle, tdStyle,
  PageHeader, PageFooter, SectionHeading, Field,
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

function stageOf(status: string) {
  return STAGE_LABEL[status] ?? status;
}

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

  const orgName = organization.name || "Health Center";
  const isComplete = cycle?.status === "completed";
  const { score, missing } = cycle
    ? computeCompleteness(cycle, files.length)
    : { score: 0, missing: [] as string[] };

  const emptyNote = cycle
    ? `Not yet documented — cycle currently in ${stageOf(cycle.status)}.`
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

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setRendered(false); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            PDSA Evidence Document
          </DialogTitle>
          <DialogDescription>
            A branded, audit-ready record for this single cycle. Available at any stage — sections you
            haven't filled in yet are shown as outstanding rather than hidden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium truncate">{cycle.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{topic}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center mt-4">
              <div><p className="text-2xl font-bold text-primary">{stageOf(cycle.status)}</p><p className="text-xs text-muted-foreground">Stage</p></div>
              <div><p className="text-2xl font-bold text-foreground">{score}%</p><p className="text-xs text-muted-foreground">Complete</p></div>
              <div><p className="text-2xl font-bold text-foreground">{tasks.length}</p><p className="text-xs text-muted-foreground">Linked tasks</p></div>
              <div><p className="text-2xl font-bold text-foreground">{files.length}</p><p className="text-xs text-muted-foreground">Attached files</p></div>
            </div>
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
                  <h1 style={{ fontSize: "38px", fontWeight: 700, marginBottom: "8px" }}>PDSA Evidence Document</h1>
                  <div style={{ width: "80px", height: "4px", backgroundColor: TEAL, marginBottom: "28px" }} />
                  <p style={{ fontSize: "20px", marginBottom: "20px", lineHeight: 1.4 }}>{cycle.title}</p>
                  <p style={{ fontSize: "13px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>Health Center:</span> {orgName}</p>
                  <p style={{ fontSize: "13px", marginTop: "4px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>Measure / Focus Area:</span> {topic}</p>
                  <p style={{ fontSize: "13px", marginTop: "4px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>Current Stage:</span> {stageOf(cycle.status)}</p>
                  <p style={{ fontSize: "13px", marginTop: "4px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>Documentation Completeness:</span> {score}%</p>
                  <p style={{ fontSize: "13px", marginTop: "4px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>Cycle Started:</span> {cycle.start_date ? format(new Date(cycle.start_date), "MMMM d, yyyy") : format(new Date(cycle.created_at), "MMMM d, yyyy")}</p>
                  {organization.npi && <p style={{ fontSize: "13px", marginTop: "4px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>NPI:</span> {organization.npi}</p>}

                  <div style={{ marginTop: "36px", padding: "14px 18px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.05)" }}>
                    <p style={{ fontSize: "12px", color: isComplete ? "#5eead4" : "#fcd34d", fontWeight: 700, letterSpacing: "0.05em" }}>
                      {isComplete ? "COMPLETED CYCLE — FINAL RECORD" : "DRAFT — CYCLE IN PROGRESS"}
                    </p>
                    <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                      {isComplete
                        ? "All stages of this Plan-Do-Study-Act cycle have been documented and closed out."
                        : "This document reflects the cycle as of the generation date. Outstanding sections are marked."}
                    </p>
                  </div>
                </div>
                <div style={{ padding: "24px 48px", textAlign: "center" }}>
                  <p style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
                    Generated by MeasureWise on {generatedOn}.
                  </p>
                </div>
              </div>

              {/* 01 — Cycle Overview */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} docLabel={docLabel} />
                <SectionHeading label="SECTION 01 — CYCLE OVERVIEW" title="Cycle Overview" />
                <table style={tableStyle}>
                  <tbody>
                    {[
                      ["Cycle title", cycle.title],
                      ["Measure / focus area", topic],
                      ["Current stage", stageOf(cycle.status)],
                      ["Start date", cycle.start_date ? format(new Date(cycle.start_date), "MMM d, yyyy") : "Not set"],
                      ["Created", format(new Date(cycle.created_at), "MMM d, yyyy")],
                      ["Baseline rate", cycle.baseline_rate != null ? `${cycle.baseline_rate}%` : "Not recorded"],
                      ["Improvement to date", cycle.improvement_pct != null ? `${cycle.improvement_pct}%` : "Not recorded"],
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

                <div style={{ display: "flex", gap: "1px", border: `1px solid ${GRAY_BORDER}`, borderRadius: "6px", overflow: "hidden", marginTop: "32px" }}>
                  {[
                    { val: `${score}%`, label: "Documentation Complete" },
                    { val: tasks.length, label: "Linked Tasks" },
                    { val: files.length, label: "Evidence Files" },
                  ].map((m) => (
                    <div key={m.label} style={{ flex: 1, textAlign: "center", padding: "20px 16px", backgroundColor: TEAL_LIGHT }}>
                      <p style={{ fontSize: "32px", fontWeight: 700, color: TEAL }}>{m.val}</p>
                      <p style={{ fontSize: "12px", color: GRAY_TEXT }}>{m.label}</p>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={2} note={`PDSA evidence record — ${orgName}`} />
              </div>

              {/* 02 — Plan */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} docLabel={docLabel} />
                <SectionHeading label="SECTION 02 — PLAN" title="Plan" />
                <Field label="Aim statement" value={cycle.aim_statement} emptyNote={emptyNote} />
                <Field label="Root cause" value={cycle.root_cause} emptyNote={emptyNote} />
                <Field label="Target goal" value={cycle.target_goal} emptyNote={emptyNote} />
                <Field label="Prediction" value={cycle.predicted_outcome || cycle.prediction} emptyNote={emptyNote} />
                <Field label="Measurement plan" value={cycle.measurement_plan} emptyNote={emptyNote} />
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={3} note={`PDSA evidence record — ${orgName}`} />
              </div>

              {/* 03 — Do */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} docLabel={docLabel} />
                <SectionHeading label="SECTION 03 — DO" title="Do" />
                <Field label="Intervention description" value={cycle.intervention_description} emptyNote={emptyNote} />
                <Field label="Test description" value={cycle.test_description} emptyNote={emptyNote} />
                <Field label="Clinical workflow impact" value={cycle.clinical_workflow_impact} emptyNote={emptyNote} />
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={4} note={`PDSA evidence record — ${orgName}`} />
              </div>

              {/* 04 — Study */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} docLabel={docLabel} />
                <SectionHeading label="SECTION 04 — STUDY" title="Study" />
                <Field label="Actual outcome" value={cycle.actual_outcome} emptyNote={emptyNote} />
                <Field label="Study results" value={cycle.study_results} emptyNote={emptyNote} />
                <Field label="Analysis summary" value={cycle.analysis_summary} emptyNote={emptyNote} />
                <Field label="What worked" value={cycle.what_worked} emptyNote={emptyNote} />
                <Field label="What didn't work" value={cycle.what_didnt_work} emptyNote={emptyNote} />
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={5} note={`PDSA evidence record — ${orgName}`} />
              </div>

              {/* 05 — Act */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} docLabel={docLabel} />
                <SectionHeading label="SECTION 05 — ACT" title="Act" />
                <Field
                  label="Next-cycle decision"
                  value={cycle.next_cycle_decision || cycle.decision}
                  emptyNote={emptyNote}
                />
                <Field label="Next steps" value={cycle.act_next_steps} emptyNote={emptyNote} />
                <Field
                  label="Follow-on cycle"
                  value={cycle.next_cycle_id ? "A follow-on PDSA cycle has been created from this cycle." : null}
                  emptyNote="No follow-on cycle has been created yet."
                />
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={6} note={`PDSA evidence record — ${orgName}`} />
              </div>

              {/* 06 — Linked tasks */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} docLabel={docLabel} />
                <SectionHeading label="SECTION 06 — ACCOUNTABILITY" title="Linked Tasks" />
                {tasks.length === 0 ? (
                  <p style={{ fontSize: "14px", color: GRAY_TEXT, fontStyle: "italic" }}>
                    No tasks have been linked to this cycle yet.
                  </p>
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
                <PageFooter pageNum={7} note={`PDSA evidence record — ${orgName}`} />
              </div>

              {/* 07 — Attached evidence */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} docLabel={docLabel} />
                <SectionHeading label="SECTION 07 — SUPPORTING ARTIFACTS" title="Attached Evidence Files" />
                {files.length === 0 ? (
                  <p style={{ fontSize: "14px", color: GRAY_TEXT, fontStyle: "italic" }}>
                    No supporting files have been attached to this cycle yet.
                  </p>
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
                <PageFooter pageNum={8} note={`PDSA evidence record — ${orgName}`} />
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
                      "Cycle owner",
                      "Start date",
                      "Linked UDS measure or focus area",
                      "Baseline rate",
                      "Predicted outcome",
                      "Intervention description",
                      "Aim statement",
                      "Measurement plan",
                      ...(isComplete ? ["Actual outcome", "Next-cycle decision (Adapt/Adopt/Abandon)"] : []),
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
                  Overall documentation completeness for this cycle is <strong>{score}%</strong>.
                  {missing.length > 0
                    ? ` Outstanding items: ${missing.join(", ")}.`
                    : " All required documentation elements are present."}
                </p>
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={9} note={`PDSA evidence record — ${orgName}`} />
              </div>

              {/* Appendix — Disclaimer */}
              <div style={{ ...pageStyle, pageBreakAfter: "auto" }}>
                <PageHeader orgName={orgName} docLabel={docLabel} />
                <SectionHeading label="APPENDIX — DISCLAIMER" title="About This Document" />
                <p style={{ fontSize: "14px", lineHeight: 1.7, marginBottom: "16px" }}>
                  This document was generated by MeasureWise on {generatedOn} for {orgName}. It reflects the
                  Plan-Do-Study-Act cycle titled “{cycle.title}” exactly as recorded in the platform at the time
                  of generation.
                </p>
                <p style={{ fontSize: "14px", lineHeight: 1.7, marginBottom: "16px" }}>
                  Sections marked as not yet documented indicate work still in progress and are shown
                  deliberately so reviewers can see the current state of the cycle rather than an incomplete
                  picture. Regenerate this document at any point to capture updated content.
                </p>
                <p style={{ fontSize: "14px", lineHeight: 1.7 }}>
                  MeasureWise does not store protected health information. All content herein is
                  aggregate quality-improvement documentation intended for internal review, HRSA Operational
                  Site Visit preparation, and accreditation evidence.
                </p>
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={10} note={`PDSA evidence record — ${orgName}`} />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
