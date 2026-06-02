import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, ArrowLeft, Download, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { UploadDocumentDialog } from "@/components/evidence-binder/UploadDocumentDialog";
import { WorkstreamRibbon } from "@/components/workstream/WorkstreamRibbon";
import { DownstreamImpactPanel } from "@/components/workstream/DownstreamImpactPanel";
import { getEvidenceCategoryWorkstream } from "@/lib/workstream/evidenceWorkstream";
import {
  DOCUMENT_TYPE_LABELS,
  type EvidenceCategory,
  type EvidenceDocument,
  type EvidenceDocumentVersion,
} from "@/types/evidenceBinder";

const BUCKET = "evidence-binder";

export default function EvidenceBinderCategoryDetail() {
  const { slug = "" } = useParams();
  const { organization } = useOrg();
  const [uploadOpen, setUploadOpen] = useState(false);

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

  const category = useMemo(
    () => categories.find((c) => c.slug === slug),
    [categories, slug],
  );

  const { data: documents = [] } = useQuery({
    queryKey: ["evidence_documents", organization?.id, category?.id],
    enabled: !!organization?.id && !!category?.id,
    queryFn: async () => {
      const client = supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              c: string,
              v: string,
            ) => {
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
      };
      const { data, error } = await client
        .from("evidence_documents")
        .select("*")
        .eq("organization_id", organization!.id)
        .eq("category_id", category!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleDownload = async (doc: EvidenceDocument) => {
    if (!doc.current_version_id) {
      toast.error("No file attached");
      return;
    }
    const client = supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (
            c: string,
            v: string,
          ) => {
            single: () => Promise<{
              data: EvidenceDocumentVersion | null;
              error: Error | null;
            }>;
          };
        };
      };
    };
    const { data: ver } = await client
      .from("evidence_document_versions")
      .select("*")
      .eq("id", doc.current_version_id)
      .single();
    if (!ver) {
      toast.error("File not found");
      return;
    }
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(ver.file_path, 600);
    if (error || !data) {
      toast.error("Could not get download link");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  if (!category) {
    return <div className="p-6">Category not found.</div>;
  }

  const requiredSatisfied = (type: string) =>
    documents.some((d) => d.document_type === type && d.status === "active");

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <Link
        to="/dashboard/evidence-binder"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Evidence Binder
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">
            {category.chapter8_reference}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
          {category.description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {category.description}
            </p>
          )}
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload document
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 lg:col-span-1">
          <h3 className="font-semibold text-sm mb-3">Required document types</h3>
          <ul className="space-y-2">
            {category.required_doc_types.map((t) => {
              const ok = requiredSatisfied(t);
              return (
                <li key={t} className="flex items-center gap-2 text-sm">
                  {ok ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={ok ? "" : "text-muted-foreground"}>
                    {DOCUMENT_TYPE_LABELS[t as keyof typeof DOCUMENT_TYPE_LABELS] ?? t}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            Review cadence: every {category.default_review_cadence_months} months
          </div>
        </Card>

        <Card className="lg:col-span-2 overflow-hidden">
          {documents.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No documents in this category yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="font-medium">{d.title}</div>
                      {d.associated_measure && (
                        <div className="text-xs text-muted-foreground">
                          {d.associated_measure}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {DOCUMENT_TYPE_LABELS[d.document_type]}
                    </TableCell>
                    <TableCell className="text-sm">{d.doc_date ?? "—"}</TableCell>
                    <TableCell className="text-sm">{d.expires_at ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          d.status === "active"
                            ? "bg-success/10 text-success border-success/30"
                            : d.status === "expired"
                              ? "bg-destructive/10 text-destructive border-destructive/30"
                              : "bg-muted text-muted-foreground"
                        }
                      >
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleDownload(d)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <UploadDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        category={category}
        categories={categories}
      />
    </div>
  );
}
