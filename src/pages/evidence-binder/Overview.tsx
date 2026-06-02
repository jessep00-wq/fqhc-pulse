import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, AlertTriangle } from "lucide-react";

import { CompletenessHero } from "@/components/evidence-binder/CompletenessHero";
import { CategoryTile } from "@/components/evidence-binder/CategoryTile";
import { UploadDocumentDialog } from "@/components/evidence-binder/UploadDocumentDialog";
import { ExportBinderDialog } from "@/components/evidence-binder/ExportBinderDialog";
import { WorkstreamRibbon } from "@/components/workstream/WorkstreamRibbon";
import { DownstreamImpactPanel } from "@/components/workstream/DownstreamImpactPanel";
import { getEvidenceOverviewWorkstream } from "@/lib/workstream/evidenceWorkstream";
import {
  computeCategoryStatus,
  computeOverallScore,
  listExpiringSoon,
} from "@/lib/evidenceCompleteness";
import type {
  EvidenceCategory,
  EvidenceDocument,
} from "@/types/evidenceBinder";

export default function EvidenceBinderOverview() {
  const { organization } = useOrg();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["evidence_categories"],
    queryFn: async () => {
      const client = supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            order: (
              c: string,
              o: { ascending: boolean },
            ) => Promise<{ data: EvidenceCategory[] | null; error: Error | null }>;
          };
        };
      };
      const { data, error } = await client
        .from("evidence_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["evidence_documents", organization?.id],
    enabled: !!organization?.id,
    queryFn: async () => {
      const client = supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              c: string,
              v: string,
            ) => {
              order: (
                c: string,
                o: { ascending: boolean },
              ) => Promise<{ data: EvidenceDocument[] | null; error: Error | null }>;
            };
          };
        };
      };
      const { data, error } = await client
        .from("evidence_documents")
        .select("*")
        .eq("organization_id", organization!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const statuses = useMemo(
    () => categories.map((c) => computeCategoryStatus(c, documents)),
    [categories, documents],
  );
  const overall = computeOverallScore(statuses);
  const expiringSoon = useMemo(() => listExpiringSoon(documents, 30), [documents]);
  const expiredCount = documents.filter((d) => d.status === "expired").length;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Evidence Binder</h1>
          <p className="text-sm text-muted-foreground mt-1">
            HRSA Chapter 8 QI/QA documentation — a living repository, not a pre-visit scramble.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Generate binder
          </Button>
        </div>
      </div>

      <CompletenessHero
        overall={overall}
        totalDocs={documents.length}
        expiringSoon={expiringSoon.filter((e) => e.daysUntil >= 0).length}
        expired={expiredCount}
      />

      {expiringSoon.length > 0 && (
        <Card className="p-4 border-warning/30 bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm mb-1">
                {expiringSoon.length} document{expiringSoon.length === 1 ? "" : "s"} need attention
              </div>
              <div className="flex flex-wrap gap-2">
                {expiringSoon.slice(0, 5).map((e) => (
                  <Badge key={e.document.id} variant="outline" className="text-xs">
                    {e.document.title} —{" "}
                    {e.daysUntil < 0
                      ? `${Math.abs(e.daysUntil)}d expired`
                      : `${e.daysUntil}d left`}
                  </Badge>
                ))}
                {expiringSoon.length > 5 && (
                  <span className="text-xs text-muted-foreground">
                    +{expiringSoon.length - 5} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Chapter 8 categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statuses.map((s) => (
            <CategoryTile key={s.category.id} status={s} />
          ))}
        </div>
      </div>

      <UploadDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        categories={categories}
      />
      <ExportBinderDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        categories={categories}
        documents={documents}
        statuses={statuses}
      />
    </div>
  );
}
