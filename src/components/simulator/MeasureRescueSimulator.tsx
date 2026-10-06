import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle, FileText, RotateCcw } from "lucide-react";

type Preset = {
  id: string;
  label: string;
  baseline: number;
  target: number;
  result: number;
  gap: string;
  intervention: string;
  owner: string;
  study: string;
  act: "Adopt" | "Adapt" | "Abandon";
  actNote: string;
};

const PRESETS: Preset[] = [
  {
    id: "CMS130",
    label: "Colorectal cancer screening (CMS130)",
    baseline: 41,
    target: 50,
    result: 46,
    gap: "Many eligible patients have no FIT kit ordered at their visit.",
    intervention: "Medical assistants pre-order FIT kits during huddle for eligible patients on the schedule.",
    owner: "MA Team Lead, Main Clinic",
    study: "FIT orders rose. Return rate stayed low, so the measure moved less than orders did.",
    act: "Adapt",
    actNote: "Keep pre-ordering. Add a 14-day reminder call for unreturned kits in the next cycle.",
  },
  {
    id: "CMS122",
    label: "Diabetes A1c poor control (CMS122)",
    baseline: 34,
    target: 28,
    result: 31,
    gap: "Patients with A1c over 9 are not scheduled for follow-up within 90 days.",
    intervention: "Care coordinator runs a weekly list of A1c over 9 and books a follow-up visit.",
    owner: "Care Coordinator",
    study: "Poor control dropped. Lower is better for this measure, so the change helped.",
    act: "Adopt",
    actNote: "Make the weekly list standard work and spread to the second site.",
  },
  {
    id: "CMS165",
    label: "Controlling high blood pressure (CMS165)",
    baseline: 58,
    target: 65,
    result: 63,
    gap: "Elevated first readings are not repeated before the patient leaves.",
    intervention: "Repeat blood pressure after 5 minutes when the first reading is 140/90 or higher.",
    owner: "Nursing Supervisor",
    study: "Repeat readings were taken in most cases and the rate rose toward target.",
    act: "Adopt",
    actNote: "Add the repeat reading to rooming standard work.",
  },
  {
    id: "CMS124",
    label: "Cervical cancer screening (CMS124)",
    baseline: 47,
    target: 55,
    result: 47,
    gap: "Outside screening results are not documented in a reportable field.",
    intervention: "Referral coordinator requests outside records and enters results in the structured field.",
    owner: "Referral Coordinator",
    study: "No change. Records requests went out, but few came back during the cycle.",
    act: "Abandon",
    actNote: "Stop this approach. Test a patient self-report form at check-in next.",
  },
  {
    id: "OTHER",
    label: "Other measure",
    baseline: 50,
    target: 60,
    result: 54,
    gap: "Describe the gap your team found in the report.",
    intervention: "Describe one small change your team will test.",
    owner: "Named staff owner",
    study: "Compare the 30-day value to the baseline and note what you learned.",
    act: "Adapt",
    actNote: "Record whether you adopt, adapt, or abandon the change, and why.",
  },
];

const STEPS = ["Pick a measure", "Baseline", "Intervention", "Owner", "30-day result", "Study", "Act", "Export preview"];

export function MeasureRescueSimulator() {
  const [step, setStep] = useState(0);
  const [preset, setPreset] = useState<Preset | null>(null);
  const p = preset;

  const reset = () => {
    setStep(0);
    setPreset(null);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-6">
        <p className="text-sm font-semibold text-foreground">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>
        <Badge variant="outline" className="text-xs">Illustrative example, not customer data</Badge>
      </div>

      <ol className="flex gap-1 px-4 pt-4 sm:px-6" aria-hidden>
        {STEPS.map((s, i) => (
          <li key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </ol>

      <div className="min-h-[260px] px-4 py-6 sm:px-6" aria-live="polite">
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-muted-foreground">Your report shows a measure off pace. Pick one to walk through.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PRESETS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setPreset(m);
                    setStep(1);
                  }}
                  className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-muted ${preset?.id === m.id ? "border-primary" : "border-border"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {p && step === 1 && (
          <Field title="Baseline" lead="Enter the monthly aggregate value from your report.">
            <Stat label="Baseline rate" value={`${p.baseline}%`} />
            <Stat label="Goal for this cycle" value={`${p.target}%`} />
            <p className="sm:col-span-2 text-sm text-muted-foreground">Gap found: {p.gap}</p>
          </Field>
        )}
        {p && step === 2 && (
          <Field title="Intervention" lead="Write down one small change to test.">
            <p className="sm:col-span-2 rounded-md bg-muted px-4 py-3 text-sm">{p.intervention}</p>
          </Field>
        )}
        {p && step === 3 && (
          <Field title="Owner" lead="Every change has a named owner and a due date.">
            <Stat label="Owner" value={p.owner} />
            <Stat label="Check-in" value="30 days" />
          </Field>
        )}
        {p && step === 4 && (
          <Field title="30-day result" lead="Enter the next monthly value.">
            <Stat label="Baseline" value={`${p.baseline}%`} />
            <Stat label="After 30 days" value={`${p.result}%`} />
          </Field>
        )}
        {p && step === 5 && (
          <Field title="Study" lead="Did the change move the measure? What did you learn?">
            <p className="sm:col-span-2 rounded-md bg-muted px-4 py-3 text-sm">{p.study}</p>
          </Field>
        )}
        {p && step === 6 && (
          <Field title="Act" lead="Record the decision.">
            <div className="sm:col-span-2 flex gap-2">
              {(["Adopt", "Adapt", "Abandon"] as const).map((a) => (
                <span
                  key={a}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium ${a === p.act ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
                >
                  {a}
                </span>
              ))}
            </div>
            <p className="sm:col-span-2 text-sm text-muted-foreground">{p.actNote}</p>
          </Field>
        )}
        {p && step === 7 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-semibold">
              <FileText className="h-5 w-5 text-primary" /> PDSA evidence record (preview)
            </div>
            <dl className="grid gap-x-6 gap-y-2 rounded-lg border border-border p-4 text-sm sm:grid-cols-2">
              <Row k="Measure" v={p.label} />
              <Row k="Baseline / Goal" v={`${p.baseline}% / ${p.target}%`} />
              <Row k="Change tested" v={p.intervention} />
              <Row k="Owner" v={p.owner} />
              <Row k="30-day value" v={`${p.result}%`} />
              <Row k="Decision" v={`${p.act}: ${p.actNote}`} />
            </dl>
            <p className="text-xs text-muted-foreground">
              In MeasureWise this record is saved with dates and history, ready for QI committee and board review.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 sm:px-6">
        <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button size="sm" onClick={() => setStep((s) => s + 1)} disabled={!p}>
            Next <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={reset}>
            <RotateCcw className="mr-1 h-4 w-4" /> Try another measure
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 font-semibold">
        <CheckCircle className="h-5 w-5 text-primary" /> {title}
      </div>
      <p className="text-muted-foreground">{lead}</p>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="text-foreground">{v}</dd>
    </div>
  );
}
