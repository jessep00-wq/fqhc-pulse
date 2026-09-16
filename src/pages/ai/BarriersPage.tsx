import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { listBarriers, saveBarrier, deleteBarrier } from "@/lib/ai/barriers.functions";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, X, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { UDS_MEASURES } from "@/data/mockData";
import { EmptyState } from "@/components/EmptyState";
import { useSiteOptions } from "@/hooks/useSiteOptions";

interface Barrier {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: "open" | "mitigated" | "escalated";
  affected_measure_id: string | null;
  affected_site_id: string | null;
  owner_user_id: string | null;
  related_pdsa_ids: string[] | null;
  first_seen: string;
  created_at: string;
  affected_site?: { name: string } | null;
}

const STATUS_META = {
  open: { label: "Open", Icon: AlertCircle, className: "bg-warning/10 text-warning border-warning/30" },
  mitigated: { label: "Mitigated", Icon: CheckCircle2, className: "bg-success/10 text-success border-success/30" },
  escalated: { label: "Escalated", Icon: AlertTriangle, className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export default function BarriersPage() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listBarriers);
  const saveFn = useServerFn(saveBarrier);
  const deleteFn = useServerFn(deleteBarrier);
  const sites = useSiteOptions();

  const { data = [], isLoading } = useQuery({
    queryKey: ["barriers", "all"],
    queryFn: () => listFn(),
  });

  const [editing, setEditing] = useState<Partial<Barrier> | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "mitigated" | "escalated">("all");

  const saveMutation = useMutation({
    mutationFn: saveFn,
    onSuccess: () => {
      toast.success("Barrier saved");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["barriers"] });
    },
    onError: (e) => toast.error(`Failed to save barrier: ${e?.message ?? ""}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Barrier deleted");
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["barriers"] });
    },
    onError: (e) => toast.error(`Failed to delete barrier: ${e?.message ?? ""}`),
  });

  const barriers = data as Barrier[];
  const filtered = filter === "all" ? barriers : barriers.filter((b) => b.status === filter);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Barriers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Operational blockers affecting quality-improvement work across your workspace.
          </p>
        </div>
        <Button onClick={() => setEditing({ status: "open", related_pdsa_ids: [] })}>
          <Plus className="h-4 w-4 mr-2" /> Record barrier
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "open", "mitigated", "escalated"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading…</CardContent></Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No barriers found"
          description="Record barriers from any PDSA cycle or from this page to track recurring operational blockers."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((b) => {
            const meta = STATUS_META[b.status];
            return (
              <Card key={b.id} className="border-l-4 border-l-warning">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{b.title}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(b)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleting(b.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Badge variant="outline" className={meta.className}>
                    <meta.Icon className="h-3 w-3 mr-1" /> {meta.label}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {b.description && <p className="text-muted-foreground">{b.description}</p>}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {b.category && <Badge variant="secondary">{b.category}</Badge>}
                    {b.affected_measure_id && <Badge variant="outline">{b.affected_measure_id}</Badge>}
                    {b.affected_site?.name && <Badge variant="outline">{b.affected_site.name}</Badge>}
                    {b.owner?.full_name && <span className="text-muted-foreground">Owner: {b.owner.full_name}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">First seen: {b.first_seen}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit barrier" : "Record barrier"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={editing?.title ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, title: e.target.value }))} placeholder="e.g. Staff turnover in intake" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={editing?.description ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, description: e.target.value }))} placeholder="How is this blocking progress?" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editing?.status ?? "open"} onValueChange={(v) => setEditing((p) => ({ ...p!, status: v as Barrier["status"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="mitigated">Mitigated</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input value={editing?.category ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, category: e.target.value }))} placeholder="e.g. Staffing" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Affected measure</Label>
                <Select value={editing?.affected_measure_id ?? "__none__"} onValueChange={(v) => setEditing((p) => ({ ...p!, affected_measure_id: v === "__none__" ? null : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {UDS_MEASURES.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Affected site</Label>
                <Select value={editing?.affected_site_id ?? "__none__"} onValueChange={(v) => setEditing((p) => ({ ...p!, affected_site_id: v === "__none__" ? null : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {sites.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}><X className="h-4 w-4 mr-1" /> Cancel</Button>
            <Button onClick={() => saveMutation.mutate(editing as never)} disabled={!editing?.title?.trim()}>Save barrier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete barrier?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This removes the barrier record. It cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleting!)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
