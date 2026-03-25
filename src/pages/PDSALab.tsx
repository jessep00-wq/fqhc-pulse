import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { mockPDSACycles, UDS_MEASURES, type PDSACycle, type PDSAStatus } from "@/data/mockData";
import { Plus, FileText, TrendingUp, Users } from "lucide-react";

const STATUS_COLUMNS: { key: PDSAStatus; label: string; color: string }[] = [
  { key: "plan", label: "Plan", color: "bg-primary/10 text-primary" },
  { key: "do", label: "Do", color: "bg-info/10 text-info" },
  { key: "study", label: "Study", color: "bg-warning/10 text-warning" },
  { key: "act", label: "Act", color: "bg-accent/10 text-accent" },
  { key: "completed", label: "Completed", color: "bg-success/10 text-success" },
];

function PDSACard({ cycle, onGenerateBinder }: { cycle: PDSACycle; onGenerateBinder: (c: PDSACycle) => void }) {
  return (
    <Card className="mb-3 cursor-default hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <h4 className="text-sm font-semibold leading-tight mb-2">{cycle.title}</h4>
        <Badge variant="outline" className="text-xs mb-2">{cycle.uds_measure.split(":")[0]}</Badge>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{cycle.root_cause}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {cycle.assigned_staff.length} roles
          </div>
          {cycle.improvement_pct && (
            <div className="flex items-center gap-1 text-xs text-success">
              <TrendingUp className="h-3 w-3" />
              +{cycle.improvement_pct}%
            </div>
          )}
        </div>
        {cycle.status === "completed" && (
          <Button size="sm" className="w-full mt-3 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => onGenerateBinder(cycle)}>
            <FileText className="h-3 w-3 mr-1" />
            Generate HRSA OSV Audit Binder
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function AuditBinderDialog({ cycle, open, onClose }: { cycle: PDSACycle | null; open: boolean; onClose: () => void }) {
  if (!cycle) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            HRSA OSV Audit Binder
          </DialogTitle>
          <DialogDescription>Compiled compliance report for federal audit readiness</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">1. PDSA Cycle Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Title:</span> {cycle.title}</div>
              <div><span className="text-muted-foreground">UDS Measure:</span> {cycle.uds_measure}</div>
              <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline" className="text-success">Completed</Badge></div>
              <div><span className="text-muted-foreground">Started:</span> {cycle.created_at}</div>
            </div>
          </section>
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">2. Root Cause Analysis</h3>
            <p className="text-sm text-muted-foreground">{cycle.root_cause}</p>
          </section>
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">3. Target Goal & Outcome</h3>
            <p className="text-sm">{cycle.target_goal}</p>
            {cycle.improvement_pct && (
              <div className="flex items-center gap-2 text-sm text-success font-medium">
                <TrendingUp className="h-4 w-4" />
                Achieved {cycle.improvement_pct}% improvement
              </div>
            )}
          </section>
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">4. Staff Accountability Log</h3>
            <div className="space-y-1">
              {cycle.assigned_staff.map((role) => (
                <div key={role} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <span>{role}</span>
                  <Badge className="bg-success/10 text-success text-xs">Acknowledged</Badge>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">5. Clinical Workflow Impact</h3>
            <p className="text-sm text-muted-foreground">{cycle.clinical_workflow_impact}</p>
          </section>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <FileText className="h-4 w-4 mr-1" /> Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PDSALab() {
  const [cycles] = useState(mockPDSACycles);
  const [binderCycle, setBinderCycle] = useState<PDSACycle | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PDSA Lab & OSV Audit Binder</h1>
          <p className="text-muted-foreground">Track quality improvement cycles from plan to completion</p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New PDSA Cycle</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New PDSA Cycle</DialogTitle>
              <DialogDescription>Define a structured quality improvement plan</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="e.g., Improve Colorectal Cancer Screening Rate" />
              </div>
              <div className="space-y-2">
                <Label>Target UDS Measure</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select a measure" /></SelectTrigger>
                  <SelectContent>
                    {UDS_MEASURES.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Root Cause Analysis</Label>
                <Textarea placeholder="Describe the identified root cause..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Clinical Workflow Impact</Label>
                <Textarea placeholder="How will clinical workflows change?" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Target Goal</Label>
                <Input placeholder="e.g., Increase rate from 50% to 70%" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
              <Button onClick={() => setNewOpen(false)}>Create Cycle</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-5 gap-4 overflow-x-auto">
        {STATUS_COLUMNS.map((col) => {
          const colCycles = cycles.filter((c) => c.status === col.key);
          return (
            <div key={col.key} className="min-w-[220px]">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={col.color}>{col.label}</Badge>
                <span className="text-xs text-muted-foreground">{colCycles.length}</span>
              </div>
              <div className="space-y-0">
                {colCycles.map((cycle) => (
                  <PDSACard key={cycle.id} cycle={cycle} onGenerateBinder={setBinderCycle} />
                ))}
                {colCycles.length === 0 && (
                  <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    No cycles
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AuditBinderDialog cycle={binderCycle} open={!!binderCycle} onClose={() => setBinderCycle(null)} />
    </div>
  );
}
