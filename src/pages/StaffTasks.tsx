import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { mockTasks, mockPDSACycles, type Task, type StaffRole, type TaskStatus } from "@/data/mockData";
import { CheckCircle2, Clock, AlertCircle, CircleDot } from "lucide-react";

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ElementType; className: string }> = {
  completed: { label: "Completed", icon: CheckCircle2, className: "text-success" },
  in_progress: { label: "In Progress", icon: Clock, className: "text-primary" },
  pending: { label: "Pending", icon: CircleDot, className: "text-muted-foreground" },
  overdue: { label: "Overdue", icon: AlertCircle, className: "text-destructive" },
};

const ROLES: StaffRole[] = ["Front Desk", "MA/RN", "Provider", "Care Coordinator", "QI Manager"];

function ComplianceRing({ pdsaId, pdsaTitle }: { pdsaId: string; pdsaTitle: string }) {
  const tasks = mockTasks.filter((t) => t.pdsa_id === pdsaId);
  const acked = tasks.filter((t) => t.acknowledged).length;
  const pct = tasks.length > 0 ? Math.round((acked / tasks.length) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate">{pdsaTitle}</span>
        <span className="text-xs text-muted-foreground">{acked}/{tasks.length} acknowledged</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}

export default function StaffTasks() {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = mockTasks.filter((t) => {
    if (roleFilter !== "all" && t.assigned_role !== roleFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const activePDSAs = mockPDSACycles.filter((c) => c.status !== "completed");

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
            {activePDSAs.map((pdsa) => (
              <ComplianceRing key={pdsa.id} pdsaId={pdsa.id} pdsaTitle={pdsa.title} />
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base">Task Board</CardTitle>
              <div className="flex gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
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
                {filtered.map((task) => {
                  const cfg = STATUS_CONFIG[task.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium text-sm">{task.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{task.pdsa_title}</TableCell>
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
