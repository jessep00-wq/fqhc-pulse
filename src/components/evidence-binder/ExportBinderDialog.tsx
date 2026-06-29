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
import { Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type {
  CategoryStatus,
  EvidenceCategory,
  EvidenceDocument,
  EvidenceExportType,
} from "@/types/evidenceBinder";
import { printBinder, type PdsaCycleLite } from "@/lib/binder/renderer";

const EXPORT_OPTIONS: { value: EvidenceExportType; label: string; description: string }[] = [
  { value: "full_osv", label: "Full OSV Binder", description: "Every active document across all 12 Chapter 10 categories." },
  { value: "quarterly_qi", label: "Quarterly QI Packet", description: "Plan, minutes, dashboards, and PDSA cycles for the quarter." },
  { value: "board_packet", label: "Board Meeting Packet", description: "Meeting minutes, dashboards, board oversight, and PDSA highlights." },
];

const QUARTERLY_SLUGS = ["qi-plan-policy", "meeting-minutes", "dashboards-reports", "pdsa-packets", "assessment-samples"];
const BOARD_SLUGS = ["meeting-minutes", "dashboards-reports", "pdsa-packets", "board-oversight"];

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
  const [hrsaGrantNumber, setHrsaGrantNumber] = useState("");
  const [osvDate, setOsvDate] = useState("");
  const [preparedBy, setPreparedBy] = useState("");

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

      // Fetch PDSA cycles for this org, optionally filtered to the reporting period
      type PdsaRow = {
        id: string;
        title: string;
        uds_measure: string | null;
        status: string | null;
        start_date: string | null;
        actual_outcome: string | null;
        next_cycle_decision: string | null;
        updated_at: string | null;
      };
      const pdsaClient = supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (c: string, v: string) => {
              order: (c: string, o: { ascending: boolean }) => Promise<{ data: PdsaRow[] | null; error: Error | null }>;
            };
          };
        };
      };
      const { data: cyclesRaw } = await pdsaClient
        .from("pdsa_cycles")
        .select("id, title, uds_measure, status, start_date, actual_outcome, next_cycle_decision, updated_at")
        .eq("organization_id", organization.id)
        .order("updated_at", { ascending: false });

      let pdsaCycles: PdsaCycleLite[] = cyclesRaw ?? [];
      if (exportType !== "full_osv") {
        pdsaCycles = pdsaCycles.filter((c) => {
          if (!c.start_date) return true;
          return c.start_date >= periodStart && c.start_date <= periodEnd;
        });
      }

      const periodLabel =
        exportType === "full_osv"
          ? `As of ${new Date().toLocaleDateString()}`
          : `${periodStart} to ${periodEnd}`;

      await printBinder({
        orgName: organization.name,
        hrsaGrantNumber,
        reportingPeriod: periodLabel,
        osvDate: osvDate
          ? new Date(osvDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "",
        preparedBy: preparedBy || userData.user?.email || "",
        exportType,
        categories: filtered.cats,
        documents: filtered.docs,
        statuses: statuses.filter((s) =>
          filtered.cats.some((c) => c.id === s.category.id),
        ),
        pdsaCycles,
      });

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
      toast.success("Binder opened in print dialog — choose 'Save as PDF'");
      qc.invalidateQueries({ queryKey: ["evidence_binder_exports"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message || "Generation failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate evidence binder</DialogTitle>
          <DialogDescription>
            Branded HRSA OSV binder with auto-generated TOC, completeness ring, and Chapter 10 evidence sections. Opens your browser's print dialog — choose "Save as PDF" to download.
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>HRSA Grant #</Label>
              <Input value={hrsaGrantNumber} onChange={(e) => setHrsaGrantNumber(e.target.value)} placeholder="H80CS00000" />
            </div>
            <div>
              <Label>OSV Date</Label>
              <Input type="date" value={osvDate} onChange={(e) => setOsvDate(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Prepared By</Label>
            <Input value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} placeholder="Name, Title" />
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
            {generate.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
            Generate PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
