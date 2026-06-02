import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { generateQIReportPdf } from "@/lib/qiReportPdf";
import type {
  QIReport,
  QIReportApproval,
  QIReportBoardAction,
} from "@/types/qiReport";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: QIReport;
  approvals: QIReportApproval[];
  boardActions: QIReportBoardAction[];
  orgName: string;
}

export function ExportReportDialog({
  open,
  onOpenChange,
  report,
  approvals,
  boardActions,
  orgName,
}: Props) {
  const [flavor, setFlavor] = useState<"committee" | "board" | "both">("both");

  const handleExport = () => {
    try {
      const flavors: Array<"committee" | "board"> =
        flavor === "both" ? ["committee", "board"] : [flavor];
      for (const f of flavors) {
        const doc = generateQIReportPdf({
          orgName,
          flavor: f,
          report,
          approvals,
          boardActions,
        });
        doc.save(`${report.period_label.replace(/\s+/g, "-")}-${f}-report.pdf`);
      }
      toast({ title: "Export ready", description: "Your PDF download has started." });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export {report.period_label} report</DialogTitle>
          <DialogDescription>
            Generate a clean PDF for the QI committee, the board, or both.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup value={flavor} onValueChange={(v) => setFlavor(v as typeof flavor)}>
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <RadioGroupItem value="committee" id="committee" />
            <div className="flex-1">
              <Label htmlFor="committee" className="font-medium">
                Committee version
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Full clinical detail, measure tables, PDSA narrative.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <RadioGroupItem value="board" id="board" />
            <div className="flex-1">
              <Label htmlFor="board" className="font-medium">
                Board version
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Governance summary only — wins, risks, recommendations.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <RadioGroupItem value="both" id="both" />
            <div className="flex-1">
              <Label htmlFor="both" className="font-medium">
                Both PDFs
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Recommended for OSV evidence binder.
              </p>
            </div>
          </div>
        </RadioGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
