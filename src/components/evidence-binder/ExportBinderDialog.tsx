import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type {
  CategoryStatus,
  EvidenceCategory,
  EvidenceDocument,
  EvidenceExportType,
} from "@/types/evidenceBinder";
import { generateBinderPdf } from "@/lib/evidenceBinderPdf";

const EXPORT_OPTIONS: { value: EvidenceExportType; label: string; description: string }[] = [
  { value: "full_osv", label: "Full OSV Binder", description: "Every active document across all 8 Chapter 8 categories." },
  { value: "quarterly_qi", label: "Quarterly QI Packet", description: "Plan, minutes, dashboards, and PDSA cycles for the quarter." },
  { value: "board_packet", label: "Board Meeting Packet", description: "Meeting minutes, dashboards, and PDSA highlights." },
];

const QUARTERLY_SLUGS = ["qi-plan-policy", "meeting-minutes", "dashboards-reports", "pdsa-packets"];
const BOARD_SLUGS = ["meeting-minutes", "dashboards-reports", "pdsa-packets"];

export function ExportBinderDialog({
  open,
  onOpenChange,
  categories,
  documents,
  statuses,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categories: EvidenceCategory[];
  documents: EvidenceDocument[];
  statuses: CategoryStatus[];
}) {
  const qc = useQueryClient();
  const { organization } = useOrg();
  const [exportType, setExportType] = useState<EvidenceExportType>("full_osv");
  const today = new Date();
  const [periodStart, setPeriodStart] = useState(
    new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().slice(0, 10),
  );
  const [periodEnd, setPeriodEnd] = useState(today.toISOString().slice(0, 10));

  const filtered = useMemo(() => {
    let cats = categories;
    if (exportType === "quarterly_qi") {
      cats = categories.filter((c) => QUARTERLY_SLUGS.includes(c.slug));
    } else if (exportType === "board_packet") {
      cats = categories.filter((c) => BOARD_SLUGS.includes(c.slug));
    }
    const catIds = new Set(cats.map((c) => c.id));
    const docs = documents.filter((d) => {
      if (!catIds.has(d.category_id)) return false;
      if (d.status === "archived") return false;
      if (exportType === "full_osv") return true;
      if (!d.doc_date) return true;
      return d.doc_date >= periodStart && d.doc_date <= periodEnd;
    });
    return { cats, docs };
  }, [categories, documents, exportType, periodStart, periodEnd]);

  const generate = useMutation({
    mutationFn: async () => {
      if (!organization) throw new Error("No organization");
      const { data: userData } = await supabase.auth.getUser();
      const periodLabel =
        exportType === "full_osv"
          ? `As of ${new Date().toLocaleDateString()}`
          : `${periodStart} to ${periodEnd}`;

      const pdf = generateBinderPdf({
        orgName: organization.name,
        exportType,
        periodLabel,
        generatedBy: userData.user?.email ?? "—",
        categories: filtered.cats,
        documents: filtered.docs,
        statuses: statuses.filter((s) =>
          filtered.cats.some((c) => c.id === s.category.id),
        ),
      });

      const fileName = `evidence-binder-${exportType}-${Date.now()}.pdf`;
      pdf.save(fileName);

      const client = supabase as unknown as {
        from: (t: string) => {
          insert: (row: Record<string, unknown>) => Promise<{ error: Error | null }>;
        };
      };
      await client.from("evidence_binder_exports").insert({
        organization_id: organization.id,
        export_type: exportType,
        period_start: periodStart,
        period_end: periodEnd,
        generated_by: userData.user?.id ?? null,
        toc: filtered.cats.map((c) => ({
          category: c.name,
          count: filtered.docs.filter((d) => d.category_id === c.id).length,
        })),
        included_document_ids: filtered.docs.map((d) => d.id),
      });
    },
    onSuccess: () => {
      toast.success("Binder generated");
      qc.invalidateQueries({ queryKey: ["evidence_binder_exports"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message || "Generation failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Generate evidence binder</DialogTitle>
          <DialogDescription>
            Auto-generated table of contents, completeness snapshot, and document index.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Format</Label>
            <Select value={exportType} onValueChange={(v) => setExportType(v as EvidenceExportType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <div className="flex flex-col py-0.5">
                      <span className="font-medium">{o.label}</span>
                      <span className="text-xs text-muted-foreground">{o.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {exportType !== "full_osv" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Period start</Label>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </div>
              <div>
                <Label>Period end</Label>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </div>
            </div>
          )}

          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="font-medium mb-2">Preview</div>
            <ul className="space-y-1 text-muted-foreground">
              {filtered.cats.map((c) => {
                const count = filtered.docs.filter((d) => d.category_id === c.id).length;
                return (
                  <li key={c.id} className="flex justify-between">
                    <span>{c.name}</span>
                    <span className="tabular-nums">{count}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 pt-2 border-t flex justify-between font-medium">
              <span>Total documents</span>
              <span className="tabular-nums">{filtered.docs.length}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
            {generate.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Generate PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
