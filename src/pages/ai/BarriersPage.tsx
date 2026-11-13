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
import { getBarrierBoard, saveBarrier, deleteBarrier } from "@/lib/ai/barriers.functions";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, X, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { UDS_MEASURES } from "@/data/mockData";
import { EmptyState } from "@/components/EmptyState";
import { useSiteOptions } from "@/hooks/useSiteOptions";

import { Link } from "@/lib/router-compat";
import { Sparkles, FileText, Link2, Users } from "lucide-react";
import { PDSA_TEMPLATES, type PDSATemplate } from "@/data/pdsaTemplates";
import { UDS_MEASURE_LIST } from "@/data/udsMeasures";
import {
  SYMPTOM_LABEL, STATUS_LABEL, REASON_LABEL, normalizeStatus, measureCode, sortBarriers, startHereId,
  filterBarriers, waitingOnUser, whySection, alsoSeenOn, suggestIdeas, patientsLine,
  type BarrierFilter, type BarrierStatus, type Symptom, type Reason, type ChangeIdeaLike, type DecisionLike,
} from "@/lib/barriers/barrierModel";

interface Barrier {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  affected_measure_id: string | null;
  affected_site_id: string | null;
  owner_user_id: string | null;
  related_pdsa_ids: string[] | null;
  first_seen: string;
  created_at: string;
  symptom: string | null;
  change_made?: string | null;
  est_patients: number | null;
  period: string | null;
  reasons: string[] | null;
  owner_role: string | null;
  affected_site?: { name: string } | null;
}

interface BoardData {
  userId: string;
  barriers: Barrier[];
  links: { barrier_id: string; cycle_id: string; title: string }[];
  ideas: ChangeIdeaLike[];
  decisions: (DecisionLike & { id: string; due_date: string })[];
}

const STATUS_CLASS: Record<BarrierStatus, string> = {
  open: "bg-warning/10 text-warning border-warning/30",
  decision_requested: "bg-destructive/10 text-destructive border-destructive/30",
  in_progress: "bg-primary/10 text-primary border-primary/30",
  waiting_outside: "bg-muted text-muted-foreground border-border",
  mitigated: "bg-success/10 text-success border-success/30",
  closed_unresolved: "bg-muted text-muted-foreground border-border",
};

const STATUS_ICON: Record<BarrierStatus, typeof AlertCircle> = {
  open: AlertCircle,
  decision_requested: AlertTriangle,
  in_progress: AlertCircle,
  waiting_outside: AlertCircle,
  mitigated: CheckCircle2,
  closed_unresolved: X,
};

const FILTERS: { id: BarrierFilter; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "waiting", label: "Waiting on you" },
  { id: "closed", label: "Closed" },
];

function measureLabel(measure: string | null) {
  const code = measureCode(measure);
  if (!code) return null;
  const m = UDS_MEASURE_LIST.find((x) => x.id === code);
  return m ? `${m.id} · ${m.short}` : measure;
}

function ReasonPill({ reason, tone = "neutral" }: { reason: string; tone?: "neutral" | "unknown" }) {
  const cls = tone === "unknown"
    ? "bg-warning/10 text-warning border-warning/30"
    : "bg-muted text-foreground border-border";
  return (
    <Badge variant="outline" className={`text-xs font-normal ${cls}`}>
      {REASON_LABEL[reason as Reason] ?? reason}
    </Badge>
  );
}

export default function BarriersPage() {
  const queryClient = useQueryClient();
  const boardFn = useServerFn(getBarrierBoard);
  const saveFn = useServerFn(saveBarrier);
  const deleteFn = useServerFn(deleteBarrier);
  const sites = useSiteOptions();

  const { data, isLoading } = useQuery({
    queryKey: ["barriers", "board"],
    queryFn: () => boardFn() as Promise<BoardData>,
  });

  const [editing, setEditing] = useState<Partial<Barrier> | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<BarrierFilter>("active");
  const [template, setTemplate] = useState<PDSATemplate | null>(null);

  const saveMutation = useMutation({
    mutationFn: (payload: unknown) => saveFn({ data: payload as never }),
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

  const barriers = (data?.barriers ?? []) as Barrier[];
  const decisions = data?.decisions ?? [];
  const ideas = data?.ideas ?? [];
  const userId = data?.userId ?? null;
  const waitingCount = new Set(waitingOnUser(decisions, userId).map((d) => d.barrier_id)).size;
  const startHere = startHereId(barriers);
  const filtered = sortBarriers(filterBarriers(barriers, filter, decisions, userId));
  const linksFor = (id: string) => (data?.links ?? []).filter((l) => l.barrier_id === id);

  const openTemplate = (templateId: string | null) => {
    const t = templateId ? PDSA_TEMPLATES.find((x) => x.id === templateId) : null;
    if (t) setTemplate(t);
  };

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

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter barriers">
        {FILTERS.map((f) => (
          <Button
            key={f.id}
            variant={filter === f.id ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            {f.id === "waiting" && (
              <span className={`ml-1.5 rounded-full px-1.5 text-xs ${filter === f.id ? "bg-primary-foreground/20" : "bg-muted"}`}>
                {waitingCount}
              </span>
            )}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading…</CardContent></Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title={filter === "waiting" ? "Nothing is waiting on you" : filter === "closed" ? "No closed barriers yet" : "No active barriers"}
          description={filter === "active"
            ? "Record a barrier when the team sees a pattern blocking a measure. Never record individual patients."
            : "Barriers will show here as they move through their lifecycle."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((b) => {
            const status = normalizeStatus(b.status);
            const StatusIcon = STATUS_ICON[status];
            const why = whySection(b.reasons);
            const seen = alsoSeenOn(b, barriers);
            const links = linksFor(b.id);
            const estimate = patientsLine(b.est_patients, b.period);
            const title = b.symptom ? SYMPTOM_LABEL[b.symptom as Symptom] : b.title;
            const mLabel = measureLabel(b.affected_measure_id);
            return (
              <Card key={b.id} className={`border-l-4 ${status === "mitigated" ? "border-l-success" : status === "closed_unresolved" ? "border-l-border" : "border-l-warning"}`}>
                <CardContent className="p-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      {mLabel && <Badge variant="secondary" className="text-[11px] font-normal">{measureCode(mLabel) || mLabel}</Badge>}
                      <Badge variant="outline" className={`text-[11px] font-normal ${STATUS_CLASS[status]}`}>
                        <StatusIcon className="h-3 w-3 mr-1" /> {STATUS_LABEL[status]}
                      </Badge>
                      {startHere === b.id && (
                        <Badge className="bg-primary text-primary-foreground text-[11px] px-1.5 py-0"><Sparkles className="h-3 w-3 mr-1" /> Start here</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" /> {b.owner_role || "No owner"}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Edit barrier" onClick={() => setEditing(b)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" aria-label="Delete barrier" onClick={() => setDeleting(b.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold leading-snug line-clamp-2" title={b.title ?? undefined}>{title}</p>
                      <div className="flex flex-wrap gap-1">
                        {why.notYetKnown ? <ReasonPill reason="not_yet_known" tone="unknown" /> : why.reasons.map((r) => <ReasonPill key={r} reason={r} />)}
                        {seen.length > 0 && <span className="text-[11px] text-muted-foreground self-center">Also on {seen.join(", ")}</span>}
                      </div>
                    </div>
                    <p className="shrink-0 text-right text-sm font-semibold tabular-nums">{estimate || <span className="text-xs font-normal text-muted-foreground">No estimate</span>}</p>
                  </div>
                  <div className="flex flex-col gap-1 border-t pt-2 text-xs">
                    {links.length > 0 && (
                      <div className="flex flex-wrap items-center gap-x-2 truncate">
                        <span className="inline-flex items-center gap-1 text-muted-foreground"><Link2 className="h-3 w-3" /> Surfaced in</span>
                        {links.map((l) => (
                          <Link key={l.cycle_id} to={`/dashboard/pdsa-lab?openCycle=${l.cycle_id}`} className="text-primary underline underline-offset-2 truncate max-w-[14rem]">{l.title}</Link>
                        ))}
                      </div>
                    )}
                    {status === "decision_requested" && (
                      <p><span className="font-semibold">Decision needed:</span> Clinical Quality Director</p>
                    )}
                    {b.change_made ? (
                      <p className="line-clamp-2"><span className="font-semibold">Change made:</span> {b.change_made}</p>
                    ) : (
                      <button type="button" className="text-left text-muted-foreground hover:text-primary" onClick={() => setEditing(b)}>+ Record the change your team made</button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!template} onOpenChange={(v) => !v && setTemplate(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{template?.title}</DialogTitle>
          </DialogHeader>
          {template && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">{template.description}</p>
              <div><p className="text-xs font-semibold text-muted-foreground">Aim</p><p>{template.aim}</p></div>
              <div><p className="text-xs font-semibold text-muted-foreground">Test</p><p>{template.testDescription}</p></div>
              <div><p className="text-xs font-semibold text-muted-foreground">Measurement plan</p><p>{template.measurementPlan}</p></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplate(null)}>Close</Button>
            <Button asChild><Link to="/dashboard/pdsa-lab">Go to PDSA Lab</Link></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <div className="space-y-1.5">
              <Label>Change made</Label>
              <Textarea value={editing?.change_made ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, change_made: e.target.value }))} placeholder="What did your team actually change to work around this?" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={normalizeStatus(editing?.status)} onValueChange={(v) => setEditing((p) => ({ ...p!, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as BarrierStatus[]).map((st) => (
                      <SelectItem key={st} value={st}>{STATUS_LABEL[st]}</SelectItem>
                    ))}
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
