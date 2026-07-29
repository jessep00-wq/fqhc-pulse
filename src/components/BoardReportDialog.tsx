import { UDS_MEASURE_LABELS } from "@/data/udsMeasures";
import { useState, useRef, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Download } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { confirmDemoExport } from "@/lib/demoExportGate";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface BoardReportDialogProps {
  open: boolean;
  onClose: () => void;
  cycles: any[];
  tasks: any[];
  trends: any[];
  financials: any;
}

const MEASURE_LABELS: Record<string, string> = UDS_MEASURE_LABELS;

const currentYear = new Date().getFullYear();
const quarters = [
  `Q1 ${currentYear}`,
  `Q2 ${currentYear}`,
  `Q3 ${currentYear}`,
  `Q4 ${currentYear}`,
  `Q1 ${currentYear - 1}`,
  `Q2 ${currentYear - 1}`,
  `Q3 ${currentYear - 1}`,
  `Q4 ${currentYear - 1}`,
];

export function BoardReportDialog({ open, onClose, cycles, tasks, trends, financials }: BoardReportDialogProps) {
  const { organization, isDemo } = useOrg();
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [period, setPeriod] = useState(quarters[0]);

  const activeCycles = cycles?.filter((c) => c.status !== "completed") || [];
  const completedCycles = cycles?.filter((c) => c.status === "completed") || [];
  const completedTasks = tasks?.filter((t) => t.status === "completed") || [];
  const pendingTasks = tasks?.filter((t) => t.status === "pending" || t.status === "in_progress") || [];

  // Get latest value per measure
  const latestMeasures = (() => {
    if (!trends?.length) return [];
    const latest: Record<string, number> = {};
    for (const t of trends) latest[t.measure_id] = Number(t.value);
    return Object.entries(latest).map(([id, value]) => ({
      id,
      label: MEASURE_LABELS[id] || id,
      value,
      onTarget: id === "CMS122" ? value <= 25 : value >= 65,
    }));
  })();

  // Task completion by role
  const roleStats = (() => {
    const roles: Record<string, { completed: number; total: number }> = {};
    for (const t of tasks || []) {
      const role = t.assigned_role || "Unassigned";
      if (!roles[role]) roles[role] = { completed: 0, total: 0 };
      roles[role].total++;
      if (t.status === "completed") roles[role].completed++;
    }
    return Object.entries(roles).map(([role, stats]) => ({ role, ...stats }));
  })();

  const handleExportPDF = useCallback(async () => {
    if (!printRef.current) return;
    if (!confirmDemoExport(isDemo, "The board report")) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const pdf = new jsPDF("p", "in", "letter");
      const pdfWidth = 8.5;
      const pdfHeight = 11;
      const margin = 0.5;
      const imgWidth = pdfWidth - margin * 2;
      const pageContentHeight = pdfHeight - margin * 2;
      const scale = imgWidth / canvas.width;
      const pageHeightInPx = pageContentHeight / scale;

      let yOffset = 0;
      let page = 0;
      while (yOffset < canvas.height) {
        if (page > 0) pdf.addPage();
        const sliceHeight = Math.min(pageHeightInPx, canvas.height - yOffset);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        }
        const imgData = sliceCanvas.toDataURL("image/jpeg", 0.95);
        const renderedHeight = sliceHeight * scale;
        pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, renderedHeight);
        yOffset += sliceHeight;
        page++;
      }
      pdf.save(`${organization.name}_Board_Report_${period.replace(" ", "_")}.pdf`);
      toast.success("Board report downloaded!");
    } catch (err) {
      // Audit fix 35/36: user-facing toast on failure path; dev-only console.
      toast.error("Couldn't generate the board report PDF. Please try again.");
      if (import.meta.env.DEV) console.error("Board report PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [organization, period]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Export Board Report
          </DialogTitle>
          <DialogDescription>
            Generate a comprehensive board-ready PDF with your organization's quality improvement data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-1.5 flex-1">
              <Label>Report Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {quarters.map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Printable content */}
          <div
            ref={printRef}
            className="bg-white text-black p-8 space-y-8"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            {/* Cover */}
            <div className="text-center space-y-4 pb-8 border-b-2 border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
              <h2 className="text-xl text-gray-600">Quality Improvement Board Report</h2>
              <p className="text-lg font-medium text-teal-700">{period}</p>
              <p className="text-sm text-gray-600 mt-6">Generated by MeasureWise™</p>
            </div>

            {/* UDS Performance Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                UDS Performance Summary
              </h3>
              {latestMeasures.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-semibold text-gray-700">Measure</th>
                      <th className="text-left py-2 font-semibold text-gray-700">ID</th>
                      <th className="text-right py-2 font-semibold text-gray-700">Current</th>
                      <th className="text-right py-2 font-semibold text-gray-700">Target</th>
                      <th className="text-right py-2 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestMeasures.map((m) => (
                      <tr key={m.id} className="border-b border-gray-100">
                        <td className="py-2 text-gray-800">{m.label}</td>
                        <td className="py-2 text-gray-500">{m.id}</td>
                        <td className="py-2 text-right font-medium">{m.value.toFixed(1)}%</td>
                        <td className="py-2 text-right text-gray-500">
                          {m.id === "CMS122" ? "≤25%" : "≥65%"}
                        </td>
                        <td className="py-2 text-right">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.onTarget ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {m.onTarget ? "On Target" : "Below Target"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-500 italic">No UDS data available.</p>
              )}
            </div>

            {/* Active PDSA Cycles */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                Active PDSA Cycles ({activeCycles.length})
              </h3>
              {activeCycles.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-semibold text-gray-700">Cycle</th>
                      <th className="text-left py-2 font-semibold text-gray-700">UDS Measure</th>
                      <th className="text-left py-2 font-semibold text-gray-700">Phase</th>
                      <th className="text-right py-2 font-semibold text-gray-700">Improvement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCycles.map((c) => (
                      <tr key={c.id} className="border-b border-gray-100">
                        <td className="py-2 text-gray-800">{c.title}</td>
                        <td className="py-2 text-gray-500">{c.uds_measure || "—"}</td>
                        <td className="py-2">
                          <span className="capitalize px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {c.status}
                          </span>
                        </td>
                        <td className="py-2 text-right font-medium">
                          {c.improvement_pct ? `+${c.improvement_pct}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-500 italic">No active cycles.</p>
              )}
              {completedCycles.length > 0 && (
                <p className="text-sm text-gray-600">
                  {completedCycles.length} cycle{completedCycles.length !== 1 ? "s" : ""} completed to date.
                </p>
              )}
            </div>

            {/* Staff Task Completion */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                Staff Task Completion
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{tasks?.length || 0}</p>
                  <p className="text-xs text-gray-500">Total Tasks</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">{completedTasks.length}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-700">{pendingTasks.length}</p>
                  <p className="text-xs text-gray-500">In Progress / Pending</p>
                </div>
              </div>
              {roleStats.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-semibold text-gray-700">Role</th>
                      <th className="text-right py-2 font-semibold text-gray-700">Completed</th>
                      <th className="text-right py-2 font-semibold text-gray-700">Total</th>
                      <th className="text-right py-2 font-semibold text-gray-700">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleStats.map((r) => (
                      <tr key={r.role} className="border-b border-gray-100">
                        <td className="py-2 text-gray-800">{r.role}</td>
                        <td className="py-2 text-right">{r.completed}</td>
                        <td className="py-2 text-right">{r.total}</td>
                        <td className="py-2 text-right font-medium">
                          {r.total > 0 ? `${Math.round((r.completed / r.total) * 100)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Financial Impact */}
            {financials && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                  Financial Impact
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-teal-50 rounded-lg">
                    <p className="text-2xl font-bold text-teal-800">
                      ${(financials.shared_savings / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-gray-600 mt-1">ACO Shared Savings</p>
                    <p className="text-xs text-teal-600 font-medium">+{financials.trend}% vs. prior</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-800">
                      ${(financials.revenue_protected / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Revenue Protected</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-800">
                      ${(financials.hrsa_quality_award / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-gray-600 mt-1">HRSA Quality Award</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-6 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-600">
                This report was generated by MeasureWise™ — Quality Improvement Software for FQHCs
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Generated on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExportPDF} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
