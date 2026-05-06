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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UDS_MEASURES, type StaffRole } from "@/data/mockData";
import { PDSA_TEMPLATES, type PDSATemplate } from "@/data/pdsaTemplates";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";
import { Plus, FileText, TrendingUp, Sparkles, Loader2, ArrowLeft, ArrowRight, CheckCircle, Lightbulb, BookOpen, Download, FlaskConical } from "lucide-react";
import { useTierLimits } from "@/hooks/useTierLimits";
import { UpgradePrompt, UpgradeBanner } from "@/components/UpgradePrompt";
import { EmptyState } from "@/components/EmptyState";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PDSADetailDialog from "@/components/PDSADetailDialog";
import EvidencePacketDialog from "@/components/EvidencePacketDialog";

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
  aim_statement?: string | null;
  prediction?: string | null;
  measurement_plan?: string | null;
  test_description?: string | null;
  analysis_summary?: string | null;
  decision?: string | null;
  template_id?: string | null;
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

const STAFF_ROLES: StaffRole[] = ["Front Desk", "MA/RN", "Provider", "Care Coordinator", "QI Manager"];

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

interface DBTask {
  id: string;
  pdsa_cycle_id: string | null;
  status: string;
  acknowledged?: boolean;
}

function PDSACard({ cycle, tasks, onGenerateBinder, onClick, borderColor }: { cycle: DBCycle; tasks: DBTask[]; onGenerateBinder: (c: DBCycle) => void; onClick: () => void; borderColor: string }) {
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
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{cycle.aim_statement || cycle.root_cause}</p>
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

function AuditBinderDialog({ cycle, open, onClose, isFreeTier = true }: { cycle: DBCycle | null; open: boolean; onClose: () => void; isFreeTier?: boolean }) {
  const { organization } = useOrg();
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = useCallback(async () => {
    if (!printRef.current || !cycle) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const pdf = new jsPDF("p", "in", "letter");
      const pdfWidth = 8.5;
      const pdfHeight = 11;
      const margin = 0.5;
      const imgWidth = pdfWidth - margin * 2;
      const pageContentHeight = pdfHeight - margin * 2;
      const scale = imgWidth / canvas.width;
      const pageHeightInPx = pageContentHeight / scale;

      let yOffset = 0;
      let pageIndex = 0;

      while (yOffset < canvas.height) {
        if (pageIndex > 0) pdf.addPage("letter", "p");
        const sliceHeight = Math.min(pageHeightInPx, canvas.height - yOffset);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        }
        const pageImg = pageCanvas.toDataURL("image/png");
        const drawHeight = sliceHeight * scale;
        pdf.addImage(pageImg, "PNG", margin, margin, imgWidth, drawHeight, undefined, "FAST");
        
        // Add watermark for free tier
        if (isFreeTier) {
          pdf.setFontSize(50);
          pdf.setTextColor(200, 200, 200);
          pdf.saveGraphicsState();
          const centerX = pdfWidth / 2;
          const centerY = pdfHeight / 2;
          pdf.text("SAMPLE — UPGRADE TO REMOVE", centerX, centerY, {
            align: "center",
            angle: 45,
          });
          pdf.restoreGraphicsState();
          pdf.setTextColor(0, 0, 0);
        }
        
        yOffset += sliceHeight;
        pageIndex++;
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
          {cycle.aim_statement && (
            <section className="rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold text-sm">2. Aim Statement</h3>
              <p className="text-sm text-gray-600">{cycle.aim_statement}</p>
            </section>
          )}
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">{cycle.aim_statement ? "3" : "2"}. Root Cause Analysis</h3>
            <p className="text-sm text-gray-600">{cycle.root_cause}</p>
          </section>
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">{cycle.aim_statement ? "4" : "3"}. Target Goal & Outcome</h3>
            <p className="text-sm">{cycle.target_goal}</p>
            {cycle.improvement_pct && <p className="text-sm text-green-700 font-medium">✓ Achieved {cycle.improvement_pct}% improvement</p>}
          </section>
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">{cycle.aim_statement ? "5" : "4"}. Staff Accountability Log</h3>
            <div className="space-y-1">
              {staff.map((role) => (
                <div key={role} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <span>{role}</span><span className="text-xs text-green-700 font-medium">✓ Acknowledged</span>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm">{cycle.aim_statement ? "6" : "5"}. Clinical Workflow Impact</h3>
            <p className="text-sm text-gray-600">{cycle.clinical_workflow_impact}</p>
          </section>
          {cycle.decision && (
            <section className="rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold text-sm">7. Decision</h3>
              <p className="text-sm text-gray-600 font-medium">{cycle.decision}</p>
            </section>
          )}
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

// ─── Coaching tip component ────────────────────────────────────────────
function CoachingTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
      <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

// ─── Step indicator ────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i < current ? "w-6 bg-primary" : i === current ? "w-6 bg-primary/50" : "w-2 bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Guided PDSA Creation Wizard ───────────────────────────────────────
const WIZARD_STEPS = ["template", "aim", "prediction", "measurement", "test", "review"] as const;
type WizardStep = typeof WIZARD_STEPS[number];

interface WizardData {
  template: PDSATemplate | null;
  title: string;
  aim: string;
  prediction: string;
  measurementPlan: string;
  udsMeasure: string;
  testDescription: string;
  assignedStaff: StaffRole[];
  rootCause: string;
  targetGoal: string;
  clinicalWorkflowImpact: string;
}

const emptyWizard: WizardData = {
  template: null,
  title: "",
  aim: "",
  prediction: "",
  measurementPlan: "",
  udsMeasure: "",
  testDescription: "",
  assignedStaff: ["QI Manager"],
  rootCause: "",
  targetGoal: "",
  clinicalWorkflowImpact: "",
};

function CreatePDSAWizard({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: WizardData) => void;
}) {
  const [step, setStep] = useState<WizardStep>("template");
  const [data, setData] = useState<WizardData>({ ...emptyWizard });

  const stepIndex = WIZARD_STEPS.indexOf(step);

  const applyTemplate = (t: PDSATemplate) => {
    setData({
      template: t,
      title: t.title,
      aim: t.aim,
      prediction: t.prediction,
      measurementPlan: t.measurementPlan,
      udsMeasure: t.udsMeasure,
      testDescription: t.testDescription,
      assignedStaff: t.assignedStaff,
      rootCause: t.rootCause,
      targetGoal: t.targetGoal,
      clinicalWorkflowImpact: t.clinicalWorkflowImpact,
    });
    setStep("aim");
  };

  const startBlank = () => {
    setData({ ...emptyWizard });
    setStep("aim");
  };

  const next = () => {
    const idx = WIZARD_STEPS.indexOf(step);
    if (idx < WIZARD_STEPS.length - 1) setStep(WIZARD_STEPS[idx + 1]);
  };

  const prev = () => {
    const idx = WIZARD_STEPS.indexOf(step);
    if (idx > 0) setStep(WIZARD_STEPS[idx - 1]);
  };

  const handleCreate = () => {
    if (!data.title.trim()) { toast.error("Title is required"); return; }
    onCreate(data);
    setStep("template");
    setData({ ...emptyWizard });
    onClose();
  };

  const reset = () => {
    setStep("template");
    setData({ ...emptyWizard });
  };

  const canProceed = () => {
    switch (step) {
      case "aim": return data.title.trim().length > 0 && data.aim.trim().length > 0;
      case "prediction": return data.prediction.trim().length > 0;
      case "measurement": return data.udsMeasure.length > 0;
      case "test": return data.testDescription.trim().length > 0;
      default: return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {step === "template" ? "Start a PDSA Cycle" : "Guided PDSA Setup"}
          </DialogTitle>
          {step !== "template" && (
            <div className="pt-2">
              <StepIndicator current={stepIndex - 1} total={WIZARD_STEPS.length - 1} />
            </div>
          )}
        </DialogHeader>

        {/* Step: Choose Template */}
        {step === "template" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose a common QI use case to get started with pre-filled guidance, or start from scratch.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {PDSA_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  className="rounded-lg border border-border p-3 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors space-y-1"
                  onClick={() => applyTemplate(t)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{t.icon}</span>
                    <span className="text-sm font-medium">{t.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                </button>
              ))}
            </div>
            <button
              className="w-full rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
              onClick={startBlank}
            >
              Start from scratch
            </button>
          </div>
        )}

        {/* Step: Aim */}
        {step === "aim" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">What are we trying to accomplish?</Label>
              <CoachingTip>
                Keep your aim specific, measurable, and time-bound. Example: "Increase A1C screening rate from 52% to 65% by March."
              </CoachingTip>
            </div>
            <div className="space-y-2">
              <Label>Cycle Title</Label>
              <Input
                placeholder="e.g., Improve Depression Screening Rate"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Aim Statement</Label>
              <Textarea
                placeholder="What specific improvement are you aiming for? Include the population, measure, and timeframe."
                rows={4}
                value={data.aim}
                onChange={(e) => setData({ ...data, aim: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step: Prediction */}
        {step === "prediction" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">What do you think will happen?</Label>
              <CoachingTip>
                State what you expect to see if the change works. This isn't a commitment — it's a hypothesis. Predictions help you learn regardless of the outcome.
              </CoachingTip>
            </div>
            <div className="space-y-2">
              <Label>Prediction</Label>
              <Textarea
                placeholder="We predict that by doing [intervention], we will see [expected result] because [rationale]..."
                rows={4}
                value={data.prediction}
                onChange={(e) => setData({ ...data, prediction: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Root Cause (what's driving the gap?)</Label>
              <Textarea
                placeholder="Why does this problem exist? What's the underlying cause?"
                rows={3}
                value={data.rootCause}
                onChange={(e) => setData({ ...data, rootCause: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step: Measurement Plan */}
        {step === "measurement" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">How will you know a change is an improvement?</Label>
              <CoachingTip>
                Define what data you'll collect and how often. Link to a UDS measure if applicable — the run chart will be generated automatically.
              </CoachingTip>
            </div>
            <div className="space-y-2">
              <Label>UDS Measure</Label>
              <Select value={data.udsMeasure} onValueChange={(v) => setData({ ...data, udsMeasure: v })}>
                <SelectTrigger><SelectValue placeholder="Select a measure" /></SelectTrigger>
                <SelectContent>{UDS_MEASURES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Measurement Plan</Label>
              <Textarea
                placeholder="What data will you collect? How often? From where?"
                rows={3}
                value={data.measurementPlan}
                onChange={(e) => setData({ ...data, measurementPlan: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Goal</Label>
              <Input
                placeholder="e.g., Increase rate from 50% to 70%"
                value={data.targetGoal}
                onChange={(e) => setData({ ...data, targetGoal: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step: Test Plan */}
        {step === "test" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Describe your test — start small</Label>
              <CoachingTip>
                Test on a small scale first: one provider, one clinic day, or a handful of patients. You can always expand what works.
              </CoachingTip>
            </div>
            <div className="space-y-2">
              <Label>Test Description</Label>
              <Textarea
                placeholder="Who is involved? What will they do differently? For how long? With how many patients?"
                rows={4}
                value={data.testDescription}
                onChange={(e) => setData({ ...data, testDescription: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Clinical Workflow Impact</Label>
              <Textarea
                placeholder="How will clinical workflows change during this test?"
                rows={2}
                value={data.clinicalWorkflowImpact}
                onChange={(e) => setData({ ...data, clinicalWorkflowImpact: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned Staff</Label>
              <div className="flex flex-wrap gap-2">
                {STAFF_ROLES.map((role) => {
                  const selected = data.assignedStaff.includes(role);
                  return (
                    <Badge
                      key={role}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setData({
                          ...data,
                          assignedStaff: selected
                            ? data.assignedStaff.filter((r) => r !== role)
                            : [...data.assignedStaff, role],
                        });
                      }}
                    >
                      {role}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Review your PDSA cycle before creating it.</p>
            <div className="rounded-lg border p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Title</p>
                <p className="text-sm font-medium">{data.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Aim</p>
                <p className="text-sm">{data.aim}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prediction</p>
                <p className="text-sm">{data.prediction}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">UDS Measure</p>
                <p className="text-sm">{data.udsMeasure || "None selected"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Measurement Plan</p>
                <p className="text-sm">{data.measurementPlan || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Test</p>
                <p className="text-sm">{data.testDescription}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Staff</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.assignedStaff.map((r) => <Badge key={r} variant="outline" className="text-xs">{r}</Badge>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step !== "template" && (
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button variant="ghost" size="sm" onClick={prev}>
              <ArrowLeft className="h-4 w-4 mr-1" />Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
              {step === "review" ? (
                <Button onClick={handleCreate}>
                  <CheckCircle className="h-4 w-4 mr-1" />Create Cycle
                </Button>
              ) : (
                <Button onClick={next} disabled={!canProceed()}>
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
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
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const { canCreateCycle, cyclesRemaining, isFreeTier } = useTierLimits();

  const handleNewCycle = () => {
    if (!canCreateCycle) {
      setUpgradeOpen(true);
      return;
    }
    setNewOpen(true);
  };

  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ["pdsa_cycles", organization.id],
    queryFn: async () => {
      const { data } = await supabase.from("pdsa_cycles").select("*").eq("organization_id", organization.id).order("created_at");
      return (data || []) as DBCycle[];
    },
    enabled: !!organization.id,
  });

  const { data: tasks = [] } = useQuery<DBTask[]>({
    queryKey: ["tasks", organization.id],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("*").eq("organization_id", organization.id);
      return (data || []) as DBTask[];
    },
    enabled: !!organization.id,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, title }: { id: string; status: string; title?: string }) => {
      const { error } = await supabase.from("pdsa_cycles").update({ status }).eq("id", id);
      if (error) throw error;
      return { status, title };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["pdsa_cycles"] });
      queryClient.invalidateQueries({ queryKey: ["activity_log"] });
      if (result.title) {
        const phase = result.status.charAt(0).toUpperCase() + result.status.slice(1);
        logActivity(organization.id, `PDSA cycle "${result.title}" moved to ${phase}`, result.status === "completed" ? "success" : "info");
      }
    },
  });

  const createCycle = useMutation({
    mutationFn: async (wizardData: WizardData) => {
      const { error } = await supabase.from("pdsa_cycles").insert({
        organization_id: organization.id,
        title: wizardData.title,
        status: "plan",
        uds_measure: wizardData.udsMeasure || null,
        root_cause: wizardData.rootCause || null,
        target_goal: wizardData.targetGoal || null,
        clinical_workflow_impact: wizardData.clinicalWorkflowImpact || null,
        assigned_staff: wizardData.assignedStaff,
        aim_statement: wizardData.aim || null,
        prediction: wizardData.prediction || null,
        measurement_plan: wizardData.measurementPlan || null,
        test_description: wizardData.testDescription || null,
        template_id: wizardData.template?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pdsa_cycles"] });
      queryClient.invalidateQueries({ queryKey: ["activity_log"] });
      logActivity(organization.id, `New PDSA cycle created: "${variables.title}"`, "success");
      toast.success("PDSA Cycle created!");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create cycle"),
  });

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const newStatus = destination.droppableId;
    const cycle = cycles.find((c) => c.id === draggableId);
    updateStatus.mutate({ id: draggableId, status: newStatus, title: cycle?.title });
    toast.info(`Moved to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PDSA Lab & Evidence Packet</h1>
          <p className="text-muted-foreground">Guided quality improvement cycles — walk into your next site visit ready</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEvidenceOpen(true)}>
            <Download className="h-4 w-4 mr-1" /> Evidence Packet
          </Button>
          <Button onClick={handleNewCycle}><Plus className="h-4 w-4 mr-1" /> New PDSA Cycle</Button>
        </div>
      </div>

      {isFreeTier && cyclesRemaining > 0 && cyclesRemaining <= 2 && (
        <UpgradeBanner message={`You have ${cyclesRemaining} free PDSA cycle${cyclesRemaining === 1 ? "" : "s"} remaining. Upgrade for unlimited cycles.`} />
      )}

      {cycles.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No PDSA cycles yet"
          description="Start your first quality improvement cycle using a guided template. Each cycle walks you through Aim → Prediction → Measurement → Test → Analysis → Decision."
          actionLabel="Create Your First PDSA Cycle"
          onAction={handleNewCycle}
        />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto">
          <div className="grid grid-cols-5 gap-4 pb-2" style={{ minWidth: "1100px" }}>
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
          </div>
        </DragDropContext>
      )}

      <CreatePDSAWizard open={newOpen} onClose={() => setNewOpen(false)} onCreate={(data) => createCycle.mutate(data)} />
      <AuditBinderDialog cycle={binderCycle} open={!!binderCycle} onClose={() => setBinderCycle(null)} isFreeTier={isFreeTier} />
      <PDSADetailDialog cycle={selectedCycle} open={!!selectedCycle} onClose={() => setSelectedCycle(null)} />
      <EvidencePacketDialog open={evidenceOpen} onClose={() => setEvidenceOpen(false)} />
      <UpgradePrompt
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        feature="Free Plan Limit Reached"
        description={`Your free plan includes up to 3 active PDSA cycles. Upgrade to Solo Clinic or higher for unlimited cycles, watermark-free exports, and more.`}
      />
    </div>
  );
}
