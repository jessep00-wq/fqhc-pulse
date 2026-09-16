import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
  affected_site?: { name: string } | null;
  owner?: { full_name: string } | null;
}

const STATUS_META = {
  open: { label: "Open", Icon: AlertCircle, className: "bg-warning/10 text-warning border-warning/30" },
  mitigated: { label: "Mitigated", Icon: CheckCircle2, className: "bg-success/10 text-success border-success/30" },
  escalated: { label: "Escalated", Icon: AlertTriangle, className: "bg-destructive/10 text-destructive border-destructive/30" },
};

interface BarriersPanelProps {
  cycleId: string;
  measureId?: string | null;
  siteId?: string | null;
  readonly?: boolean;
}

export function BarriersPanel({ cycleId, measureId, siteId, readonly }: BarriersPanelProps) {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listBarriers);
  const saveFn = useServerFn(saveBarrier);
  const deleteFn = useServerFn(deleteBarrier);
  const sites = useSiteOptions();

  const { data = [], isLoading } = useQuery({
    queryKey: ["barriers", cycleId],
    queryFn: () => listFn(),
  });

  const [editing, setEditing] = useState<Partial<Barrier> | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: saveFn,
    onSuccess: () => {
      toast.success("Barrier saved");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["barriers", cycleId] });
    },
    onError: (e) => toast.error(`Failed to save barrier: ${e?.message ?? ""}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Barrier deleted");
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["barriers", cycleId] });
    },
    onError: (e) => toast.error(`Failed to delete barrier: ${e?.message ?? ""}`),
  });

  const linked = (data as Barrier[]).filter((b) => (b.related_pdsa_ids ?? []).includes(cycleId));

  if (isLoading) {
    return (
      <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading barriers…</CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Linked barriers</h4>
          <p className="text-xs text-muted-foreground">
            Operational blockers connected to this improvement cycle.
          </p>
        </div>
        {!readonly && (
          <Button size="sm" variant="outline" onClick={() => setEditing({ status: "open", related_pdsa_ids: [cycleId], affected_measure_id: measureId ?? null, affected_site_id: siteId ?? null })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add barrier
          </Button>
        )}
      </div>

      {linked.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No barriers recorded"
          description="Record an operational barrier when you identify something that repeatedly blocks progress."
        />
      ) : (
        <div className="space-y-2">
          {linked.map((b) => {
            const meta = STATUS_META[b.status];
            return (
              <Card key={b.id} className="border-l-4 border-l-warning">
                <CardContent className="p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{b.title}</span>
                      <Badge variant="outline" className={meta.className}>
                        <meta.Icon className="h-3 w-3 mr-1" /> {meta.label}
                      </Badge>
                      {b.affected_measure_id && <Badge variant="secondary" className="text-xs">{b.affected_measure_id}</Badge>}
                    </div>
                    {b.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.description}</p>}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      {b.owner?.full_name && <span>Owner: {b.owner.full_name}</span>}
                      {b.affected_site?.name && <span>Site: {b.affected_site.name}</span>}
                    </div>
                  </div>
                  {!readonly && (
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(b)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleting(b.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit barrier" : "Add barrier"}</DialogTitle>
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
