import { Link } from "react-router-dom";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { SEO } from "@/components/SEO";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SampleExportButtons } from "@/components/SampleExportButtons";
import {
  ArrowRight,
  CheckCircle,
  Circle,
  FileCheck,
  FlaskConical,
  ListChecks,
  TrendingUp,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

/**
 * Public, read-only product tour. No auth, no database — everything on this
 * page is static fixture data so a first-time visitor can see a real PDSA
 * cycle before creating an account.
 */

const SPC_DATA = [
  { month: "Jan", value: 38, ucl: 49, lcl: 31, mean: 40 },
  { month: "Feb", value: 39, ucl: 49, lcl: 31, mean: 40 },
  { month: "Mar", value: 37, ucl: 49, lcl: 31, mean: 40 },
  { month: "Apr", value: 41, ucl: 49, lcl: 31, mean: 40 },
  { month: "May", value: 44, ucl: 49, lcl: 31, mean: 40 },
  { month: "Jun", value: 47, ucl: 49, lcl: 31, mean: 40 },
  { month: "Jul", value: 51, ucl: 49, lcl: 31, mean: 40 },
  { month: "Aug", value: 54, ucl: 49, lcl: 31, mean: 40 },
];

const STAGES = [
  {
    key: "aim",
    label: "Aim (Plan)",
    complete: true,
    fields: [
      {
        label: "Aim statement",
        value:
          "Increase colorectal cancer screening (CRC) among patients aged 45–75 from 38% to 50% by the end of Q3 at the Main Street site.",
      },
      {
        label: "UDS measure",
        value: "Colorectal Cancer Screening — baseline 38% (Jan), health center goal 50%",
      },
      {
        label: "Prediction",
        value:
          "Mailing FIT kits with a pre-call from the care team will convert 1 in 4 overdue patients within 60 days.",
      },
    ],
  },
  {
    key: "action",
    label: "Action (Do)",
    complete: true,
    fields: [
      {
        label: "What we tested",
        value:
          "Ran an overdue-patient list weekly, mailed 120 FIT kits per month with a reminder call at day 10 and a second call at day 21.",
      },
      {
        label: "Who did the work",
        value: "2 MAs on the outreach list, 1 RN care manager on abnormal-result follow-up.",
      },
      {
        label: "Tasks logged",
        value: "14 tasks — 12 complete, 2 open (result follow-up for August mailings).",
      },
    ],
  },
  {
    key: "results",
    label: "Results (Study)",
    complete: true,
    fields: [
      {
        label: "Measured result",
        value: "CRC screening rate moved 38% → 54% over 8 months (+16 points).",
      },
      {
        label: "SPC signal",
        value:
          "July and August sit above the upper control limit of 49% — this is special-cause variation, not month-to-month noise.",
      },
      {
        label: "What surprised us",
        value: "Kits mailed without the day-10 call returned at less than half the rate.",
      },
    ],
  },
  {
    key: "decision",
    label: "Decision (Act)",
    complete: false,
    fields: [
      {
        label: "Decision",
        value: "Adopt — spread the mail-plus-call workflow to the two satellite sites in Q4.",
      },
      {
        label: "Next cycle",
        value: "Draft: test a texted reminder in place of the day-21 call to cut MA phone time.",
      },
    ],
  },
];

const BINDER_CONTENTS = [
  "Cycle log with every edit and date stamped",
  "Aim, prediction, measurement plan, and decision in HRSA-recognizable order",
  "Task evidence — who did what, and when it closed",
  "Baseline-to-result delta with the SPC chart attached",
  "Next-cycle linkage showing the improvement work continued",
];

export default function PublicDemo() {
  return (
    <PublicPageLayout>
      <SEO
        title="See a real PDSA cycle — MeasureWise demo"
        description="A read-only tour of a real FQHC PDSA cycle: colorectal cancer screening from 38% to 54%, the SPC chart behind it, and the HRSA Audit Binder it produces. No signup required."
        canonical={`${BRAND.url}/demo`}
      />

      {/* Intro */}
      <section className="px-6 pt-16 pb-10">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <FlaskConical className="h-3.5 w-3.5" />
            Read-only demo · no signup
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            One real cycle, start to finish
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            This is example data from a colorectal cancer screening cycle — the same
            structure your team fills in. Look at the whole thing before you decide whether
            MeasureWise is worth 14 days of your attention.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <Button size="lg" asChild className="text-base px-8 w-full sm:w-auto">
              <Link to="/auth?signup=true">
                Start your 14-day free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8 w-full sm:w-auto">
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Cycle header + stages */}
      <section className="px-6 py-14 bg-muted/30 border-y border-border">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  PDSA Cycle · Colorectal Cancer Screening
                </p>
                <h2 className="text-2xl font-bold text-foreground">
                  FIT kit outreach with a day-10 reminder call
                </h2>
                <p className="text-sm text-muted-foreground">
                  Main Street site · Owner: QI Director · Started January 8
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  75% documented
                </span>
                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  Stage: Decision
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {STAGES.map((stage) => (
              <Card key={stage.key} className="border-border">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    {stage.complete ? (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <h3 className="font-semibold text-foreground">{stage.label}</h3>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {stage.complete ? "Documented" : "In progress"}
                    </span>
                  </div>
                  <dl className="space-y-3">
                    {stage.fields.map((f) => (
                      <div key={f.label}>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {f.label}
                        </dt>
                        <dd className="mt-1 text-sm leading-relaxed text-foreground">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SPC chart */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <TrendingUp className="h-4 w-4" />
              The chart behind the claim
            </div>
            <h2 className="text-3xl font-bold text-foreground leading-tight">
              Did the intervention work, or was it a good month?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              MeasureWise calculates the control limits from your own measure history. Two
              consecutive points above the upper control limit is a real shift — that is the
              sentence you can defend in front of a site-visit reviewer, and it is the one
              that goes in your board report.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Baseline 38% · current 54% · goal 50% (met in July)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                UCL 49% · mean 40% · LCL 31%, recalculated as data arrives
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-lg">
            <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
              Colorectal Cancer Screening — SPC Chart
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <RechartsLineChart data={SPC_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[25, 60]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: 12,
                  }}
                />
                <ReferenceLine y={49} stroke="hsl(0, 72%, 51%)" strokeDasharray="6 3" strokeOpacity={0.6} label={{ value: "UCL", position: "right", style: { fontSize: 10, fill: "hsl(0, 72%, 51%)" } }} />
                <ReferenceLine y={31} stroke="hsl(0, 72%, 51%)" strokeDasharray="6 3" strokeOpacity={0.6} label={{ value: "LCL", position: "right", style: { fontSize: 10, fill: "hsl(0, 72%, 51%)" } }} />
                <ReferenceLine y={40} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "Mean", position: "right", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Screening rate"
                  stroke="hsl(192, 70%, 35%)"
                  strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const out = payload.value > payload.ucl;
                    return (
                      <circle
                        key={`dot-${payload.month}`}
                        cx={cx}
                        cy={cy}
                        r={out ? 5 : 3.5}
                        fill={out ? "hsl(0, 72%, 51%)" : "hsl(192, 70%, 35%)"}
                        stroke={out ? "hsl(0, 72%, 51%)" : "hsl(192, 70%, 35%)"}
                        strokeWidth={out ? 2 : 0}
                      />
                    );
                  }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> Within limits
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-destructive" /> Signal — real shift
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Binder output */}
      <section className="px-6 py-16 bg-muted/30 border-y border-border">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <FileCheck className="h-4 w-4" />
              What the cycle turns into
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              The HRSA Audit Binder this cycle produces
            </h2>
            <p className="text-muted-foreground text-lg">
              Nothing above was re-typed to make this export. It is the same record, printed
              in the order a surveyor reads it.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {BINDER_CONTENTS.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                <ListChecks className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm leading-relaxed text-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <div className="text-center">
            <SampleExportButtons />
            <p className="mt-3 text-xs text-muted-foreground">
              Sample binder with example data. Your exports reflect your health center's real QI activity.
            </p>
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="text-3xl font-bold text-foreground">
            Your first cycle takes about 10 minutes
          </h2>
          <p className="text-muted-foreground text-lg">
            Pick a measure, start from a template, enter your baseline. The binder starts
            building from that moment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild className="text-base px-8 w-full sm:w-auto">
              <Link to="/auth?signup=true">
                Start your 14-day free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8 w-full sm:w-auto">
              <Link to="/contact">Talk to the founder</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            14 days free, no card to start. Add a card before day 14 to keep your workspace.
          </p>
        </div>
      </section>
    </PublicPageLayout>
  );
}
