import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  return new Date(year, 6, 1); // Jul 1
}

function getFiscalYearEnd(): Date {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  return new Date(year, 5, 30); // Jun 30
}

export default function EvidencePacketDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { organization } = useOrg();
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

  const completedCycles = filteredCycles.filter((c) => c.status === "completed");
  const uniqueMeasures = [...new Set(filteredCycles.map((c) => c.uds_measure).filter(Boolean))];
  const allStaff = [...new Set(filteredCycles.flatMap((c) => c.assigned_staff || []))];
  const totalImprovement = completedCycles.reduce((sum, c) => sum + (c.improvement_pct || 0), 0);

  const handleGenerate = useCallback(async () => {
    setShowPreview(true);
    // Wait for render
    await new Promise((r) => setTimeout(r, 500));

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
        if (ctx) {
          ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        }
        const pageImg = pageCanvas.toDataURL("image/png");
        const drawHeight = sliceHeight * scale;
        pdf.addImage(pageImg, "PNG", margin, margin, imgWidth, drawHeight, undefined, "FAST");
        yOffset += sliceHeight;
        pageIndex++;
      }

      const dateStr = format(new Date(), "yyyy-MM-dd");
      pdf.save(`HRSA_Evidence_Packet_${dateStr}.pdf`);
      toast.success(`Evidence packet exported (${pageIndex} pages)`);
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  }, []);

  // Helper to find linked cycles (v2, v3, etc.)
  const findLinkedCycles = (cycle: EvidenceCycle) => {
    return filteredCycles.filter(
      (c) => c.id !== cycle.id && c.title.startsWith(cycle.title.replace(/ \(v\d+\)$/, ""))
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setShowPreview(false); onClose(); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            HRSA / NCQA Evidence Packet
          </DialogTitle>
          <DialogDescription>
            Generate a comprehensive audit-ready binder for all QI activity within a date range.
          </DialogDescription>
        </DialogHeader>

        {/* Date range + summary */}
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

          {/* Preview summary */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium mb-2">Packet will include:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{filteredCycles.length}</p>
                <p className="text-xs text-muted-foreground">Total Cycles</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{completedCycles.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{uniqueMeasures.length}</p>
                <p className="text-xs text-muted-foreground">UDS Measures</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{allStaff.length}</p>
                <p className="text-xs text-muted-foreground">Staff Roles</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden printable content */}
        {showPreview && (
          <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
            <div ref={printRef} style={{ width: "800px", padding: "32px", background: "#fff", color: "#000", fontFamily: "system-ui, -apple-system, sans-serif" }}>
              {/* 1. Cover Page */}
              <div style={{ textAlign: "center", paddingTop: "120px", paddingBottom: "120px", borderBottom: "3px solid #0e7490" }}>
                <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>HRSA / NCQA Evidence Packet</h1>
                <h2 style={{ fontSize: "22px", fontWeight: "600", color: "#0e7490", marginBottom: "16px" }}>{organization.name}</h2>
                {organization.npi && <p style={{ fontSize: "14px", color: "#6b7280" }}>NPI: {organization.npi}</p>}
                <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "8px" }}>
                  {format(startDate, "MMMM d, yyyy")} — {format(endDate, "MMMM d, yyyy")}
                </p>
                <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "24px" }}>
                  Generated: {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
                </p>
                <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
                  Prepared by MeasureWise
                </p>
              </div>

              {/* 2. Executive Summary */}
              <div style={{ marginTop: "40px", paddingBottom: "24px", borderBottom: "1px solid #e5e7eb" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#0e7490" }}>Executive Summary</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
                  <div style={{ textAlign: "center", padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                    <p style={{ fontSize: "28px", fontWeight: "bold", color: "#0e7490" }}>{filteredCycles.length}</p>
                    <p style={{ fontSize: "12px", color: "#6b7280" }}>Total PDSA Cycles</p>
                  </div>
                  <div style={{ textAlign: "center", padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                    <p style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{completedCycles.length}</p>
                    <p style={{ fontSize: "12px", color: "#6b7280" }}>Completed</p>
                  </div>
                  <div style={{ textAlign: "center", padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                    <p style={{ fontSize: "28px", fontWeight: "bold" }}>{uniqueMeasures.length}</p>
                    <p style={{ fontSize: "12px", color: "#6b7280" }}>UDS Measures Addressed</p>
                  </div>
                  <div style={{ textAlign: "center", padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                    <p style={{ fontSize: "28px", fontWeight: "bold", color: "#059669" }}>{totalImprovement > 0 ? `+${totalImprovement}%` : "—"}</p>
                    <p style={{ fontSize: "12px", color: "#6b7280" }}>Total Improvement</p>
                  </div>
                </div>
                <div style={{ marginTop: "16px" }}>
                  <p style={{ fontSize: "13px", color: "#374151" }}>
                    <strong>Measures addressed:</strong> {uniqueMeasures.join(", ") || "None"}
                  </p>
                  <p style={{ fontSize: "13px", color: "#374151", marginTop: "4px" }}>
                    <strong>Staff involved:</strong> {allStaff.join(", ") || "None"}
                  </p>
                </div>
              </div>

              {/* 3. QI Activity Log */}
              <div style={{ marginTop: "32px", paddingBottom: "24px", borderBottom: "1px solid #e5e7eb" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#0e7490" }}>QI Activity Log</h2>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #d1d5db" }}>
                      <th style={{ textAlign: "left", padding: "8px", fontWeight: "600" }}>Title</th>
                      <th style={{ textAlign: "left", padding: "8px", fontWeight: "600" }}>UDS Measure</th>
                      <th style={{ textAlign: "left", padding: "8px", fontWeight: "600" }}>Started</th>
                      <th style={{ textAlign: "left", padding: "8px", fontWeight: "600" }}>Status</th>
                      <th style={{ textAlign: "left", padding: "8px", fontWeight: "600" }}>Decision</th>
                      <th style={{ textAlign: "right", padding: "8px", fontWeight: "600" }}>Improvement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCycles.map((c, i) => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                        <td style={{ padding: "8px" }}>{c.title}</td>
                        <td style={{ padding: "8px" }}>{c.uds_measure?.split(":")[0] || "—"}</td>
                        <td style={{ padding: "8px" }}>{format(new Date(c.created_at), "MMM d, yyyy")}</td>
                        <td style={{ padding: "8px" }}>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            fontSize: "11px",
                            fontWeight: "600",
                            backgroundColor: c.status === "completed" ? "#d1fae5" : "#e0e7ff",
                            color: c.status === "completed" ? "#065f46" : "#3730a3",
                          }}>
                            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: "8px" }}>{c.decision || "—"}</td>
                        <td style={{ padding: "8px", textAlign: "right", color: c.improvement_pct ? "#059669" : "#6b7280" }}>
                          {c.improvement_pct ? `+${c.improvement_pct}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4. Cycle Detail Pages */}
              {completedCycles.map((cycle, idx) => {
                const cycleTasks = allTasks.filter((t) => t.pdsa_cycle_id === cycle.id);
                const linkedCycles = findLinkedCycles(cycle);

                return (
                  <div key={cycle.id} style={{ marginTop: "40px", paddingBottom: "24px", borderBottom: "1px solid #e5e7eb" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "4px", color: "#0e7490" }}>
                      Cycle {idx + 1}: {cycle.title}
                    </h2>
                    <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "16px" }}>
                      {cycle.uds_measure} | Started {format(new Date(cycle.created_at), "MMM d, yyyy")} | Decision: {cycle.decision || "—"}
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      {cycle.aim_statement && (
                        <div style={{ padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                          <p style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", marginBottom: "4px" }}>AIM STATEMENT</p>
                          <p style={{ fontSize: "13px" }}>{cycle.aim_statement}</p>
                        </div>
                      )}
                      {cycle.prediction && (
                        <div style={{ padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                          <p style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", marginBottom: "4px" }}>PREDICTION</p>
                          <p style={{ fontSize: "13px" }}>{cycle.prediction}</p>
                        </div>
                      )}
                      {cycle.root_cause && (
                        <div style={{ padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                          <p style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", marginBottom: "4px" }}>ROOT CAUSE</p>
                          <p style={{ fontSize: "13px" }}>{cycle.root_cause}</p>
                        </div>
                      )}
                      {cycle.measurement_plan && (
                        <div style={{ padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                          <p style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", marginBottom: "4px" }}>MEASUREMENT PLAN</p>
                          <p style={{ fontSize: "13px" }}>{cycle.measurement_plan}</p>
                        </div>
                      )}
                      {cycle.test_description && (
                        <div style={{ padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                          <p style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", marginBottom: "4px" }}>TEST DESCRIPTION</p>
                          <p style={{ fontSize: "13px" }}>{cycle.test_description}</p>
                        </div>
                      )}
                      {cycle.target_goal && (
                        <div style={{ padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                          <p style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", marginBottom: "4px" }}>TARGET GOAL & RESULT</p>
                          <p style={{ fontSize: "13px" }}>{cycle.target_goal}</p>
                          {cycle.improvement_pct && (
                            <p style={{ fontSize: "13px", color: "#059669", fontWeight: "600", marginTop: "4px" }}>
                              ✓ Achieved {cycle.improvement_pct}% improvement
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {cycle.clinical_workflow_impact && (
                      <div style={{ marginTop: "12px", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                        <p style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", marginBottom: "4px" }}>CLINICAL WORKFLOW IMPACT</p>
                        <p style={{ fontSize: "13px" }}>{cycle.clinical_workflow_impact}</p>
                      </div>
                    )}

                    {cycle.analysis_summary && (
                      <div style={{ marginTop: "12px", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                        <p style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", marginBottom: "4px" }}>ANALYSIS</p>
                        <p style={{ fontSize: "13px" }}>{cycle.analysis_summary}</p>
                      </div>
                    )}

                    {/* 5. Task Completion Evidence */}
                    {cycleTasks.length > 0 && (
                      <div style={{ marginTop: "12px" }}>
                        <p style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", marginBottom: "8px" }}>TASK COMPLETION EVIDENCE</p>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                              <th style={{ textAlign: "left", padding: "6px" }}>Task</th>
                              <th style={{ textAlign: "left", padding: "6px" }}>Role</th>
                              <th style={{ textAlign: "left", padding: "6px" }}>Due</th>
                              <th style={{ textAlign: "center", padding: "6px" }}>Status</th>
                              <th style={{ textAlign: "center", padding: "6px" }}>Acknowledged</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cycleTasks.map((t) => (
                              <tr key={t.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                <td style={{ padding: "6px" }}>{t.title}</td>
                                <td style={{ padding: "6px" }}>{t.assigned_role || "—"}</td>
                                <td style={{ padding: "6px" }}>{t.due_date ? format(new Date(t.due_date), "MMM d") : "—"}</td>
                                <td style={{ padding: "6px", textAlign: "center" }}>
                                  <span style={{
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    backgroundColor: t.status === "completed" ? "#d1fae5" : t.status === "in_progress" ? "#fef3c7" : "#f3f4f6",
                                    color: t.status === "completed" ? "#065f46" : t.status === "in_progress" ? "#92400e" : "#374151",
                                  }}>
                                    {t.status}
                                  </span>
                                </td>
                                <td style={{ padding: "6px", textAlign: "center", color: t.acknowledged ? "#059669" : "#9ca3af" }}>
                                  {t.acknowledged ? "✓" : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Staff accountability */}
                    {(cycle.assigned_staff || []).length > 0 && (
                      <div style={{ marginTop: "12px", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                        <p style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", marginBottom: "4px" }}>STAFF ACCOUNTABILITY</p>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {(cycle.assigned_staff || []).map((role) => (
                            <span key={role} style={{ padding: "2px 10px", borderRadius: "9999px", fontSize: "12px", backgroundColor: "#e0e7ff", color: "#3730a3" }}>
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next-cycle linkages */}
                    {linkedCycles.length > 0 && (
                      <div style={{ marginTop: "12px", padding: "12px", border: "1px solid #d1fae5", borderRadius: "8px", backgroundColor: "#f0fdf4" }}>
                        <p style={{ fontSize: "11px", fontWeight: "600", color: "#065f46", marginBottom: "4px" }}>NEXT-CYCLE LINKAGES</p>
                        {linkedCycles.map((lc) => (
                          <p key={lc.id} style={{ fontSize: "12px", color: "#374151" }}>
                            → {lc.title} ({lc.status})
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 6. Lessons Learned Summary */}
              {completedCycles.some((c) => c.what_worked || c.what_didnt_work) && (
                <div style={{ marginTop: "40px", paddingBottom: "24px", borderBottom: "1px solid #e5e7eb" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#0e7490" }}>Lessons Learned</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#059669", marginBottom: "8px" }}>What Worked</h3>
                      {completedCycles.filter((c) => c.what_worked).map((c) => (
                        <div key={c.id} style={{ marginBottom: "8px", padding: "8px", border: "1px solid #d1fae5", borderRadius: "6px", backgroundColor: "#f0fdf4" }}>
                          <p style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280" }}>{c.title}</p>
                          <p style={{ fontSize: "12px", marginTop: "2px" }}>{c.what_worked}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#dc2626", marginBottom: "8px" }}>What Didn't Work</h3>
                      {completedCycles.filter((c) => c.what_didnt_work).map((c) => (
                        <div key={c.id} style={{ marginBottom: "8px", padding: "8px", border: "1px solid #fecaca", borderRadius: "6px", backgroundColor: "#fef2f2" }}>
                          <p style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280" }}>{c.title}</p>
                          <p style={{ fontSize: "12px", marginTop: "2px" }}>{c.what_didnt_work}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ marginTop: "40px", textAlign: "center", paddingTop: "16px", borderTop: "2px solid #0e7490" }}>
                <p style={{ fontSize: "11px", color: "#9ca3af" }}>
                  This evidence packet was generated by MeasureWise on {format(new Date(), "MMMM d, yyyy")}.
                </p>
                <p style={{ fontSize: "11px", color: "#9ca3af" }}>
                  {organization.name} {organization.npi ? `| NPI: ${organization.npi}` : ""}
                </p>
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
              <><Download className="h-4 w-4 mr-2" />Generate Evidence Packet</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
