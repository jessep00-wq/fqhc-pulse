import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { CheckCircle2, Clock, AlertCircle, CircleDot, Loader2, Plus, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type TaskStatus = "pending" | "in_progress" | "completed" | "overdue";
type TaskPriority = "low" | "medium" | "high";
type StaffRole = "Front Desk" | "MA/RN" | "Provider" | "Care Coordinator" | "QI Manager";

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ElementType; badgeClass: string }> = {
  completed: { label: "Completed", icon: CheckCircle2, badgeClass: "bg-success/15 text-success border-success/30" },
  in_progress: { label: "In Progress", icon: Clock, badgeClass: "bg-primary/15 text-primary border-primary/30" },
  pending: { label: "Pending", icon: CircleDot, badgeClass: "bg-muted text-muted-foreground border-border" },
  overdue: { label: "Overdue", icon: AlertCircle, badgeClass: "bg-destructive/15 text-destructive border-destructive/30" },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; badgeClass: string }> = {
  high: { label: "High", badgeClass: "bg-destructive/15 text-destructive border-destructive/30" },
  medium: { label: "Medium", badgeClass: "bg-warning/15 text-warning border-warning/30" },
  low: { label: "Low", badgeClass: "bg-success/15 text-success border-success/30" },
};

const ROLES: StaffRole[] = ["Front Desk", "MA/RN", "Provider", "Care Coordinator", "QI Manager"];
const STATUSES: TaskStatus[] = ["pending", "in_progress", "completed", "overdue"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

function AddTaskDialog({ open, onClose, cycles }: { open: boolean; onClose: () => void; cycles: any[] }) {
  const { organization } = useOrg();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [dueDate, setDueDate] = useState<Date>();
  const [pdsaCycleId, setPdsaCycleId] = useState("");

  const createTask = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tasks").insert({
        organization_id: organization.id,
        title,
        assigned_role: role || null,
        priority,
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
        pdsa_cycle_id: pdsaCycleId || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created");
      resetAndClose();
    },
    onError: (err: any) => toast.error(err.message || "Failed to create task"),
  });

  const resetAndClose = () => {
    setTitle(""); setRole(""); setPriority("medium"); setDueDate(undefined); setPdsaCycleId("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>Create a task and assign it to a staff role</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Assigned Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Link to PDSA Cycle (optional)</Label>
            <Select value={pdsaCycleId} onValueChange={setPdsaCycleId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {cycles.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={() => createTask.mutate()} disabled={!title || createTask.isPending}>Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskDetailDialog({ task, open, onClose, cycles }: { task: any; open: boolean; onClose: () => void; cycles: any[] }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [title, setTitle] = useState(task?.title || "");
  const [role, setRole] = useState(task?.assigned_role || "");
  const [status, setStatus] = useState(task?.status || "pending");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [acknowledged, setAcknowledged] = useState(task?.acknowledged || false);
  const [dueDate, setDueDate] = useState<Date | undefined>(task?.due_date ? new Date(task.due_date) : undefined);

  const updateTask = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase.from("tasks").update(updates).eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update"),
  });

  const handleSave = () => {
    updateTask.mutate({
      title,
      assigned_role: role || null,
      status,
      priority,
      acknowledged,
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
    });
    onClose();
  };

  if (!task) return null;
  const pdsaTitle = task.pdsa_cycles?.title;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
          <DialogDescription>View and edit task information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Assigned Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="ack" checked={acknowledged} onCheckedChange={(v) => setAcknowledged(!!v)} />
            <Label htmlFor="ack" className="text-sm">Acknowledged</Label>
          </div>
          {pdsaTitle && (
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Linked PDSA Cycle</p>
              <Button variant="link" className="h-auto p-0 text-sm text-primary" onClick={() => { onClose(); navigate("/pdsa-lab"); }}>
                {pdsaTitle}
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateTask.isPending}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffTasks() {
  const { organization } = useOrg();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", organization.id],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("*, pdsa_cycles(title)").eq("organization_id", organization.id);
      return data || [];
    },
    enabled: !!organization.id,
  });

  const { data: cycles = [] } = useQuery({
    queryKey: ["pdsa_cycles_active", organization.id],
    queryFn: async () => {
      const { data } = await supabase.from("pdsa_cycles").select("id, title, status").neq("status", "completed");
      return data || [];
    },
    enabled: !!organization.id,
  });

  const filtered = tasks.filter((t: any) => {
    if (roleFilter !== "all" && t.assigned_role !== roleFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Accountability & Task Routing</h1>
          <p className="text-muted-foreground">Track task assignments and workflow acknowledgment compliance</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Task</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Compliance Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cycles.map((pdsa: any) => {
              const pdsaTasks = tasks.filter((t: any) => t.pdsa_cycle_id === pdsa.id);
              const acked = pdsaTasks.filter((t: any) => t.acknowledged).length;
              const pct = pdsaTasks.length > 0 ? Math.round((acked / pdsaTasks.length) * 100) : 0;
              return (
                <div key={pdsa.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{pdsa.title}</span>
                    <span className="text-xs text-muted-foreground">{acked}/{pdsaTasks.length} acknowledged</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base">Task Board</CardTitle>
              <div className="flex gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Filter by role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>PDSA Cycle</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((task: any) => {
                  const cfg = STATUS_CONFIG[task.status as TaskStatus] || STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  const pdsaTitle = task.pdsa_cycles?.title || "—";
                  const priCfg = PRIORITY_CONFIG[(task.priority as TaskPriority) || "medium"] || PRIORITY_CONFIG.medium;
                  return (
                    <TableRow key={task.id} className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => setSelectedTask(task)}>
                      <TableCell className="font-medium text-sm">{task.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{pdsaTitle}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{task.assigned_role}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={cn("text-xs", priCfg.badgeClass)}>{priCfg.label}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{task.due_date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs gap-1", cfg.badgeClass)}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No tasks match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AddTaskDialog open={addOpen} onClose={() => setAddOpen(false)} cycles={cycles} />
      {selectedTask && (
        <TaskDetailDialog task={selectedTask} open={!!selectedTask} onClose={() => setSelectedTask(null)} cycles={cycles} />
      )}
    </div>
  );
}
