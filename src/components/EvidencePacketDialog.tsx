import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTierLimits } from "@/hooks/useTierLimits";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { CalendarIcon, FileText, Loader2, Download } from "lucide-react";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface EvidenceCycle {
  id: string;
  title: string;
  status: string;
  uds_measure: string | null;
  root_cause: string | null;
  target_goal: string | null;
  clinical_workflow_impact: string | null;
  assigned_staff: string[] | null;
  improvement_pct: number | null;
  created_at: string;
  aim_statement: string | null;
  prediction: string | null;
  measurement_plan: string | null;
  test_description: string | null;
  analysis_summary: string | null;
  decision: string | null;
  study_results: string | null;
  what_worked: string | null;
  what_didnt_work: string | null;
  act_next_steps: string | null;
}

interface EvidenceTask {
  id: string;
  pdsa_cycle_id: string | null;
  title: string;
  status: string;
  assigned_role: string | null;
  due_date: string | null;
  acknowledged: boolean;
}

function getFiscalYearStart(): Date {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(year, 6, 1);
}

function getFiscalYearEnd(): Date {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  return new Date(year, 5, 30);
}

// Shared styles
const TEAL = "#0e7490";
const TEAL_LIGHT = "#eaf6f5";
const GRAY_BORDER = "#e5e7eb";
const GRAY_TEXT = "#6b7280";

const headerBarStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "12px 0", borderBottom: `3px solid ${TEAL}`, marginBottom: "40px",
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: "12px", fontWeight: 700, color: TEAL, letterSpacing: "0.05em", marginBottom: "12px",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "28px", fontWeight: 700, color: "#1a1a1a", marginBottom: "4px",
};

const tealUnderline: React.CSSProperties = {
  width: "60px", height: "4px", backgroundColor: TEAL, marginBottom: "28px", marginTop: "8px",
};

const footerStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", fontSize: "11px", color: GRAY_TEXT,
  borderTop: `2px solid ${GRAY_BORDER}`, paddingTop: "8px", marginTop: "auto",
};

const thStyle: React.CSSProperties = {
  textAlign: "left", padding: "10px 12px", fontWeight: 600, fontSize: "13px",
  backgroundColor: TEAL, color: "#fff",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px", fontSize: "13px", borderBottom: `1px solid ${GRAY_BORDER}`,
};

const tableStyle: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", border: `1px solid ${GRAY_BORDER}`, borderRadius: "6px",
};

const pageStyle: React.CSSProperties = {
  width: "800px", minHeight: "1050px", padding: "40px 48px", background: "#fff", color: "#1a1a1a",
  fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", flexDirection: "column",
  pageBreakAfter: "always" as const,
};

function PageHeader({ orgName }: { orgName: string }) {
  return (
    <div style={headerBarStyle}>
      <span style={{ fontWeight: 700, fontSize: "14px" }}>MeasureWise</span>
      <span style={{ fontSize: "12px", color: GRAY_TEXT }}>HRSA Audit Binder — {orgName}</span>
    </div>
  );
}

function PageFooter({ pageNum }: { pageNum: number }) {
  return (
    <div style={footerStyle}>
      <span>Confidential — For demonstration purposes only</span>
      <span>Page {pageNum}</span>
    </div>
  );
}

function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <>
      <p style={sectionLabelStyle}>{label}</p>
      <h1 style={sectionTitleStyle}>{title}</h1>
      <div style={tealUnderline} />
    </>
  );
}

export default function EvidencePacketDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { organization } = useOrg();
  const { isFreeTier } = useTierLimits();
  const [startDate, setStartDate] = useState<Date>(getFiscalYearStart());
  const [endDate, setEndDate] = useState<Date>(getFiscalYearEnd());
  const [exporting, setExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: allCycles = [] } = useQuery({
    queryKey: ["evidence-cycles", organization.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("pdsa_cycles")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at");
      return (data || []) as EvidenceCycle[];
    },
    enabled: open && !!organization.id,
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ["evidence-tasks", organization.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("organization_id", organization.id);
      return (data || []) as EvidenceTask[];
    },
    enabled: open && !!organization.id,
  });

  const filteredCycles = allCycles.filter((c) => {
    const d = new Date(c.created_at);
    return d >= startDate && d <= endDate;
  });

  const activeCycles = filteredCycles.filter((c) => c.status !== "completed");
  const completedCycles = filteredCycles.filter((c) => c.status === "completed");
  const uniqueMeasures = [...new Set(filteredCycles.map((c) => c.uds_measure).filter(Boolean))];
  const allStaff = [...new Set(filteredCycles.flatMap((c) => c.assigned_staff || []))];
  const openTasks = allTasks.filter((t) => t.status !== "completed");

  const handleGenerate = useCallback(async () => {
    if (!confirmDemoExport(isDemo, "The PCMH evidence packet")) return;
    setShowPreview(true);
    await new Promise((r) => setTimeout(r, 600));
    if (!printRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const pdf = new jsPDF("p", "in", "letter");
      const pdfWidth = 8.5;
      const pdfHeight = 11;
      const margin = 0.5;
      const imgWidth = pdfWidth - margin * 2;
      const pageContentHeight = pdfHeight - margin * 2;
      const scale = imgWidth / canvas.width;
      const pageHeightInPx = pageContentHeight / scale;

      let yOffset = 0;
      let pageIndex = 0;

      while (yOffset < canvas.height) {
        if (pageIndex > 0) pdf.addPage("letter", "p");
        const sliceHeight = Math.min(pageHeightInPx, canvas.height - yOffset);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext("2d");
        if (ctx) ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        const pageImg = pageCanvas.toDataURL("image/png");
        const drawHeight = sliceHeight * scale;
        pdf.addImage(pageImg, "PNG", margin, margin, imgWidth, drawHeight, undefined, "FAST");

        if (isFreeTier) {
          pdf.setFontSize(50);
          pdf.setTextColor(200, 200, 200);
          pdf.saveGraphicsState();
          pdf.text("SAMPLE — UPGRADE TO REMOVE", pdfWidth / 2, pdfHeight / 2, { align: "center", angle: 45 });
          pdf.restoreGraphicsState();
          pdf.setTextColor(0, 0, 0);
        }

        yOffset += sliceHeight;
        pageIndex++;
      }

      const dateStr = format(new Date(), "yyyy-MM-dd");
      pdf.save(`HRSA_Audit_Binder_${dateStr}.pdf`);
      toast.success(`Audit binder exported (${pageIndex} pages)`);
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  }, [isFreeTier]);

  const orgName = organization.name || "Health Center";
  const reportPeriod = `${format(startDate, "MMMM d, yyyy")} – ${format(endDate, "MMMM d, yyyy")}`;

  // Determine audit readiness items dynamically
  const auditChecklist = [
    { area: "Written QI activities documented", present: filteredCycles.length > 0 ? "Yes" : "No", notes: filteredCycles.length > 0 ? "PDSA logs included" : "No cycles in period" },
    { area: "Measure trends reviewed", present: uniqueMeasures.length > 0 ? "Yes" : "No", notes: uniqueMeasures.length > 0 ? "Quarterly snapshot included" : "No measures tracked" },
    { area: "Committee oversight documented", present: filteredCycles.length > 0 ? "Yes" : "No", notes: "Minutes and decisions summarized" },
    { area: "Assigned accountability visible", present: allStaff.length > 0 ? "Yes" : "No", notes: allStaff.length > 0 ? "Owners listed on tasks and projects" : "No staff assigned" },
    { area: "Improvement actions tracked to closure", present: openTasks.length > 0 ? "Partial" : "Yes", notes: openTasks.length > 0 ? `${openTasks.length} open items remain` : "All tasks closed" },
    { area: "Supporting artifacts centrally organized", present: "Yes", notes: "Evidence register maintained" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setShowPreview(false); onClose(); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            HRSA / PCMH Audit Binder
          </DialogTitle>
          <DialogDescription>
            Generate a comprehensive audit-ready binder for all QI activity within a date range.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[160px] justify-start text-left text-sm", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[160px] justify-start text-left text-sm", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium mb-2">Binder will include:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div><p className="text-2xl font-bold text-primary">{filteredCycles.length}</p><p className="text-xs text-muted-foreground">PDSA Projects</p></div>
              <div><p className="text-2xl font-bold text-success">{completedCycles.length}</p><p className="text-xs text-muted-foreground">Completed</p></div>
              <div><p className="text-2xl font-bold text-foreground">{uniqueMeasures.length}</p><p className="text-xs text-muted-foreground">Measures</p></div>
              <div><p className="text-2xl font-bold text-foreground">{allTasks.length}</p><p className="text-xs text-muted-foreground">Tasks</p></div>
            </div>
          </div>
        </div>

        {/* Hidden printable binder */}
        {showPreview && (
          <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
            <div ref={printRef} style={{ background: "#fff" }}>

              {/* PAGE 1: Cover */}
              <div style={{ width: "800px", minHeight: "1050px", padding: "0", background: "#1a2e3b", color: "#fff", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "28px 48px 16px", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
                  <p style={{ fontSize: "20px", fontWeight: 700 }}>MeasureWise</p>
                  <p style={{ fontSize: "12px", color: "#5eead4", marginTop: "2px" }}>HRSA • PCMH • UDS Quality Intelligence</p>
                </div>
                <div style={{ flex: 1, padding: "0 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <p style={{ fontSize: "16px", color: "#94a3b8", marginBottom: "4px" }}>HRSA / PCMH</p>
                  <h1 style={{ fontSize: "42px", fontWeight: 700, marginBottom: "8px" }}>Audit Binder</h1>
                  <div style={{ width: "80px", height: "4px", backgroundColor: TEAL, marginBottom: "28px" }} />
                  <p style={{ fontSize: "18px", marginBottom: "24px" }}>{orgName}</p>
                  <p style={{ fontSize: "13px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>Reporting Period:</span> {reportPeriod}</p>
                  <p style={{ fontSize: "13px", marginTop: "4px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>Document Type:</span> HRSA Audit Binder</p>
                  <p style={{ fontSize: "13px", marginTop: "4px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>Prepared In:</span> MeasureWise</p>
                  {organization.npi && <p style={{ fontSize: "13px", marginTop: "4px" }}><span style={{ color: "#5eead4", fontWeight: 600 }}>NPI:</span> {organization.npi}</p>}

                  <div style={{ display: "flex", gap: "1px", marginTop: "40px", border: `1px solid rgba(255,255,255,0.2)`, borderRadius: "6px", overflow: "hidden" }}>
                    {["HRSA Chapter 10 Aligned", "NCQA PCMH Q-PASS Ready", "UDS-Friendly Reporting"].map((badge) => (
                      <div key={badge} style={{ flex: 1, padding: "12px 16px", fontSize: "12px", color: "#94a3b8", textAlign: "center", backgroundColor: "rgba(255,255,255,0.05)" }}>{badge}</div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "24px 48px", textAlign: "center" }}>
                  <p style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
                    Generated by MeasureWise on {format(new Date(), "MMMM d, yyyy")}. All data reflects the selected reporting period.
                  </p>
                </div>
              </div>

              {/* PAGE 2: Table of Contents */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} />
                <p style={sectionLabelStyle}>CONTENTS</p>
                <h1 style={sectionTitleStyle}>What's Inside</h1>
                <div style={{ ...tealUnderline, width: "100%" }} />
                <div style={{ marginTop: "8px" }}>
                  {[
                    { num: "01", label: "Executive Overview" },
                    { num: "02", label: "Quality Infrastructure Summary" },
                    { num: "03", label: "Measure Monitoring Snapshot" },
                    { num: "04", label: "Active PDSA Cycle Summaries" },
                    { num: "05", label: "Detailed PDSA Documentation" },
                    { num: "06", label: "Evidence & Task Tracking" },
                    { num: "07", label: "Meeting Documentation" },
                    { num: "08", label: "Audit Readiness Checklist" },
                    { num: "A", label: "Appendix A: Folder Structure" },
                    { num: "B", label: "Appendix B: Disclaimer" },
                  ].map((item) => (
                    <div key={item.num} style={{ display: "flex", gap: "32px", padding: "14px 0", borderBottom: `1px solid ${GRAY_BORDER}` }}>
                      <span style={{ fontWeight: 700, color: TEAL, fontSize: "14px", minWidth: "32px" }}>{item.num}</span>
                      <span style={{ fontSize: "14px" }}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={2} />
              </div>

              {/* PAGE 3: Section 01 — Executive Overview */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} />
                <SectionHeading label="SECTION 01 — EXECUTIVE OVERVIEW" title="Executive Overview" />
                <p style={{ fontSize: "14px", lineHeight: "1.7", marginBottom: "16px" }}>
                  {orgName} operates a structured quality improvement program designed to support regulatory readiness, clinical measure performance, and team accountability across care operations. The organization uses standardized PDSA documentation, assigned task ownership, recurring review cadences, and centralized evidence storage.
                </p>
                <p style={{ fontSize: "14px", lineHeight: "1.7", marginBottom: "32px" }}>
                  During the reporting period, the quality team focused on {uniqueMeasures.length > 0 ? `${uniqueMeasures.length} clinical measure(s)` : "clinical measure performance"} through {filteredCycles.length} active project(s) tracked with defined aim statements, predictions, intervention testing, data review, and next-step decisions.
                </p>
                <div style={{ display: "flex", gap: "1px", border: `1px solid ${GRAY_BORDER}`, borderRadius: "6px", overflow: "hidden" }}>
                  {[
                    { val: filteredCycles.length, label: "Active PDSA Projects" },
                    { val: uniqueMeasures.length, label: "Measures Monitored" },
                    { val: allTasks.length, label: "Evidence Items Tracked" },
                  ].map((m) => (
                    <div key={m.label} style={{ flex: 1, textAlign: "center", padding: "20px 16px", backgroundColor: TEAL_LIGHT }}>
                      <p style={{ fontSize: "36px", fontWeight: 700, color: TEAL }}>{m.val}</p>
                      <p style={{ fontSize: "12px", color: GRAY_TEXT }}>{m.label}</p>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={3} />
              </div>

              {/* PAGE 4: Section 02 — Quality Infrastructure */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} />
                <SectionHeading label="SECTION 02 — QUALITY INFRASTRUCTURE" title="Quality Infrastructure Summary" />
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: TEAL, marginBottom: "12px" }}>Leadership and Oversight</h3>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      {["Area", "Owner", "Review Frequency", "Documentation Location"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Quality program oversight", "Director of Quality Improvement", "Monthly", "QI Committee folder"],
                      ["PDSA cycle coordination", "PCMH Coordinator", "Biweekly", "MeasureWise project workspace"],
                      ["Measure review", "Clinical Operations Manager", "Monthly", "UDS dashboard export"],
                      ["Evidence collection", "Compliance and Accreditation Lead", "Ongoing", "Q-PASS evidence library"],
                    ].map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => <td key={j} style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: TEAL, marginTop: "28px", marginBottom: "12px" }}>Standard Workflow</h3>
                <ol style={{ fontSize: "13px", lineHeight: "2", paddingLeft: "20px", color: "#374151" }}>
                  <li>Identify priority gap or audit risk.</li>
                  <li>Open or update a PDSA project.</li>
                  <li>Assign interventions and owners.</li>
                  <li>Review data trend and implementation status.</li>
                  <li>Document decision to adopt, adapt, or abandon.</li>
                  <li>Export binder-ready evidence packet for leadership or survey review.</li>
                </ol>
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={4} />
              </div>

              {/* PAGE 5: Section 03 — Measure Monitoring Snapshot */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} />
                <SectionHeading label="SECTION 03 — MEASURE MONITORING" title="Measure Monitoring Snapshot" />
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: TEAL, marginBottom: "12px" }}>
                  Performance Summary — {format(startDate, "MMM yyyy")} to {format(endDate, "MMM yyyy")}
                </h3>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      {["Measure", "Baseline", "Current", "Target", "Status"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCycles.length > 0 ? filteredCycles.map((c, i) => (
                      <tr key={c.id}>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{c.uds_measure?.split(":").pop()?.trim() || c.title}</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{c.target_goal ? "—" : "—"}</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{c.improvement_pct ? `+${c.improvement_pct}%` : "—"}</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{c.target_goal || "—"}</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                          <span style={{ color: c.improvement_pct && c.improvement_pct > 0 ? "#059669" : GRAY_TEXT }}>
                            {c.improvement_pct && c.improvement_pct > 0 ? "Improving" : c.status === "completed" ? "Completed" : "In Progress"}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: GRAY_TEXT }}>No measures tracked in this period</td></tr>
                    )}
                  </tbody>
                </table>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: TEAL, marginTop: "28px", marginBottom: "8px" }}>Observations</h3>
                <p style={{ fontSize: "13px", lineHeight: "1.7", color: "#374151" }}>
                  Performance review identified {filteredCycles.filter(c => c.improvement_pct && c.improvement_pct > 0).length > 0 ? "positive movement" : "areas for improvement"} in screening and chronic disease workflows. Remaining gaps were tied primarily to documentation variation, overdue follow-up, and inconsistent staff handoff practices.
                </p>
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={5} />
              </div>

              {/* PAGE 6: Section 04 — Active PDSA Cycle Summaries */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} />
                <SectionHeading label="SECTION 04 — ACTIVE PROJECTS" title="Active PDSA Cycle Summaries" />
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      {["Project", "Aim", "Owner", "Start", "Stage", "Decision"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCycles.length > 0 ? filteredCycles.map((c, i) => (
                      <tr key={c.id}>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb", fontWeight: 500 }}>{c.title}</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb", fontSize: "12px" }}>{c.aim_statement || c.target_goal || "—"}</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{(c.assigned_staff || [])[0] || "—"}</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{format(new Date(c.created_at), "yyyy-MM-dd")}</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{c.decision || "—"}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: GRAY_TEXT }}>No cycles in this period</td></tr>
                    )}
                  </tbody>
                </table>
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={6} />
              </div>

              {/* PAGES 7+: Section 05 — Detailed PDSA Documentation */}
              {filteredCycles.map((cycle, idx) => (
                <div key={cycle.id} style={pageStyle}>
                  <PageHeader orgName={orgName} />
                  {idx === 0 && <SectionHeading label="SECTION 05 — DETAILED DOCUMENTATION" title="Detailed PDSA Documentation" />}
                  <p style={{ fontSize: "12px", color: GRAY_TEXT, marginBottom: "4px" }}>Project {idx + 1}</p>
                  <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a1a", marginBottom: "16px" }}>{cycle.title}</h2>

                  {/* Aim & Problem */}
                  <table style={{ ...tableStyle, marginBottom: "16px" }}>
                    <thead><tr><th style={thStyle}>Aim</th><th style={thStyle}>Problem Statement</th></tr></thead>
                    <tbody><tr>
                      <td style={{ ...tdStyle, width: "50%", verticalAlign: "top" }}>{cycle.aim_statement || cycle.target_goal || "—"}</td>
                      <td style={{ ...tdStyle, width: "50%", verticalAlign: "top" }}>{cycle.root_cause || "—"}</td>
                    </tr></tbody>
                  </table>

                  {/* Plan table */}
                  <table style={{ ...tableStyle, marginBottom: "16px" }}>
                    <thead><tr><th style={thStyle}>Element</th><th style={thStyle}>Documentation</th></tr></thead>
                    <tbody>
                      {[
                        ["Change idea", cycle.test_description || cycle.clinical_workflow_impact || "—"],
                        ["Prediction", cycle.prediction || "—"],
                        ["Population", cycle.measurement_plan || "—"],
                        ["Timeline", `Started ${format(new Date(cycle.created_at), "MMM d, yyyy")}`],
                      ].map(([label, val], i) => (
                        <tr key={label}>
                          <td style={{ ...tdStyle, fontWeight: 600, width: "30%", backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{label}</td>
                          <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* PDSA phases */}
                  <table style={tableStyle}>
                    <thead><tr><th style={thStyle}>Phase</th><th style={thStyle}>Documentation</th></tr></thead>
                    <tbody>
                      {[
                        ["Do", cycle.test_description || "—"],
                        ["Study", cycle.study_results || cycle.analysis_summary || "—"],
                        ["Act", cycle.act_next_steps || cycle.decision || "—"],
                      ].map(([phase, val], i) => (
                        <tr key={phase}>
                          <td style={{ ...tdStyle, fontWeight: 600, width: "15%", backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{phase}</td>
                          <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ flex: 1 }} />
                  <PageFooter pageNum={7 + idx} />
                </div>
              ))}

              {/* Section 06 — Evidence & Task Tracking */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} />
                <SectionHeading label="SECTION 06 — EVIDENCE & TASKS" title="Evidence and Task Tracking" />

                <h3 style={{ fontSize: "16px", fontWeight: 600, color: TEAL, marginBottom: "12px" }}>Evidence Register</h3>
                <table style={{ ...tableStyle, marginBottom: "28px" }}>
                  <thead>
                    <tr>
                      {["Evidence Item", "Related Standard / Use", "Owner", "Status"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCycles.map((c, i) => (
                      <tr key={c.id}>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{c.title} logs</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>Improvement methodology evidence</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{(c.assigned_staff || [])[0] || "QI Team"}</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{c.status === "completed" ? "Complete" : "In progress"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 style={{ fontSize: "16px", fontWeight: 600, color: TEAL, marginBottom: "12px" }}>Open Tasks</h3>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      {["Task", "Owner", "Due Date", "Status"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {openTasks.length > 0 ? openTasks.slice(0, 10).map((t, i) => (
                      <tr key={t.id}>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{t.title}</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{t.assigned_role || "—"}</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{t.due_date || "—"}</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{t.status}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} style={{ ...tdStyle, textAlign: "center", color: GRAY_TEXT }}>No open tasks</td></tr>
                    )}
                  </tbody>
                </table>
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={7 + Math.max(filteredCycles.length, 1)} />
              </div>

              {/* Section 07 — Meeting Documentation */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} />
                <SectionHeading label="SECTION 07 — MEETING DOCUMENTATION" title="QI Committee Meeting Snapshot" />
                <table style={{ ...tableStyle, marginBottom: "24px" }}>
                  <thead><tr><th style={thStyle}>Meeting Date</th><th style={thStyle}>Chair</th><th style={thStyle}>Attendees</th></tr></thead>
                  <tbody>
                    <tr>
                      <td style={tdStyle}>{format(endDate, "MMMM d, yyyy")}</td>
                      <td style={tdStyle}>Director of Quality Improvement</td>
                      <td style={tdStyle}>{allStaff.length > 0 ? allStaff.join(", ") : "QI Team Members"}</td>
                    </tr>
                  </tbody>
                </table>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: TEAL, marginBottom: "8px" }}>Agenda Summary</h3>
                <ul style={{ fontSize: "13px", lineHeight: "2", paddingLeft: "20px", color: "#374151", marginBottom: "20px" }}>
                  <li>Reviewed quarterly preventive screening trends</li>
                  <li>Assessed progress of active PDSA cycles</li>
                  <li>Confirmed documentation gaps needing follow-up before leadership review</li>
                  <li>Approved revised workflows for next test cycle</li>
                </ul>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: TEAL, marginBottom: "8px" }}>Key Decisions</h3>
                <ul style={{ fontSize: "13px", lineHeight: "2", paddingLeft: "20px", color: "#374151" }}>
                  {filteredCycles.filter(c => c.decision).map((c) => (
                    <li key={c.id}>{c.title}: {c.decision}</li>
                  ))}
                  {filteredCycles.filter(c => c.decision).length === 0 && <li>No decisions recorded for this period</li>}
                </ul>
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={8 + Math.max(filteredCycles.length, 1)} />
              </div>

              {/* Section 08 — Audit Readiness Checklist */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} />
                <SectionHeading label="SECTION 08 — AUDIT READINESS" title="Audit Readiness Checklist" />
                <table style={{ ...tableStyle, marginBottom: "28px" }}>
                  <thead>
                    <tr>
                      {["Requirement Area", "Evidence Present", "Notes"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {auditChecklist.map((item, i) => (
                      <tr key={item.area}>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{item.area}</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{item.present}</td>
                        <td style={{ ...tdStyle, backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>{item.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ padding: "16px 20px", border: `1px solid ${TEAL}`, borderRadius: "8px", backgroundColor: TEAL_LIGHT }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: TEAL, marginBottom: "6px" }}>Note for Prospects</p>
                  <p style={{ fontSize: "12px", lineHeight: "1.7", color: "#374151" }}>
                    A live MeasureWise export could include date-filtered project logs, attached supporting files, full task histories, SPC or trend visuals, site-specific comparisons, and print-ready appendix sections. This format works best when paired with a short explanation of how the binder is generated: select date range, choose site or project, export structured documentation, and walk into the review with one organized packet.
                  </p>
                </div>
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={9 + Math.max(filteredCycles.length, 1)} />
              </div>

              {/* Appendices */}
              <div style={pageStyle}>
                <PageHeader orgName={orgName} />
                <p style={sectionLabelStyle}>APPENDIX A</p>
                <h1 style={sectionTitleStyle}>Sample Folder Structure</h1>
                <div style={tealUnderline} />
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>Audit Binder</h3>
                <div style={{ paddingLeft: "8px" }}>
                  {["01 Executive Overview", "02 Quality Infrastructure", "03 Measure Trends", "04 PDSA Cycle Summaries", "05 Detailed PDSA Logs", "06 Evidence Register", "07 Committee Minutes", "08 Supporting Documents"].map((f) => (
                    <p key={f} style={{ fontSize: "13px", lineHeight: "2.2", color: "#374151" }}>📁 {f}</p>
                  ))}
                </div>

                <div style={{ marginTop: "40px" }}>
                  <p style={sectionLabelStyle}>APPENDIX B</p>
                  <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px" }}>Suggested Disclaimer for Website Use</h2>
                  <div style={{ padding: "16px 20px", borderLeft: `4px solid ${TEAL}`, backgroundColor: "#f8fafc", borderRadius: "4px" }}>
                    <p style={{ fontSize: "13px", lineHeight: "1.7", color: "#374151", fontStyle: "italic" }}>
                      "This sample binder is for demonstration only and uses fictional data. Actual exports vary based on clinic setup, active projects, reporting period, and enabled MeasureWise features."
                    </p>
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                <PageFooter pageNum={10 + Math.max(filteredCycles.length, 1)} />
              </div>

            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button
            onClick={handleGenerate}
            disabled={exporting || filteredCycles.length === 0}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {exporting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
            ) : (
              <><Download className="h-4 w-4 mr-2" />Generate Audit Binder</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
