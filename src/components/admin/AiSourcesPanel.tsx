import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listSourceDocuments,
  saveSourceDocument,
  approveSourceDocument,
  archiveSourceDocument,
} from "@/lib/ai/sourceDocuments.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Archive, CheckCircle, FileText, X } from "lucide-react";

interface SourceDoc {
  id: string;
  title: string;
  source_type: string;
  issuing_authority: string | null;
  version: string | null;
  effective_date: string | null;
  expiration_date: string | null;
  status: "draft" | "active" | "archived";
  organization_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  active: "bg-success/10 text-success border-success/30",
  archived: "bg-destructive/10 text-destructive border-destructive/30",
};

export function AiSourcesPanel() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listSourceDocuments);
  const saveFn = useServerFn(saveSourceDocument);
  const approveFn = useServerFn(approveSourceDocument);
  const archiveFn = useServerFn(archiveSourceDocument);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin_ai_sources"],
    queryFn: () => listFn(),
  });

  const [editing, setEditing] = useState<Partial<SourceDoc> | null>(null);

  const saveMutation = useMutation({
    mutationFn: saveFn,
    onSuccess: () => {
      toast.success("Source saved");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin_ai_sources"] });
    },
    onError: (e) => toast.error(`Failed: ${e?.message ?? ""}`),
  });

  const approveMutation = useMutation({
    mutationFn: approveFn,
    onSuccess: () => {
      toast.success("Source approved");
      queryClient.invalidateQueries({ queryKey: ["admin_ai_sources"] });
    },
    onError: (e) => toast.error(`Failed: ${e?.message ?? ""}`),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveFn,
    onSuccess: () => {
      toast.success("Source archived");
      queryClient.invalidateQueries({ queryKey: ["admin_ai_sources"] });
    },
    onError: (e) => toast.error(`Failed: ${e?.message ?? ""}`),
  });

  const docs = (data as SourceDoc[]).sort((a, b) =>
    (a.organization_id ? 1 : 0) - (b.organization_id ? 1 : 0) ||
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Source documents</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setEditing({ status: "draft" })}>
          <Plus className="h-4 w-4 mr-1" /> Add org source
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No source documents yet.</p>
        ) : (
          <div className="space-y-2">
            {docs.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{s.title}</span>
                    <Badge variant="outline" className={STATUS_CLASS[s.status]}>{s.status}</Badge>
                    {s.organization_id === null && <Badge variant="secondary">Global</Badge>}
                    {s.organization_id !== null && <Badge variant="secondary">Org</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.source_type}
                    {s.issuing_authority ? ` · ${s.issuing_authority}` : ""}
                    {s.version ? ` · v${s.version}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {s.status === "draft" && s.organization_id !== null && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => approveMutation.mutate({ id: s.id })}>
                      <CheckCircle className="h-4 w-4 text-success" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(s)}>
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => archiveMutation.mutate({ id: s.id })}>
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit source" : "Add organization source"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={editing?.title ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Source type</Label>
                <Input value={editing?.source_type ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, source_type: e.target.value }))} placeholder="e.g. HRSA guidance" />
              </div>
              <div className="space-y-1.5">
                <Label>Issuing authority</Label>
                <Input value={editing?.issuing_authority ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, issuing_authority: e.target.value }))} placeholder="e.g. HRSA" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Version</Label>
                <Input value={editing?.version ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, version: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Effective</Label>
                <Input type="date" value={editing?.effective_date ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, effective_date: e.target.value || null }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Expiration</Label>
                <Input type="date" value={editing?.expiration_date ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, expiration_date: e.target.value || null }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Storage reference / URL</Label>
              <Input value={editing?.storage_reference ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, storage_reference: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}><X className="h-4 w-4 mr-1" /> Cancel</Button>
            <Button onClick={() => saveMutation.mutate(editing as never)} disabled={!editing?.title?.trim() || !editing?.source_type?.trim()}>Save source</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
