import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Download, Loader2, FileText } from "lucide-react";
import type {
  QIMeeting,
  QIOversightRole,
} from "@/types/auditBinder";
import {
  generateAuditBinderPdf,
  type AuditBinderPdfChecklistRow,
  type AuditBinderPdfMeasureRow,
  type AuditBinderPdfPdsaCycle,
} from "@/lib/auditBinderPdf";

const sb = supabase as unknown as {
  from: (t: string) => any;
  auth: typeof supabase.auth;
};

function arrFromText(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}


// ── Section 1: Oversight Roles ─────────────────────────────
function OversightDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<QIOversightRole>;
  onSave: (vals: Partial<QIOversightRole>) => void;
}) {
  const [area, setArea] = useState(initial?.area ?? "");
  const [owner, setOwner] = useState(
    initial?.owner_name_override ?? initial?.owner_role ?? "",
  );
  const [freq, setFreq] = useState(initial?.review_frequency ?? "");
  const [docLoc, setDocLoc] = useState(initial?.documentation_location ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit oversight row" : "Add oversight row"}</DialogTitle>
          <DialogDescription>
            Quality infrastructure ownership for a clinical or operational area.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Area</Label>
            <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g., Clinical Quality" />
          </div>
          <div>
            <Label>Owner</Label>
            <Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Role or person name" />
          </div>
          <div>
            <Label>Review Frequency</Label>
            <Input value={freq} onChange={(e) => setFreq(e.target.value)} placeholder="e.g., Monthly" />
          </div>
          <div>
            <Label>Documentation Location</Label>
            <Input value={docLoc} onChange={(e) => setDocLoc(e.target.value)} placeholder="e.g., Shared drive > QI > Policies" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (!area.trim()) {
                toast.error("Area is required");
                return;
              }
              onSave({
                area: area.trim(),
                owner_name_override: owner.trim() || null,
                owner_role: null,
                review_frequency: freq.trim() || null,
                documentation_location: docLoc.trim() || null,
              });
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Section 2: Meeting Dialog ─────────────────────────────
function MeetingDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (vals: {
    meeting_date: string;
    chair_name: string;
    attendees: string[];
    agenda_summary: string[];
    key_decisions: string[];
  }) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [chair, setChair] = useState("");
  const [attendees, setAttendees] = useState("");
  const [agenda, setAgenda] = useState("");
  const [decisions, setDecisions] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log QI Committee Meeting</DialogTitle>
          <DialogDescription>
            One bullet per line for attendees, agenda, and decisions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Meeting Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Chair</Label>
            <Input value={chair} onChange={(e) => setChair(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Attendees (one per line)</Label>
          <Textarea rows={4} value={attendees} onChange={(e) => setAttendees(e.target.value)} />
        </div>
        <div>
          <Label>Agenda Summary (one per line)</Label>
          <Textarea rows={4} value={agenda} onChange={(e) => setAgenda(e.target.value)} />
        </div>
        <div>
          <Label>Key Decisions (one per line)</Label>
          <Textarea rows={4} value={decisions} onChange={(e) => setDecisions(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() =>
              onSave({
                meeting_date: date,
                chair_name: chair.trim(),
                attendees: arrFromText(attendees),
                agenda_summary: arrFromText(agenda),
                key_decisions: arrFromText(decisions),
              })
            }
          >
            Save Meeting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Section 3: Generate Dialog ───────────────────────────
function GenerateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const today = new Date();
  const [start, setStart] = useState(
    new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().slice(0, 10),
  );
  const [end, setEnd] = useState(today.toISOString().slice(0, 10));
  const [summary, setSummary] = useState("");

  const generate = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error("No organization");
      const { data: userData } = await supabase.auth.getUser();
      const orgId = organization.id;

      const [
        oversightRes,
        meetingsRes,
        pdsaRes,
        trendsRes,
        targetsRes,
        tasksRes,
      ] = await Promise.all([
        sb.from("qi_oversight_roles").select("*").eq("organization_id", orgId).order("sort_order"),
        sb.from("qi_meetings").select("*").eq("organization_id", orgId)
          .gte("meeting_date", start).lte("meeting_date", end)
          .order("meeting_date", { ascending: false }),
        sb.from("pdsa_cycles").select("*").eq("organization_id", orgId).is("deleted_at", null)
          .gte("created_at", start).lte("created_at", `${end}T23:59:59`),
        sb.from("uds_trends").select("*").eq("organization_id", orgId)
          .gte("month", start.slice(0, 7)).lte("month", end.slice(0, 7)),
        sb.from("uds_targets").select("*").eq("organization_id", orgId),
        sb.from("tasks").select("*").eq("organization_id", orgId).neq("status", "completed"),
      ]);

      const oversight = (oversightRes.data ?? []) as QIOversightRole[];
      const meetings = (meetingsRes.data ?? []) as QIMeeting[];
      const pdsaCycles = (pdsaRes.data ?? []) as AuditBinderPdfPdsaCycle[];
      const trends = (trendsRes.data ?? []) as { measure_id: string; month: string; value: number }[];
      const targets = (targetsRes.data ?? []) as { measure_id: string; target_value: number }[];
      const tasks = (tasksRes.data ?? []) as Array<{
        title: string;
        assigned_role: string | null;
        due_date: string | null;
        priority: string | null;
        status: string;
      }>;

      // Active PDSA = status != 'plan'
      const activePdsaCount = pdsaCycles.filter((p) => p.status !== "plan").length;

      // Measures: distinct uds_measure from active pdsa + distinct measure_id in trends
      const measureSet = new Set<string>();
      pdsaCycles.forEach((p) => {
        if (p.uds_measure) measureSet.add(p.uds_measure);
      });
      trends.forEach((t) => measureSet.add(t.measure_id));

      // Measure rows
      const trendsByMeasure = new Map<string, typeof trends>();
      trends.forEach((t) => {
        const arr = trendsByMeasure.get(t.measure_id) ?? [];
        arr.push(t);
        trendsByMeasure.set(t.measure_id, arr);
      });
      const targetMap = new Map(targets.map((t) => [t.measure_id, t.target_value]));
      const measures: AuditBinderPdfMeasureRow[] = Array.from(trendsByMeasure.entries()).map(
        ([measure_id, list]) => {
          const sorted = [...list].sort((a, b) => a.month.localeCompare(b.month));
          const baseline = sorted[0]?.value ?? null;
          const current = sorted[sorted.length - 1]?.value ?? null;
          const target = targetMap.get(measure_id) ?? null;
          let status: AuditBinderPdfMeasureRow["status"] = "Flat";
          if (baseline != null && current != null) {
            if (target != null) {
              if (current >= target) status = "At target";
              else {
                const baseDist = Math.abs(target - baseline);
                const curDist = Math.abs(target - current);
                if (curDist < baseDist) status = "Improving";
                else if (curDist > baseDist) status = "Declining";
                else status = "Flat";
              }
            } else {
              if (current > baseline) status = "Improving";
              else if (current < baseline) status = "Declining";
              else status = "Flat";
            }
          }
          return { measure_id, baseline, current, target, status };
        },
      );

      // Checklist
      const pdsaWithStaff = pdsaCycles.filter((p) => (p.assigned_staff ?? []).length > 0).length;
      const accountabilityStatus: AuditBinderPdfChecklistRow["evidence"] =
        pdsaCycles.length === 0
          ? "No"
          : pdsaWithStaff === pdsaCycles.length
            ? "Yes"
            : pdsaWithStaff > 0
              ? "Partial"
              : "No";
      // "Improvement actions tracked to closure": closed (not open) tasks in period — but tasks query
      // only fetched open ones. Re-derive: at minimum we know open task count.
      const openTaskCount = tasks.length;
      // Fetch closed count as a quick aggregate
      const closedRes = await sb.from("tasks").select("id", { count: "exact", head: true })
        .eq("organization_id", orgId).eq("status", "completed")
        .gte("created_at", start).lte("created_at", `${end}T23:59:59`);
      const closedCount: number = closedRes.count ?? 0;

      const closureStatus: AuditBinderPdfChecklistRow["evidence"] =
        openTaskCount === 0 && closedCount > 0
          ? "Yes"
          : openTaskCount > 0 && closedCount > 0
            ? "Partial"
            : openTaskCount > 0
              ? "Partial"
              : "No";

      const checklist: AuditBinderPdfChecklistRow[] = [
        {
          requirement: "Written QI activities documented",
          evidence: pdsaCycles.length >= 1 ? "Yes" : "No",
          notes: pdsaCycles.length >= 1 ? `${pdsaCycles.length} PDSA log(s) included.` : "No PDSA cycles found in period.",
        },
        {
          requirement: "Measure trends reviewed",
          evidence: trends.length >= 1 ? "Yes" : "No",
          notes: trends.length >= 1 ? `${measures.length} measure(s) trended.` : "No measure trend data in period.",
        },
        {
          requirement: "Committee oversight documented",
          evidence: meetings.length >= 1 ? "Yes" : "No",
          notes: meetings.length >= 1
            ? `${meetings.length} meeting(s) logged.`
            : "No QI committee meetings logged for this period — add one before relying on this binder for OSV prep.",
        },
        {
          requirement: "Assigned accountability visible",
          evidence: accountabilityStatus,
          notes:
            pdsaCycles.length === 0
              ? "No PDSA cycles to evaluate."
              : `${pdsaWithStaff} of ${pdsaCycles.length} PDSA cycles have assigned staff.`,
        },
        {
          requirement: "Improvement actions tracked to closure",
          evidence: closureStatus,
          notes: `${closedCount} task(s) closed in period; ${openTaskCount} still open.`,
        },
      ];

      const pdf = generateAuditBinderPdf({
        orgName: organization.name,
        periodStart: start,
        periodEnd: end,
        generatedBy: userData.user?.email ?? "—",
        executiveSummary: summary.trim() ? summary.trim() : null,
        oversight: oversight.map((o) => ({
          area: o.area,
          owner: o.owner_name_override || o.owner_role || "—",
          review_frequency: o.review_frequency,
          documentation_location: o.documentation_location,
        })),
        pdsaCycles,
        measures,
        openTasks: tasks.map((t) => ({
          title: t.title,
          assigned_role: t.assigned_role,
          due_date: t.due_date,
          priority: t.priority,
          status: t.status,
        })),
        meetings: meetings.map((m) => ({
          meeting_date: m.meeting_date,
          chair_name: m.chair_name,
          attendees: m.attendees ?? [],
          agenda_summary: m.agenda_summary ?? [],
          key_decisions: m.key_decisions ?? [],
        })),
        checklist,
        stats: {
          activePdsaCount,
          measuresMonitored: measureSet.size,
        },
      });

      pdf.save(`audit-binder-${start}-to-${end}.pdf`);

      await sb.from("audit_binder_exports").insert({
        organization_id: orgId,
        period_start: start,
        period_end: end,
        executive_summary: summary.trim() || null,
        generated_by: userData.user?.id ?? null,
        pdsa_count: pdsaCycles.length,
        measure_count: measureSet.size,
        evidence_count: 0,
      });
    },
    onSuccess: () => {
      toast.success("HRSA Audit Binder generated");
      qc.invalidateQueries({ queryKey: ["audit_binder_exports"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message || "Generation failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Generate Audit Binder</DialogTitle>
          <DialogDescription>
            Produces a complete audit-ready PDF for the selected reporting period.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Period start</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <Label>Period end</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Executive summary (optional)</Label>
          <Textarea
            rows={5}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Leave blank if not providing one. Appears on the cover page."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
            {generate.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Generate PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ────────────────────────────────────────────
export default function AuditBinder() {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const [oversightDialog, setOversightDialog] = useState<{ open: boolean; row?: QIOversightRole }>({
    open: false,
  });
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);

  const oversightQ = useQuery({
    queryKey: ["qi_oversight_roles", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await sb
        .from("qi_oversight_roles")
        .select("*")
        .eq("organization_id", orgId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as QIOversightRole[];
    },
  });

  const meetingsQ = useQuery({
    queryKey: ["qi_meetings", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await sb
        .from("qi_meetings")
        .select("*")
        .eq("organization_id", orgId)
        .order("meeting_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as QIMeeting[];
    },
  });

  const saveOversight = useMutation({
    mutationFn: async (vals: Partial<QIOversightRole>) => {
      if (!orgId) throw new Error("No organization");
      if (oversightDialog.row?.id) {
        const { error } = await sb
          .from("qi_oversight_roles")
          .update(vals)
          .eq("id", oversightDialog.row.id);
        if (error) throw error;
      } else {
        const nextOrder = (oversightQ.data?.length ?? 0) + 1;
        const { error } = await sb.from("qi_oversight_roles").insert({
          ...vals,
          organization_id: orgId,
          sort_order: nextOrder,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["qi_oversight_roles", orgId] });
      setOversightDialog({ open: false });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteOversight = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("qi_oversight_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["qi_oversight_roles", orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMeeting = useMutation({
    mutationFn: async (vals: {
      meeting_date: string;
      chair_name: string;
      attendees: string[];
      agenda_summary: string[];
      key_decisions: string[];
    }) => {
      if (!orgId) throw new Error("No organization");
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await sb.from("qi_meetings").insert({
        organization_id: orgId,
        meeting_date: vals.meeting_date,
        chair_name: vals.chair_name || null,
        attendees: vals.attendees,
        agenda_summary: vals.agenda_summary,
        key_decisions: vals.key_decisions,
        created_by: userData.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Meeting logged");
      qc.invalidateQueries({ queryKey: ["qi_meetings", orgId] });
      setMeetingOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const meetings = meetingsQ.data ?? [];
  const oversight = oversightQ.data ?? [];

  const meetingPreview = useMemo(
    () =>
      meetings.map((m) => ({
        id: m.id,
        date: m.meeting_date,
        chair: m.chair_name ?? "—",
        attendeeCount: (m.attendees ?? []).length,
      })),
    [meetings],
  );

  return (
    <div className="space-y-6 p-6">
      <Helmet>
        <title>HRSA Audit Binder — MeasureWise</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">HRSA Audit Binder</h1>
          <p className="text-muted-foreground text-sm">
            Composite, audit-ready PDF that pulls in QI oversight, committee meetings, UDS measures, and PDSA logs.
          </p>
        </div>
        <Button onClick={() => setGenerateOpen(true)}>
          <FileText className="h-4 w-4 mr-2" />
          Generate Audit Binder
        </Button>
      </div>

      {/* Section 1: Oversight */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Quality Infrastructure Summary</CardTitle>
            <CardDescription>
              Ownership map for each QI area. Edited rarely; appears in Section 1 of the binder.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setOversightDialog({ open: true })}>
            <Plus className="h-4 w-4 mr-1" /> Add row
          </Button>
        </CardHeader>
        <CardContent>
          {oversight.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rows yet. Add your first oversight area.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Review Frequency</TableHead>
                  <TableHead>Documentation Location</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {oversight.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.area}</TableCell>
                    <TableCell>{r.owner_name_override || r.owner_role || "—"}</TableCell>
                    <TableCell>{r.review_frequency || "—"}</TableCell>
                    <TableCell>{r.documentation_location || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setOversightDialog({ open: true, row: r })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Delete this row?")) deleteOversight.mutate(r.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Meetings */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>QI Committee Meetings</CardTitle>
            <CardDescription>
              Log each meeting so it appears in Section 6 of the binder.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setMeetingOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add meeting
          </Button>
        </CardHeader>
        <CardContent>
          {meetingPreview.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meetings logged yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Chair</TableHead>
                  <TableHead>Attendees</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetingPreview.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{new Date(m.date).toLocaleDateString()}</TableCell>
                    <TableCell>{m.chair}</TableCell>
                    <TableCell>{m.attendeeCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {oversightDialog.open && (
        <OversightDialog
          open={oversightDialog.open}
          onOpenChange={(v) => setOversightDialog({ open: v, row: v ? oversightDialog.row : undefined })}
          initial={oversightDialog.row}
          onSave={(vals) => saveOversight.mutate(vals)}
        />
      )}

      <MeetingDialog
        open={meetingOpen}
        onOpenChange={setMeetingOpen}
        onSave={(vals) => saveMeeting.mutate(vals)}
      />

      <GenerateDialog open={generateOpen} onOpenChange={setGenerateOpen} />
    </div>
  );
}
