import { useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DOCUMENT_TYPE_LABELS,
  type EvidenceCategory,
  type EvidenceDocumentType,
} from "@/types/evidenceBinder";

const BUCKET = "evidence-binder";
const MAX_BYTES = 20 * 1024 * 1024;

export function UploadDocumentDialog({
  open,
  onOpenChange,
  category,
  categories,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category?: EvidenceCategory;
  categories: EvidenceCategory[];
}) {
  const qc = useQueryClient();
  const { organization } = useOrg();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(category?.id ?? "");
  const [docType, setDocType] = useState<EvidenceDocumentType>(
    (category?.required_doc_types[0] as EvidenceDocumentType) ?? "policy",
  );
  const [docDate, setDocDate] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [associatedMeasure, setAssociatedMeasure] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setFile(null);
    setTitle("");
    setCategoryId(category?.id ?? "");
    setDocType(
      (category?.required_doc_types[0] as EvidenceDocumentType) ?? "policy",
    );
    setDocDate("");
    setAuthorName("");
    setAssociatedMeasure("");
    setReviewDate("");
    setExpiresAt("");
    setNotes("");
  };

  const upload = useMutation({
    mutationFn: async () => {
      if (!organization) throw new Error("No organization");
      if (!file) throw new Error("Please choose a file");
      if (file.size > MAX_BYTES) throw new Error("File exceeds 20MB");
      if (!title.trim()) throw new Error("Title required");
      if (!categoryId) throw new Error("Category required");

      const { data: userData } = await supabase.auth.getUser();
      const safeName = file.name.replace(/[^\w.-]/g, "_");
      const docId = crypto.randomUUID();
      const cat = categories.find((c) => c.id === categoryId);
      const slug = cat?.slug ?? "uncategorized";
      const path = `${organization.id}/${slug}/${docId}/1-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (upErr) throw upErr;

      const client = supabase as unknown as {
        from: (t: string) => {
          insert: (
            row: Record<string, unknown>,
          ) => {
            select: () => {
              single: () => Promise<{ data: { id: string } | null; error: Error | null }>;
            };
          };
          update: (
            row: Record<string, unknown>,
          ) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> };
        };
      };

      const { data: docRow, error: docErr } = await client
        .from("evidence_documents")
        .insert({
          id: docId,
          organization_id: organization.id,
          category_id: categoryId,
          title: title.trim(),
          document_type: docType,
          doc_date: docDate || null,
          author_user_id: userData.user?.id ?? null,
          author_name_override: authorName.trim() || null,
          associated_measure: associatedMeasure.trim() || null,
          review_date: reviewDate || null,
          expires_at: expiresAt || null,
          notes: notes.trim() || null,
          source: "uploaded",
        })
        .select()
        .single();
      if (docErr || !docRow) throw docErr ?? new Error("Insert failed");

      const versionId = crypto.randomUUID();
      const { error: verErr } = await client
        .from("evidence_document_versions")
        .insert({
          id: versionId,
          document_id: docId,
          organization_id: organization.id,
          version: 1,
          file_path: path,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
          uploaded_by: userData.user?.id ?? null,
        })
        .select()
        .single();
      if (verErr) throw verErr;

      await client
        .from("evidence_documents")
        .update({ current_version_id: versionId })
        .eq("id", docId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evidence_documents"] });
      toast.success("Document uploaded");
      reset();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message || "Upload failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload evidence document</DialogTitle>
          <DialogDescription>
            Files are private to your organization and included in audit binder exports.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-dashed p-6 flex flex-col items-center gap-2">
            <Input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.csv,.txt"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              {file ? "Replace file" : "Choose file"}
            </Button>
            {file && (
              <p className="text-sm text-muted-foreground">
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              PDF, DOCX, XLSX, image, CSV up to 20MB
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="QI Plan FY2026" />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Document type</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as EvidenceDocumentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Document date</Label>
              <Input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} />
            </div>
            <div>
              <Label>Author / owner</Label>
              <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Jane Smith, RN" />
            </div>
            <div>
              <Label>Review date</Label>
              <Input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
            </div>
            <div>
              <Label>Expiration date</Label>
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Associated measure / requirement</Label>
              <Input value={associatedMeasure} onChange={(e) => setAssociatedMeasure(e.target.value)} placeholder="CMS124 Cervical Cancer Screening" />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => upload.mutate()} disabled={upload.isPending || !file}>
            {upload.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
