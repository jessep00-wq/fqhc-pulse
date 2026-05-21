import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { confirmDemoExport } from "@/lib/demoExportGate";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { DBCycle } from "@/types/pdsa";

export function AuditBinderDialog({ cycle, open, onClose, isFreeTier = true }: { cycle: DBCycle | null; open: boolean; onClose: () => void; isFreeTier?: boolean }) {
  const { organization, isDemo } = useOrg();
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = useCallback(async () => {
    if (!printRef.current || !cycle) return;
    if (!confirmDemoExport(isDemo, "The HRSA audit binder")) return;
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
        
        if (isFreeTier) {
          pdf.setFontSize(50);
          pdf.setTextColor(200, 200, 200);
          pdf.saveGraphicsState();
          const centerX = pdfWidth / 2;
          const centerY = pdfHeight / 2;
          pdf.text("SAMPLE — UPGRADE TO REMOVE", centerX, centerY, {
            align: "center",
            angle: 45,
          });
          pdf.restoreGraphicsState();
          pdf.setTextColor(0, 0, 0);
        }
        
        yOffset += sliceHeight;
        pageIndex++;
      }

      pdf.save(`HRSA_OSV_Audit_Binder_${cycle.id.slice(0, 8)}.pdf`);
      toast.success("PDF exported successfully");
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  }, [cycle, isFreeTier]);

  if (!cycle) return null;
  const staff = cycle.assigned_staff || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-accent" />HRSA OSV Audit Binder</DialogTitle>
          <DialogDescription>Compiled compliance report for federal audit readiness</DialogDescription>
        </DialogHeader>
        <div ref={printRef} className="space-y-6 bg-white text-black p-4">
          <div className="text-center border-b pb-4">
            <h2 className="text-lg font-bold">{organization.name}</h2>
            <p className="text-xs text-gray-500">NPI: {organization.npi} | HRSA OSV Audit Binder</p>
            <p className="text-xs text-gray-500">Generated: {new Date().toLocaleDateString()}</p>
          </div>
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">1. PDSA Cycle Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Title:</span> {cycle.title}</div>
              <div><span className="text-gray-500">UDS Measure:</span> {cycle.uds_measure}</div>
              <div><span className="text-gray-500">Status:</span> Completed</div>
              <div><span className="text-gray-500">Started:</span> {new Date(cycle.created_at).toLocaleDateString()}</div>
            </div>
          </section>
          {cycle.aim_statement && (
            <section className="rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold text-sm">2. Aim Statement</h3>
              <p className="text-sm text-gray-600">{cycle.aim_statement}</p>
            </section>
          )}
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">{cycle.aim_statement ? "3" : "2"}. Root Cause Analysis</h3>
            <p className="text-sm text-gray-600">{cycle.root_cause}</p>
          </section>
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">{cycle.aim_statement ? "4" : "3"}. Target Goal & Outcome</h3>
            <p className="text-sm">{cycle.target_goal}</p>
            {cycle.improvement_pct && <p className="text-sm text-green-700 font-medium">✓ Achieved {cycle.improvement_pct}% improvement</p>}
          </section>
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">{cycle.aim_statement ? "5" : "4"}. Staff Accountability Log</h3>
            <div className="space-y-1">
              {staff.map((role) => (
                <div key={role} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <span>{role}</span><span className="text-xs text-green-700 font-medium">✓ Acknowledged</span>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">{cycle.aim_statement ? "6" : "5"}. Clinical Workflow Impact</h3>
            <p className="text-sm text-gray-600">{cycle.clinical_workflow_impact}</p>
          </section>
          {cycle.decision && (
            <section className="rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold text-sm">7. Decision</h3>
              <p className="text-sm text-gray-600 font-medium">{cycle.decision}</p>
            </section>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleExportPDF} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
            {exporting ? "Exporting..." : "Export PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
