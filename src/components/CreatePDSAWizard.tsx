import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UDS_MEASURES, type StaffRole } from "@/data/mockData";
import { PDSA_TEMPLATES, type PDSATemplate } from "@/data/pdsaTemplates";
import { ArrowLeft, ArrowRight, CheckCircle, Lightbulb, BookOpen } from "lucide-react";
import { toast } from "sonner";

const STAFF_ROLES: StaffRole[] = ["Front Desk", "MA/RN", "Provider", "Care Coordinator", "QI Manager"];

function CoachingTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
      <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

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

const WIZARD_STEPS = ["template", "aim", "prediction", "measurement", "test", "review"] as const;
type WizardStep = typeof WIZARD_STEPS[number];

export interface WizardData {
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

export function CreatePDSAWizard({ open, onClose, onCreate }: {
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
          <div className="flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="h-5 w-5 text-primary" />
            {step === "template" ? "Start a PDSA Cycle" : "Guided PDSA Setup"}
          </div>
          <DialogDescription className="sr-only">
            Create a new Plan-Do-Study-Act improvement cycle from a template or guided setup.
          </DialogDescription>
          {step !== "template" && (
            <div className="pt-2">
              <StepIndicator current={stepIndex - 1} total={WIZARD_STEPS.length - 1} />
            </div>
          )}
        </DialogHeader>

        {step === "template" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose a common QI use case to get started with pre-filled guidance, or start from scratch.
            </p>
            <Input
              placeholder="Search templates (e.g., referral, BP, no-show)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="max-h-[45vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                {filteredTemplates.map((t) => (
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
              {filteredTemplates.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No templates match "{query}".
                </p>
              )}
            </div>
            <button
              className="w-full rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
              onClick={startBlank}
            >
              Start from scratch
            </button>
          </div>
        )}


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
