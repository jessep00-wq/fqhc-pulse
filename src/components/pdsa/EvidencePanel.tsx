import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Image as ImageIcon, Trash2, Download, Loader2, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface EvidenceRow {
  id: string;
  pdsa_cycle_id: string;
  organization_id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  note: string | null;
  uploaded_by: string | null;
  created_at: string;
}

const BUCKET = "pdsa-evidence";
const MAX_BYTES = 20 * 1024 * 1024; // 20MB

function fileIcon(mime: string | null) {
  if (mime?.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-info" />;
  return <FileText className="h-4 w-4 text-primary" />;
}

function humanSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EvidencePanel({
  cycleId,
  organizationId,
}: {
  cycleId: string;
  organizationId: string;
}) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: evidence = [], isLoading } = useQuery({
    queryKey: ["pdsa_evidence", cycleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdsa_evidence" as never)
        .select("*")
        .eq("pdsa_cycle_id", cycleId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as EvidenceRow[];
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > MAX_BYTES) throw new Error("File exceeds 20MB limit");
      const { data: userData } = await supabase.auth.getUser();
      const safeName = file.name.replace(/[^\w.\-]/g, "_");
      const path = `${organizationId}/${cycleId}/${crypto.randomUUID()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      });
      if (upErr) throw upErr;
      const client = supabase as unknown as {
        from: (t: string) => {
          insert: (row: Record<string, unknown>) => Promise<{ error: Error | null }>;
        };
      };
      const { error: insErr } = await client.from("pdsa_evidence").insert({
        pdsa_cycle_id: cycleId,
        organization_id: organizationId,
        file_path: path,
        file_name: file.name,
        mime_type: file.type || null,
        size_bytes: file.size,
        uploaded_by: userData.user?.id || null,
      });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pdsa_evidence", cycleId] });
      qc.invalidateQueries({ queryKey: ["pdsa_cycles"] });
      toast.success("Evidence uploaded");
    },
    onError: (e: Error) => toast.error(e.message || "Upload failed"),
  });

  const remove = useMutation({
    mutationFn: async (row: EvidenceRow) => {
      const { error: delErr } = await supabase.storage.from(BUCKET).remove([row.file_path]);
      if (delErr) throw delErr;
      const client = supabase as unknown as {
        from: (t: string) => {
          delete: () => { eq: (col: string, val: string) => Promise<{ error: Error | null }> };
        };
      };
      const { error: rowErr } = await client.from("pdsa_evidence").delete().eq("id", row.id);
      if (rowErr) throw rowErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pdsa_evidence", cycleId] });
      qc.invalidateQueries({ queryKey: ["pdsa_cycles"] });
      toast.success("Evidence removed");
    },
    onError: (e: Error) => toast.error(e.message || "Delete failed"),
  });

  const handleDownload = async (row: EvidenceRow) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(row.file_path, 60 * 10);
    if (error || !data) {
      toast.error("Could not generate download link");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground flex items-start gap-2">
        <Paperclip className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <span>
          Attach meeting notes, run charts, screenshots, or any document that proves this cycle happened.
          Files stay private to your organization and are included in audit binder exports.
        </span>
      </div>

      <div className="rounded-lg border border-dashed p-4 flex flex-col items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.csv,.txt"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload.mutate(f);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={upload.isPending}
        >
          {upload.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-1" />
          )}
          Upload evidence
        </Button>
        <p className="text-xs text-muted-foreground">PDF, image, DOCX, XLSX, CSV up to 20MB</p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          Linked files <Badge variant="secondary" className="ml-1">{evidence.length}</Badge>
        </Label>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && evidence.length === 0 && (
          <p className="text-sm text-muted-foreground">No evidence attached yet.</p>
        )}
        {evidence.map((row) => (
          <div key={row.id} className="flex items-center gap-3 rounded-lg border p-3">
            {fileIcon(row.mime_type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{row.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {humanSize(row.size_bytes)} · {format(new Date(row.created_at), "MMM d, yyyy")}
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => handleDownload(row)} title="Download">
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                if (confirm(`Remove "${row.file_name}"?`)) remove.mutate(row);
              }}
              title="Remove"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
