import { useState } from "react";
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
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { UDS_MEASURES } from "@/data/mockData";
import { CalendarIcon, Plus, CheckCircle2, Circle, Clock, Loader2, Copy } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

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

type CycleStringField = "title" | "root_cause" | "target_goal" | "clinical_workflow_impact" | "study_results" | "what_worked" | "what_didnt_work" | "act_next_steps" | "uds_measure";
type CycleNumberField = "improvement_pct";

const STAFF_ROLES = ["Front Desk", "MA/RN", "Provider", "Care Coordinator", "QI Manager"];
const TASK_STATUSES = ["pending", "in_progress", "completed"] as const;

const STATUS_ICON = {
  pending: <Circle className="h-4 w-4 text-muted-foreground" />,
  in_progress: <Clock className="h-4 w-4 text-warning" />,
  completed: <CheckCircle2 className="h-4 w-4 text-success" />,
};

function nextStatus(current: string) {
  const order = ["pending", "in_progress", "completed"];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}

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
  const [activeTab, setActiveTab] = useState("plan");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskRole, setNewTaskRole] = useState("");
  const [newTaskDate, setNewTaskDate] = useState<Date>();

  const { data: cycleTasks = [] } = useQuery({
    queryKey: ["tasks", organization.id, cycle?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("pdsa_cycle_id", cycle!.id)
        .order("created_at");
      return data || [];
    },
    enabled: !!cycle?.id && !!organization.id,
  });

  type CycleUpdate = Partial<Omit<DBCycle, "id" | "organization_id" | "created_at">>;

  const updateCycle = useMutation({
    mutationFn: async (updates: CycleUpdate) => {
      const { error } = await supabase
        .from("pdsa_cycles")
        .update(updates)
        .eq("id", cycle!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pdsa_cycles"] }),
    onError: (err: Error) => toast.error(err.message || "Failed to update"),
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
    onError: (err: Error) => toast.error(err.message || "Failed to add task"),
  });

  type TaskUpdate = Partial<Omit<DialogTask, "id">>;

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TaskUpdate }) => {
      const { error } = await supabase.from("tasks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
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
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdsa_cycles"] });
      toast.success("New cycle created from current");
      onClose();
    },
  });

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

  const handleComplete = () => {
    updateCycle.mutate({ status: "completed" });
    toast.success("Cycle marked as completed");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{cycle.title}</DialogTitle>
          <DialogDescription>
            <Badge variant="outline" className="mr-2">{cycle.status.toUpperCase()}</Badge>
            {cycle.uds_measure && <Badge variant="secondary">{cycle.uds_measure.split(":")[0]}</Badge>}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="plan">Plan</TabsTrigger>
            <TabsTrigger value="do">Do</TabsTrigger>
            <TabsTrigger value="study">Study</TabsTrigger>
            <TabsTrigger value="act">Act</TabsTrigger>
          </TabsList>

          {/* PLAN TAB */}
          <TabsContent value="plan" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                defaultValue={cycle.title}
                onBlur={(e) => handleBlurUpdate("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>UDS Measure</Label>
              <Select
                defaultValue={cycle.uds_measure || ""}
                onValueChange={(v) => updateCycle.mutate({ uds_measure: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select measure" /></SelectTrigger>
                <SelectContent>
                  {UDS_MEASURES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Root Cause</Label>
              <Textarea
                defaultValue={cycle.root_cause || ""}
                onBlur={(e) => handleBlurUpdate("root_cause", e.target.value)}
                rows={3}
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
              <Label>Clinical Workflow Impact</Label>
              <Textarea
                defaultValue={cycle.clinical_workflow_impact || ""}
                onBlur={(e) => handleBlurUpdate("clinical_workflow_impact", e.target.value)}
                rows={2}
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

          {/* DO TAB */}
          <TabsContent value="do" className="space-y-4 mt-4">
            <div className="space-y-2">
              {cycleTasks.length === 0 && (
                <p className="text-sm text-muted-foreground">No tasks yet. Add one below.</p>
              )}
              {(cycleTasks as DialogTask[]).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
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

          {/* STUDY TAB */}
          <TabsContent value="study" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Results / Observations</Label>
              <Textarea
                defaultValue={cycle.study_results || ""}
                onBlur={(e) => handleBlurUpdate("study_results", e.target.value)}
                placeholder="What did you observe during this cycle?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>What Worked</Label>
              <Textarea
                defaultValue={cycle.what_worked || ""}
                onBlur={(e) => handleBlurUpdate("what_worked", e.target.value)}
                placeholder="Describe what went well..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>What Didn't Work</Label>
              <Textarea
                defaultValue={cycle.what_didnt_work || ""}
                onBlur={(e) => handleBlurUpdate("what_didnt_work", e.target.value)}
                placeholder="Describe barriers or issues..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Improvement %</Label>
              <Input
                type="number"
                defaultValue={cycle.improvement_pct ?? ""}
                onBlur={(e) =>
                  handleBlurUpdate(
                    "improvement_pct",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="e.g. 15"
              />
            </div>
          </TabsContent>

          {/* ACT TAB */}
          <TabsContent value="act" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Next Steps</Label>
              <Textarea
                defaultValue={cycle.act_next_steps || ""}
                onBlur={(e) => handleBlurUpdate("act_next_steps", e.target.value)}
                placeholder="What actions will you take based on your findings?"
                rows={4}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleComplete} className="bg-success hover:bg-success/90 text-success-foreground">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark Completed
              </Button>
              <Button variant="outline" onClick={() => cloneCycle.mutate()} disabled={cloneCycle.isPending}>
                {cloneCycle.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Copy className="h-4 w-4 mr-1" />}
                Start New Cycle
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
