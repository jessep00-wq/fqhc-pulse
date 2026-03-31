import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { mockPlaybooks, UDS_MEASURES, type StaffRole } from "@/data/mockData";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileText, TrendingUp, Users, Sparkles, BookOpen, Loader2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PDSADetailDialog from "@/components/PDSADetailDialog";

type PDSAStatus = "plan" | "do" | "study" | "act" | "completed";

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
}

const STATUS_COLUMNS: { key: PDSAStatus; label: string; color: string; borderColor: string }[] = [
  { key: "plan", label: "Plan", color: "bg-primary/10 text-primary", borderColor: "border-l-4 border-l-primary" },
  { key: "do", label: "Do", color: "bg-info/10 text-info", borderColor: "border-l-4 border-l-info" },
  { key: "study", label: "Study", color: "bg-warning/10 text-warning", borderColor: "border-l-4 border-l-warning" },
  { key: "act", label: "Act", color: "bg-accent/10 text-accent", borderColor: "border-l-4 border-l-accent" },
  { key: "completed", label: "Completed", color: "bg-success/10 text-success", borderColor: "border-l-4 border-l-success" },
];

const ROLE_INITIALS: Record<string, { initials: string; className: string }> = {
  "Front Desk": { initials: "FD", className: "bg-primary/20 text-primary" },
  "MA/RN": { initials: "MA", className: "bg-success/20 text-success" },
  "Provider": { initials: "PR", className: "bg-[hsl(var(--accent))]/20 text-accent" },
  "Care Coordinator": { initials: "CC", className: "bg-warning/20 text-warning" },
  "QI Manager": { initials: "QI", className: "bg-info/20 text-info" },
};

function AvatarGroup({ roles }: { roles: string[] }) {
  return (
    <div className="flex -space-x-2">
      {roles.slice(0, 4).map((role) => {
        const meta = ROLE_INITIALS[role] || { initials: "??", className: "bg-muted text-muted-foreground" };
        return (
          <Avatar key={role} className="h-6 w-6 border-2 border-card">
            <AvatarFallback className={`text-[10px] font-bold ${meta.className}`}>{meta.initials}</AvatarFallback>
          </Avatar>
        );
      })}
      {roles.length > 4 && (
        <Avatar className="h-6 w-6 border-2 border-card">
          <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">+{roles.length - 4}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function PDSACard({ cycle, tasks, onGenerateBinder, onClick, borderColor }: { cycle: DBCycle; tasks: any[]; onGenerateBinder: (c: DBCycle) => void; onClick: () => void; borderColor: string }) {
  const cycleTasks = tasks.filter((t) => t.pdsa_cycle_id === cycle.id);
  const completedTasks = cycleTasks.filter((t) => t.status === "completed").length;
  const totalTasks = cycleTasks.length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const staff = cycle.assigned_staff || [];

  return (
    <Card className={`mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${borderColor}`} onClick={onClick}>
      <CardContent className="p-4">
        <h4 className="text-sm font-semibold leading-tight mb-2">{cycle.title}</h4>
        <Badge variant="outline" className="text-xs mb-2">{cycle.uds_measure?.split(":")[0]}</Badge>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{cycle.root_cause}</p>
        <div className="flex items-center justify-between mb-2">
          <AvatarGroup roles={staff} />
          {cycle.improvement_pct && (
            <div className="flex items-center gap-1 text-xs text-success font-medium">
              <TrendingUp className="h-3 w-3" />+{cycle.improvement_pct}%
            </div>
          )}
        </div>
        {totalTasks > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Tasks</span><span>{completedTasks}/{totalTasks}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressPct < 30 ? "bg-destructive" : progressPct < 70 ? "bg-warning" : "bg-success"}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
        {cycle.status === "completed" && (
          <Button size="sm" className="w-full mt-3 bg-accent hover:bg-accent/90 text-accent-foreground whitespace-normal h-auto py-2" onClick={() => onGenerateBinder(cycle)}>
            <FileText className="h-3 w-3 mr-1 shrink-0" />Generate OSV Binder
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function AuditBinderDialog({ cycle, open, onClose }: { cycle: DBCycle | null; open: boolean; onClose: () => void }) {
  const { organization } = useOrg();
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = useCallback(async () => {
    if (!printRef.current || !cycle) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "in", "letter");
      const pdfWidth = 8.5;
      const pdfHeight = 11;
      const imgWidth = pdfWidth - 1;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;
      const pageContentHeight = pdfHeight - 1;
      pdf.addImage(imgData, "PNG", 0.5, 0.5, imgWidth, imgHeight, undefined, "FAST", 0);
      if (imgHeight > pageContentHeight) {
        const scale = pageContentHeight / imgHeight;
        pdf.deletePage(1);
        pdf.addPage("letter", "p");
        pdf.addImage(imgData, "PNG", 0.5, 0.5, imgWidth * scale + (imgWidth * (1 - scale)) / 2, pageContentHeight, undefined, "FAST", 0);
      }
      pdf.save(`HRSA_OSV_Audit_Binder_${cycle.id.slice(0, 8)}.pdf`);
      toast.success("PDF exported successfully");
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  }, [cycle]);

  if (!cycle) return null;
  const staff = cycle.assigned_staff || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-accent" />HRSA OSV Audit Binder</DialogTitle>
          <DialogDescription>Compiled compliance report for federal audit readiness</DialogDescription>
        </DialogHeader>
        <div ref={printRef} className="space-y-6 bg-white text-black p-4">
          <div className="text-center border-b pb-4">
            <h2 className="text-lg font-bold">{organization.name}</h2>
            <p className="text-xs text-gray-500">NPI: {organization.npi} | HRSA OSV Audit Binder</p>
            <p className="text-xs text-gray-500">Generated: {new Date().toLocaleDateString()}</p>
          </div>
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">1. PDSA Cycle Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Title:</span> {cycle.title}</div>
              <div><span className="text-gray-500">UDS Measure:</span> {cycle.uds_measure}</div>
              <div><span className="text-gray-500">Status:</span> Completed</div>
              <div><span className="text-gray-500">Started:</span> {new Date(cycle.created_at).toLocaleDateString()}</div>
            </div>
          </section>
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">2. Root Cause Analysis</h3>
            <p className="text-sm text-gray-600">{cycle.root_cause}</p>
          </section>
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">3. Target Goal & Outcome</h3>
            <p className="text-sm">{cycle.target_goal}</p>
            {cycle.improvement_pct && <p className="text-sm text-green-700 font-medium">✓ Achieved {cycle.improvement_pct}% improvement</p>}
          </section>
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">4. Staff Accountability Log</h3>
            <div className="space-y-1">
              {staff.map((role) => (
                <div key={role} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <span>{role}</span><span className="text-xs text-green-700 font-medium">✓ Acknowledged</span>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">5. Clinical Workflow Impact</h3>
            <p className="text-sm text-gray-600">{cycle.clinical_workflow_impact}</p>
          </section>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleExportPDF} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
            {exporting ? "Exporting..." : "Export PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreatePDSADialog({ open, onClose, onCreate }: {
  open: boolean; onClose: () => void; onCreate: (data: any) => void;
}) {
  const [title, setTitle] = useState("");
  const [measure, setMeasure] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [workflowImpact, setWorkflowImpact] = useState("");
  const [targetGoal, setTargetGoal] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [matchedPlaybook, setMatchedPlaybook] = useState<typeof mockPlaybooks[0] | null>(null);

  const handleMeasureChange = (val: string) => {
    setMeasure(val);
    const measureId = val.split(":")[0].trim();
    const pb = mockPlaybooks.find((p) => p.measure_id === measureId);
    setMatchedPlaybook(pb || null);
  };

  const applyPlaybook = () => {
    if (!matchedPlaybook) return;
    const t = matchedPlaybook.pdsa_template;
    setTitle(t.title);
    setRootCause(t.root_cause);
    setWorkflowImpact(t.clinical_workflow_impact);
    setTargetGoal(t.target_goal);
    toast.success("Playbook template applied!");
  };

  const handleAIAssist = async () => {
    if (!measure) { toast.error("Select a UDS measure first"); return; }
    setAiLoading(true);
    setAiResult("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-root-cause", {
        body: { uds_measure: measure, context: title || undefined },
      });
      if (error) throw error;
      setAiResult(data.analysis || "No analysis returned.");
      setAiOpen(true);
    } catch (err: any) {
      console.error("AI assist error:", err);
      toast.error(err?.message || "Failed to get AI analysis");
    } finally {
      setAiLoading(false);
    }
  };

  const useAIResult = () => {
    setRootCause(aiResult);
    setAiOpen(false);
    toast.success("AI analysis applied to Root Cause field");
  };

  const handleCreate = () => {
    if (!title || !measure) { toast.error("Title and UDS Measure are required"); return; }
    onCreate({
      title,
      status: "plan",
      uds_measure: measure,
      root_cause: rootCause,
      target_goal: targetGoal,
      clinical_workflow_impact: workflowImpact,
      assigned_staff: matchedPlaybook?.pdsa_template.assigned_staff || ["QI Manager"],
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle(""); setMeasure(""); setRootCause(""); setWorkflowImpact(""); setTargetGoal("");
    setAiOpen(false); setAiResult(""); setMatchedPlaybook(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New PDSA Cycle</DialogTitle>
          <DialogDescription>Define a structured quality improvement plan</DialogDescription>
        </DialogHeader>
        {matchedPlaybook && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <BookOpen className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Playbook template available</p>
              <p className="text-xs text-muted-foreground truncate">{matchedPlaybook.title}</p>
            </div>
            <Button size="sm" variant="outline" onClick={applyPlaybook}>Apply Template</Button>
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="e.g., Improve Colorectal Cancer Screening Rate" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Target UDS Measure</Label>
            <Select value={measure} onValueChange={handleMeasureChange}>
              <SelectTrigger><SelectValue placeholder="Select a measure" /></SelectTrigger>
              <SelectContent>{UDS_MEASURES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Root Cause Analysis</Label>
              <Button type="button" size="sm" variant="ghost" className="text-xs gap-1 text-primary h-7" onClick={handleAIAssist} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}Help me analyze
              </Button>
            </div>
            <Textarea placeholder="Describe the identified root cause..." rows={3} value={rootCause} onChange={(e) => setRootCause(e.target.value)} />
            <Collapsible open={aiOpen} onOpenChange={setAiOpen}>
              <CollapsibleContent>
                <div className="rounded-lg border bg-muted/50 p-3 space-y-3 mt-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-primary"><Sparkles className="h-3 w-3" />AI Root Cause Analysis</div>
                  <div className="text-xs text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">{aiResult || "Generating analysis..."}</div>
                  <Button size="sm" variant="outline" className="text-xs" onClick={useAIResult} disabled={!aiResult}>Use this analysis</Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <div className="space-y-2">
            <Label>Clinical Workflow Impact</Label>
            <Textarea placeholder="How will clinical workflows change?" rows={2} value={workflowImpact} onChange={(e) => setWorkflowImpact(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Target Goal</Label>
            <Input placeholder="e.g., Increase rate from 50% to 70%" value={targetGoal} onChange={(e) => setTargetGoal(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onClose(); }}>Cancel</Button>
          <Button onClick={handleCreate}>Create Cycle</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PDSALab() {
  const { organization } = useOrg();
  const queryClient = useQueryClient();
  const [binderCycle, setBinderCycle] = useState<DBCycle | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<DBCycle | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ["pdsa_cycles", organization.id],
    queryFn: async () => {
      const { data } = await supabase.from("pdsa_cycles").select("*").eq("organization_id", organization.id).order("created_at");
      return (data || []) as DBCycle[];
    },
    enabled: !!organization.id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", organization.id],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("*");
      return data || [];
    },
    enabled: !!organization.id,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("pdsa_cycles").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pdsa_cycles"] }),
  });

  const createCycle = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("pdsa_cycles").insert({
        ...data,
        organization_id: organization.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdsa_cycles"] });
      toast.success("PDSA Cycle created!");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create cycle"),
  });

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const newStatus = destination.droppableId;
    updateStatus.mutate({ id: draggableId, status: newStatus });
    toast.info(`Moved to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PDSA Lab & OSV Audit Binder</h1>
          <p className="text-muted-foreground">Track quality improvement cycles from plan to completion</p>
        </div>
        <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4 mr-1" /> New PDSA Cycle</Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-5 gap-4 overflow-x-auto">
          {STATUS_COLUMNS.map((col) => {
            const colCycles = cycles.filter((c) => c.status === col.key);
            return (
              <div key={col.key} className="min-w-[220px]">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={col.color}>{col.label}</Badge>
                  <span className="text-xs text-muted-foreground">{colCycles.length}</span>
                </div>
                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[120px] rounded-lg transition-colors ${snapshot.isDraggingOver ? "bg-primary/5 ring-2 ring-primary/20" : ""}`}
                    >
                      {colCycles.map((cycle, index) => (
                        <Draggable key={cycle.id} draggableId={cycle.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? "opacity-90 rotate-2" : ""}
                              onMouseDown={(e) => { dragStartPos.current = { x: e.clientX, y: e.clientY }; }}
                              onMouseUp={(e) => {
                                if (dragStartPos.current) {
                                  const dx = Math.abs(e.clientX - dragStartPos.current.x);
                                  const dy = Math.abs(e.clientY - dragStartPos.current.y);
                                  if (dx < 5 && dy < 5) setSelectedCycle(cycle);
                                }
                                dragStartPos.current = null;
                              }}
                            >
                              <PDSACard cycle={cycle} tasks={tasks} onGenerateBinder={setBinderCycle} onClick={() => {}} borderColor={col.borderColor} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {colCycles.length === 0 && !snapshot.isDraggingOver && (
                        <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">No cycles</div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <CreatePDSADialog open={newOpen} onClose={() => setNewOpen(false)} onCreate={(data) => createCycle.mutate(data)} />
      <AuditBinderDialog cycle={binderCycle} open={!!binderCycle} onClose={() => setBinderCycle(null)} />
      <PDSADetailDialog cycle={selectedCycle} open={!!selectedCycle} onClose={() => setSelectedCycle(null)} />
    </div>
  );
}
