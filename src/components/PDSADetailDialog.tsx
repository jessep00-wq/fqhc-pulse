import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { UDS_MEASURES } from "@/data/mockData";
import { CalendarIcon, Plus, CheckCircle2, Circle, Clock, Loader2, Copy, Lightbulb, ThumbsUp, RefreshCw, X, FileText, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CompletenessRing } from "@/components/pdsa/CompletenessRing";
import { EvidencePanel } from "@/components/pdsa/EvidencePanel";
import { CycleChain } from "@/components/pdsa/CycleChain";
import { getPdsaProgress, blockersForCompletion } from "@/lib/pdsaProgress";
import { WorkstreamRibbon } from "@/components/workstream/WorkstreamRibbon";
import { DownstreamImpactPanel } from "@/components/workstream/DownstreamImpactPanel";
import { getPdsaWorkstream } from "@/lib/workstream/pdsaWorkstream";
import CycleEvidenceDocDialog from "@/components/pdsa/CycleEvidenceDocDialog";
import CycleHistoryTab from "@/components/pdsa/CycleHistoryTab";
import { useRecordHistory } from "@/hooks/useRecordHistory";


interface DBCycle {
  id: string;
  organization_id: string;
  title: string;
  status: string;
  uds_measure: string | null;
  root_cause: string | null;
  target_goal: string | null;
  clinical_workflow_impact: string | null;
  assigned_staff: string[] | null;
  improvement_pct: number | null;
  created_at: string;
  study_results?: string | null;
  what_worked?: string | null;
  what_didnt_work?: string | null;
  act_next_steps?: string | null;
  aim_statement?: string | null;
  prediction?: string | null;
  measurement_plan?: string | null;
  test_description?: string | null;
  analysis_summary?: string | null;
  decision?: string | null;
  template_id?: string | null;
  owner_user_id?: string | null;
  start_date?: string | null;
  baseline_rate?: number | null;
  predicted_outcome?: string | null;
  intervention_description?: string | null;
  actual_outcome?: string | null;
  next_cycle_decision?: string | null;
  previous_cycle_id?: string | null;
  next_cycle_id?: string | null;
  completeness_score?: number | null;
  focus_area?: string | null;
  opened_at?: string | null;
  target_end_date?: string | null;
  doc_version?: number | null;
}

type TaskStatus = "pending" | "in_progress" | "completed";

interface DialogTask {
  id: string;
  title: string;
  status: TaskStatus;
  assigned_role: string | null;
  due_date: string | null;
  acknowledged: boolean;
}

type CycleStringField = "title" | "root_cause" | "target_goal" | "clinical_workflow_impact" | "study_results" | "what_worked" | "what_didnt_work" | "act_next_steps" | "uds_measure" | "focus_area" | "aim_statement" | "prediction" | "measurement_plan" | "test_description" | "analysis_summary" | "decision" | "owner_user_id" | "start_date" | "opened_at" | "target_end_date" | "predicted_outcome" | "intervention_description" | "actual_outcome" | "next_cycle_decision";
type CycleNumberField = "improvement_pct" | "baseline_rate";

const STAFF_ROLES = ["Front Desk", "MA/RN", "Provider", "Care Coordinator", "QI Manager"];
const TASK_STATUSES = ["pending", "in_progress", "completed"] as const;

const STATUS_ICON = {
  pending: <Circle className="h-4 w-4 text-muted-foreground" />,
  in_progress: <Clock className="h-4 w-4 text-warning" />,
  completed: <CheckCircle2 className="h-4 w-4 text-success" />,
};

function nextStatus(current: TaskStatus): TaskStatus {
  const order: TaskStatus[] = ["pending", "in_progress", "completed"];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}

function CoachingTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
      <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

const DECISION_OPTIONS = [
  {
    value: "Adopt",
    icon: ThumbsUp,
    label: "Adopt",
    description: "The change worked. Standardize it across your clinic.",
    color: "border-success/40 bg-success/5 hover:border-success",
  },
  {
    value: "Adapt",
    icon: RefreshCw,
    label: "Adapt",
    description: "Promising results, but needs adjustment. Run another cycle.",
    color: "border-warning/40 bg-warning/5 hover:border-warning",
  },
  {
    value: "Abandon",
    icon: X,
    label: "Abandon",
    description: "The change didn't work. Try a different approach.",
    color: "border-destructive/40 bg-destructive/5 hover:border-destructive",
  },
];

export default function PDSADetailDialog({
  cycle,
  open,
  onClose,
}: {
  cycle: DBCycle | null;
  open: boolean;
  onClose: () => void;
}) {
  const { organization } = useOrg();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("aim");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [evidenceDocOpen, setEvidenceDocOpen] = useState(false);

  const [newTaskRole, setNewTaskRole] = useState("");
  const [newTaskDate, setNewTaskDate] = useState<Date>();
  const [actualOutcomeDraft, setActualOutcomeDraft] = useState<string>(cycle?.actual_outcome || "");
  const [decisionDraft, setDecisionDraft] = useState<string>(
    (cycle?.next_cycle_decision || cycle?.decision || "").toLowerCase(),
  );

  // Reset drafts whenever a different cycle is opened
  useEffect(() => {
    setActualOutcomeDraft(cycle?.actual_outcome || "");
    setDecisionDraft((cycle?.next_cycle_decision || cycle?.decision || "").toLowerCase());
  }, [cycle?.id, cycle?.actual_outcome, cycle?.next_cycle_decision, cycle?.decision]);

  const { data: cycleTasks = [] } = useQuery({
    queryKey: ["tasks", organization?.id, cycle?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("organization_id", organization!.id)
        .eq("pdsa_cycle_id", cycle!.id)
        .order("created_at");
      return data || [];
    },
    enabled: !!cycle?.id && !!organization?.id,
  });


  type CycleUpdate = Partial<Omit<DBCycle, "id" | "organization_id" | "created_at">>;

  const formatSupabaseError = (err: unknown, fallback: string) => {
    const e = err as { message?: string | null; details?: string | null; hint?: string | null; code?: string | null };
    return (
      (e?.message && e.message.trim()) ||
      (e?.details && e.details.trim()) ||
      (e?.hint && e.hint.trim()) ||
      (e?.code && `Error code: ${e.code}`) ||
      fallback
    );
  };

  const updateCycle = useMutation({
    mutationFn: async (updates: CycleUpdate) => {
      const { error } = await supabase
        .from("pdsa_cycles")
        .update(updates)
        .eq("id", cycle!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pdsa_cycles"] }),
    onError: (err: Error) => toast.error(formatSupabaseError(err, "Failed to update")),
  });

  const createTask = useMutation({
    mutationFn: async (task: { title: string; assigned_role: string | null; due_date: string | null }) => {
      const { error } = await supabase.from("tasks").insert({
        ...task,
        organization_id: organization.id,
        pdsa_cycle_id: cycle!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewTaskTitle("");
      setNewTaskRole("");
      setNewTaskDate(undefined);
      toast.success("Task added");
    },
    onError: (err: Error) => toast.error(formatSupabaseError(err, "Failed to add task")),
  });

  type TaskUpdate = Partial<Omit<DialogTask, "id">>;

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TaskUpdate }) => {
      const { error } = await supabase.from("tasks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (err: Error) => toast.error(formatSupabaseError(err, "Failed to update task")),
  });


  const cloneCycle = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pdsa_cycles").insert({
        organization_id: organization.id,
        title: `${cycle!.title} (v2)`,
        status: "plan",
        uds_measure: cycle!.uds_measure,
        root_cause: cycle!.root_cause,
        target_goal: cycle!.target_goal,
        clinical_workflow_impact: cycle!.clinical_workflow_impact,
        assigned_staff: cycle!.assigned_staff,
        aim_statement: cycle!.aim_statement,
        prediction: cycle!.prediction,
        measurement_plan: cycle!.measurement_plan,
        test_description: cycle!.test_description,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdsa_cycles"] });
      toast.success("New cycle created from current");
      onClose();
    },
    onError: (err: Error) => toast.error(formatSupabaseError(err, "Failed to clone cycle")),
  });

  const { data: orgProfiles = [] } = useQuery({
    queryKey: ["org_profiles", organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,staff_role")
        .eq("organization_id", organization!.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: cycleEvidence = [] } = useQuery({
    queryKey: ["pdsa_evidence_for_cycle", organization?.id, cycle?.id],
    enabled: !!cycle?.id && !!organization?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("pdsa_evidence")
        .select("pdsa_cycle_id")
        .eq("organization_id", organization!.id)
        .eq("pdsa_cycle_id", cycle!.id);
      return (data ?? []) as { pdsa_cycle_id: string }[];
    },
  });

  const { data: cycleRevisions = [], isLoading: revisionsLoading } = useRecordHistory(
    "pdsa_cycle",
    cycle?.id ? [cycle.id] : [],
    organization?.id,
    open,
  );

  const profileNames = Object.fromEntries(
    orgProfiles.map((p) => [p.id, p.full_name || "Unnamed"]),
  ) as Record<string, string>;




  if (!cycle) return null;

  const handleBlurUpdate = (field: CycleStringField | CycleNumberField, value: string | number | null) => {
    if (cycle[field] !== value) {
      updateCycle.mutate({ [field]: value });
    }
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    createTask.mutate({
      title: newTaskTitle.trim(),
      assigned_role: newTaskRole || null,
      due_date: newTaskDate ? format(newTaskDate, "yyyy-MM-dd") : null,
    });
  };

  const handleComplete = async () => {
    const actual = actualOutcomeDraft.trim();
    if (!actual) {
      toast.error("Add an Actual Outcome on the Study (Results) tab before marking the cycle completed.");
      return;
    }
    const decision = decisionDraft.toLowerCase();
    if (!["adopt", "adapt", "abandon"].includes(decision)) {
      toast.error("Pick a Next-Cycle Decision (Adopt, Adapt, or Abandon) before marking the cycle completed.");
      return;
    }
    const outstanding = blockersForCompletion({
      ...cycle,
      actual_outcome: actual,
      next_cycle_decision: decision,
    });
    if (outstanding.length > 0) {
      toast.error(`Still missing before this cycle can be completed: ${outstanding.join(", ")}.`);
      return;
    }
    const decisionLabel = decision.charAt(0).toUpperCase() + decision.slice(1);
    try {
      await updateCycle.mutateAsync({
        status: "completed",
        actual_outcome: actual,
        next_cycle_decision: decision,
        decision: decisionLabel,
      });
      toast.success("Cycle marked as completed");
      onClose();
    } catch {
      // updateCycle.onError already surfaces the error toast
    }
  };

  const progress = getPdsaProgress(cycle, { evidenceCount: cycleEvidence.length });
  const score = progress.completenessPct;

  const workstreamFacts = getPdsaWorkstream(
    cycle,
    cycleTasks as { pdsa_cycle_id: string | null; status: string; due_date?: string | null }[],
    cycleEvidence,
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="text-lg">{cycle.title}</DialogTitle>
              <DialogDescription>
                <Badge variant="outline" className="mr-2">{cycle.status.toUpperCase()}</Badge>
                {cycle.uds_measure
                  ? <Badge variant="secondary">{cycle.uds_measure.split(":")[0]}</Badge>
                  : cycle.focus_area
                    ? <Badge variant="secondary">{cycle.focus_area}</Badge>
                    : null}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button size="sm" variant="outline" onClick={() => setEvidenceDocOpen(true)}>
                <FileText className="h-4 w-4 mr-1" /> Evidence doc
              </Button>
              <CompletenessRing score={score} />
            </div>
          </div>

        </DialogHeader>

        <WorkstreamRibbon facts={workstreamFacts} className="mb-2" />
        <DownstreamImpactPanel facts={workstreamFacts} />


        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="space-y-2">
            <TabsList className="grid w-full grid-cols-4">
              {[
                { value: "aim", label: "Plan", sub: "Aim" },
                { value: "test", label: "Do", sub: "Action" },
                { value: "analyze", label: "Study", sub: "Results" },
                { value: "decide", label: "Act", sub: "Decision" },
              ].map((t) => {
                const st = progress.stages.find((s) =>
                  ({ aim: "plan", test: "do", analyze: "study", decide: "act" } as const)[
                    t.value as "aim" | "test" | "analyze" | "decide"
                  ] === s.key,
                );
                return (
                  <TabsTrigger key={t.value} value={t.value} className="flex-col gap-0 py-1.5">
                    <span className="flex items-center gap-1">
                      {t.label}
                      {st?.state === "complete" && <CheckCircle2 className="h-3 w-3 text-success" />}
                      {st?.state === "out_of_sequence" && (
                        <AlertTriangle className="h-3 w-3 text-warning" />
                      )}
                    </span>
                    <span className="text-[10px] font-normal text-muted-foreground">{t.sub}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Cycle records
              </span>
              <TabsList className="h-8 bg-muted/60">
                <TabsTrigger value="evidence" className="text-xs h-6">Evidence</TabsTrigger>
                <TabsTrigger value="chain" className="text-xs h-6">Chain</TabsTrigger>
                <TabsTrigger value="history" className="text-xs h-6">History</TabsTrigger>
              </TabsList>
            </div>
          </div>


          {/* AIM & PLAN TAB */}
          <TabsContent value="aim" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                defaultValue={cycle.title}
                onBlur={(e) => handleBlurUpdate("title", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cycle Owner *</Label>
                <Select
                  defaultValue={cycle.owner_user_id || ""}
                  onValueChange={(v) => updateCycle.mutate({ owner_user_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Assign owner" /></SelectTrigger>
                  <SelectContent>
                    {orgProfiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name || "Unnamed"}{p.staff_role ? ` · ${p.staff_role}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  defaultValue={cycle.start_date || ""}
                  onBlur={(e) => handleBlurUpdate("start_date", e.target.value || null)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Opened / Created Date</Label>
                <Input
                  type="date"
                  defaultValue={(cycle.opened_at || cycle.created_at).slice(0, 10)}
                  onBlur={(e) =>
                    handleBlurUpdate(
                      "opened_at",
                      e.target.value ? new Date(`${e.target.value}T12:00:00`).toISOString() : null,
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Adjust if the cycle actually began before it was entered in MeasureWise.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Target End Date</Label>
                <Input
                  type="date"
                  defaultValue={cycle.target_end_date || ""}
                  onBlur={(e) => handleBlurUpdate("target_end_date", e.target.value || null)}
                />
                <p className="text-xs text-muted-foreground">Used to show cycle pace on the evidence document.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Aim Statement</Label>
              <CoachingTip>What are you trying to accomplish? Be specific about the population, measure, and timeframe.</CoachingTip>
              <Textarea
                defaultValue={cycle.aim_statement || ""}
                onBlur={(e) => handleBlurUpdate("aim_statement", e.target.value)}
                placeholder="What specific improvement are you aiming for?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Predicted Outcome *</Label>
              <Textarea
                defaultValue={cycle.predicted_outcome || cycle.prediction || ""}
                onBlur={(e) => handleBlurUpdate("predicted_outcome", e.target.value)}
                placeholder="What measurable result do you expect, and by when?"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>UDS Measure (optional)</Label>
                <Select
                  defaultValue={cycle.uds_measure || "__none__"}
                  onValueChange={(v) =>
                    updateCycle.mutate(
                      v === "__none__" ? { uds_measure: null } : { uds_measure: v, focus_area: null },
                    )
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Select measure" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not tied to a UDS measure</SelectItem>
                    {UDS_MEASURES.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!cycle.uds_measure && (
                  <Input
                    defaultValue={cycle.focus_area || ""}
                    placeholder="Focus area (e.g., No-show rate)"
                    onBlur={(e) => handleBlurUpdate("focus_area", e.target.value)}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Baseline Rate *</Label>
                <Input
                  type="number"
                  step="0.01"
                  defaultValue={cycle.baseline_rate ?? ""}
                  onBlur={(e) => handleBlurUpdate("baseline_rate", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g. 52"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Measurement Plan</Label>
              <Textarea
                defaultValue={cycle.measurement_plan || ""}
                onBlur={(e) => handleBlurUpdate("measurement_plan", e.target.value)}
                placeholder="How will you know a change is an improvement? What data will you collect?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Root Cause</Label>
              <Textarea
                defaultValue={cycle.root_cause || ""}
                onBlur={(e) => handleBlurUpdate("root_cause", e.target.value)}
                placeholder="What's driving the gap?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Goal</Label>
              <Input
                defaultValue={cycle.target_goal || ""}
                onBlur={(e) => handleBlurUpdate("target_goal", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned Staff</Label>
              <div className="flex flex-wrap gap-2">
                {STAFF_ROLES.map((role) => {
                  const selected = (cycle.assigned_staff || []).includes(role);
                  return (
                    <Badge
                      key={role}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = cycle.assigned_staff || [];
                        const next = selected
                          ? current.filter((r) => r !== role)
                          : [...current, role];
                        updateCycle.mutate({ assigned_staff: next });
                      }}
                    >
                      {role}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* TEST TAB */}
          <TabsContent value="test" className="space-y-4 mt-4">
            <CoachingTip>Start small — test with one provider, one clinic day, or a handful of patients. You can always scale what works.</CoachingTip>
            <div className="space-y-2">
              <Label>Intervention Description *</Label>
              <Textarea
                defaultValue={cycle.intervention_description || cycle.test_description || ""}
                onBlur={(e) => handleBlurUpdate("intervention_description", e.target.value)}
                placeholder="Who is involved? What will they do differently? For how long?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Clinical Workflow Impact</Label>
              <Textarea
                defaultValue={cycle.clinical_workflow_impact || ""}
                onBlur={(e) => handleBlurUpdate("clinical_workflow_impact", e.target.value)}
                placeholder="How will clinical workflows change during this test?"
                rows={2}
              />
            </div>

            {/* Tasks */}
            <div className="space-y-2 pt-2">
              <Label className="text-sm font-semibold">Tasks</Label>
              {cycleTasks.length === 0 && (
                <p className="text-sm text-muted-foreground">No tasks yet. Add one below.</p>
              )}
              {(cycleTasks as DialogTask[]).map((task) => (
                <div key={task.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <button
                    className="shrink-0"
                    onClick={() =>
                      updateTask.mutate({
                        id: task.id,
                        updates: { status: nextStatus(task.status) },
                      })
                    }
                  >
                    {STATUS_ICON[task.status as keyof typeof STATUS_ICON] || STATUS_ICON.pending}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", task.status === "completed" && "line-through text-muted-foreground")}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {task.assigned_role && <span>{task.assigned_role}</span>}
                      {task.due_date && <span>Due {format(new Date(task.due_date), "MMM d")}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Checkbox
                      checked={task.acknowledged}
                      onCheckedChange={(v) =>
                        updateTask.mutate({
                          id: task.id,
                          updates: { acknowledged: !!v },
                        })
                      }
                    />
                    <span className="text-xs text-muted-foreground">Ack</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Task Form */}
            <div className="rounded-lg border border-dashed p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Add Task</p>
              <Input
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
              <div className="flex gap-2">
                <Select value={newTaskRole} onValueChange={setNewTaskRole}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Assign role" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[140px] justify-start text-left", !newTaskDate && "text-muted-foreground")}>
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {newTaskDate ? format(newTaskDate, "MMM d") : "Due date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newTaskDate}
                      onSelect={setNewTaskDate}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button size="sm" onClick={handleAddTask} disabled={!newTaskTitle.trim() || createTask.isPending}>
                {createTask.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                Add Task
              </Button>
            </div>
          </TabsContent>

          {/* ANALYZE TAB */}
          <TabsContent value="analyze" className="space-y-4 mt-4">
            <CoachingTip>Did the results match your prediction? What surprised you? Even "failed" tests generate valuable learning.</CoachingTip>
            <div className="space-y-2">
              <Label>Actual Outcome *</Label>
              <Textarea
                value={actualOutcomeDraft}
                onChange={(e) => setActualOutcomeDraft(e.target.value)}
                onBlur={(e) => handleBlurUpdate("actual_outcome", e.target.value)}
                placeholder="What measurable result did you see? Required to mark the cycle completed."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Analysis Summary</Label>
              <Textarea
                defaultValue={cycle.analysis_summary || ""}
                onBlur={(e) => handleBlurUpdate("analysis_summary", e.target.value)}
                placeholder="What did the data tell you? Did results match your prediction?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Results / Observations</Label>
              <Textarea
                defaultValue={cycle.study_results || ""}
                onBlur={(e) => handleBlurUpdate("study_results", e.target.value)}
                placeholder="What did you observe during this cycle?"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>What Worked</Label>
                <Textarea
                  defaultValue={cycle.what_worked || ""}
                  onBlur={(e) => handleBlurUpdate("what_worked", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>What Didn't Work</Label>
                <Textarea
                  defaultValue={cycle.what_didnt_work || ""}
                  onBlur={(e) => handleBlurUpdate("what_didnt_work", e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Improvement %</Label>
              <Input
                type="number"
                defaultValue={cycle.improvement_pct ?? ""}
                onBlur={(e) =>
                  handleBlurUpdate("improvement_pct", e.target.value ? parseInt(e.target.value) : null)
                }
                placeholder="e.g. 15"
              />
            </div>
          </TabsContent>

          {/* DECIDE TAB */}
          <TabsContent value="decide" className="space-y-4 mt-4">
            <CoachingTip>Based on your analysis, choose one: Adopt the change, Adapt it for another cycle, or Abandon and try something different.</CoachingTip>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Next-Cycle Decision *</Label>
              <div className="grid grid-cols-3 gap-3">
                {DECISION_OPTIONS.map((opt) => {
                  const value = opt.value.toLowerCase();
                  const selected = decisionDraft === value;
                  return (
                    <button
                      key={opt.value}
                      className={cn(
                        "rounded-lg border-2 p-3 text-left transition-colors space-y-1.5",
                        opt.color,
                        selected && "ring-2 ring-primary",
                      )}
                      onClick={() => {
                        setDecisionDraft(value);
                        updateCycle.mutate({ next_cycle_decision: value, decision: opt.value });
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <opt.icon className="h-4 w-4" />
                        <span className="text-sm font-semibold">{opt.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Next Steps</Label>
              <Textarea
                defaultValue={cycle.act_next_steps || ""}
                onBlur={(e) => handleBlurUpdate("act_next_steps", e.target.value)}
                placeholder="What actions will you take based on your decision?"
                rows={4}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleComplete} disabled={updateCycle.isPending} className="bg-success hover:bg-success/90 text-success-foreground">
                {updateCycle.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Mark Completed
              </Button>
              <Button variant="outline" onClick={() => cloneCycle.mutate()} disabled={cloneCycle.isPending}>
                {cloneCycle.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Copy className="h-4 w-4 mr-1" />}
                Start Next Cycle
              </Button>
            </div>
          </TabsContent>

          {/* EVIDENCE TAB */}
          <TabsContent value="evidence" className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Cycle evidence document</p>
                <p className="text-xs text-muted-foreground">
                  Branded, printable record of this cycle — available at any stage.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEvidenceDocOpen(true)}>
                <FileText className="h-4 w-4 mr-1" /> Generate
              </Button>
            </div>
            <EvidencePanel cycleId={cycle.id} organizationId={cycle.organization_id} />
          </TabsContent>


          {/* CHAIN TAB */}
          <TabsContent value="chain" className="mt-4">
            <CycleChain
              organizationId={cycle.organization_id}
              udsMeasure={cycle.uds_measure}
              focusArea={cycle.focus_area ?? null}
              highlightCycleId={cycle.id}
            />
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="mt-4">
            <CycleHistoryTab
              revisions={cycleRevisions}
              loading={revisionsLoading}
              names={profileNames}
            />
          </TabsContent>
        </Tabs>

        <CycleEvidenceDocDialog
          cycle={evidenceDocOpen ? cycle : null}
          open={evidenceDocOpen}
          onClose={() => setEvidenceDocOpen(false)}
        />
      </DialogContent>
    </Dialog>

  );
}

