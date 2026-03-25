import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { CheckCircle2, Clock, AlertCircle, CircleDot, Loader2 } from "lucide-react";

type TaskStatus = "pending" | "in_progress" | "completed" | "overdue";
type StaffRole = "Front Desk" | "MA/RN" | "Provider" | "Care Coordinator" | "QI Manager";

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ElementType; className: string }> = {
  completed: { label: "Completed", icon: CheckCircle2, className: "text-success" },
  in_progress: { label: "In Progress", icon: Clock, className: "text-primary" },
  pending: { label: "Pending", icon: CircleDot, className: "text-muted-foreground" },
  overdue: { label: "Overdue", icon: AlertCircle, className: "text-destructive" },
};

const ROLES: StaffRole[] = ["Front Desk", "MA/RN", "Provider", "Care Coordinator", "QI Manager"];

export default function StaffTasks() {
  const { organization } = useOrg();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", organization.id],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("*, pdsa_cycles(title)");
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff Accountability & Task Routing</h1>
        <p className="text-muted-foreground">Track task assignments and workflow acknowledgment compliance</p>
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
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((task: any) => {
                  const cfg = STATUS_CONFIG[task.status as TaskStatus] || STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  const pdsaTitle = task.pdsa_cycles?.title || "—";
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium text-sm">{task.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{pdsaTitle}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{task.assigned_role}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{task.due_date}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1.5 text-sm ${cfg.className}`}>
                          <StatusIcon className="h-4 w-4" />
                          {cfg.label}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No tasks match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
