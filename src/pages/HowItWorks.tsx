import { Link } from "react-router-dom";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import {
  Target,
  FlaskConical,
  TrendingUp,
  FileCheck,
  ArrowRight,
  CheckCircle,
  BarChart3,
  Users,
  Clock,
} from "lucide-react";

const steps = [
  {
    icon: Target,
    number: "01",
    title: "Set up your UDS measures",
    description:
      "Select the clinical quality measures your FQHC is tracking. MeasureWise comes pre-loaded with the full UDS clinical measure set — cervical cancer screening (CMS124), diabetes HbA1c (CMS122), depression screening (CMS2), colorectal cancer screening (CMS130), and more.",
    details: [
      "20+ UDS measures pre-configured and ready to track",
      "Custom measures for local or grant-funded initiatives",
      "Baseline rates imported or entered manually — no EHR integration required",
    ],
  },
  {
    icon: FlaskConical,
    number: "02",
    title: "Build and run PDSA cycles",
    description:
      "Use guided templates or start from scratch. Every cycle walks your team through Aim → Prediction → Measurement Plan → Test → Analysis → Decision, with coaching prompts at each stage. Each cycle is explicitly linked to the UDS measure you're trying to move.",
    details: [
      "Pre-built templates for common FQHC improvement projects",
      "Structured fields prevent incomplete or vague documentation",
      "Task assignments with role-based routing to your team",
    ],
  },
  {
    icon: TrendingUp,
    number: "03",
    title: "Track measure impact in real time",
    description:
      "As you enter updated rates, MeasureWise generates SPC charts that distinguish real improvement from random variation. You'll know whether your PDSA intervention is working — statistically — before you report to HRSA.",
    details: [
      "SPC charts with auto-calculated control limits (UCL/LCL)",
      "Out-of-control signals highlighted for special cause variation",
      "Trend lines that show exactly when your intervention started working",
    ],
  },
  {
    icon: FileCheck,
    number: "04",
    title: "Generate audit-ready documentation",
    description:
      "One click produces a complete evidence packet — cycle logs, task evidence, baseline-to-result deltas, and next-cycle linkages. Whether it's an HRSA Operational Site Visit, NCQA PCMH submission, or board report, the documentation is already done.",
    details: [
      "HRSA audit binder formatted to Chapter 10 expectations",
      "NCQA Q-PASS evidence mapped to recognition standards",
      "Board-ready PDF export with UDS trends and staff accountability",
    ],
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to use MeasureWise for FQHC quality improvement",
  description:
    "A step-by-step guide to linking PDSA cycles to UDS measures and generating audit-ready documentation with MeasureWise.",
  step: steps.map((s, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: s.title,
    text: s.description,
  })),
};

export default function HowItWorks() {
  return (
    <PublicPageLayout backTo={{ label: "Back to home", href: "/" }}>
      <SEO
        title="How MeasureWise Works – PDSA to UDS Workflow for FQHCs"
        description="See how MeasureWise links PDSA cycles to UDS measures in four steps: set up measures, build cycles, track impact with SPC charts, and generate HRSA audit binders."
        canonical="https://measurewise.org/how-it-works"
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            From measure setup to audit-ready binder — in four steps
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            MeasureWise structures your entire quality improvement workflow so every PDSA cycle
            is linked to a UDS measure, tracked with SPC rigor, and documented for HRSA and NCQA
            reviewers automatically.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          {steps.map((step, i) => (
            <div key={step.number} className="grid md:grid-cols-[80px_1fr] gap-6">
              <div className="flex md:flex-col items-center md:items-start gap-3">
                <span className="text-4xl font-extrabold text-primary/20">{step.number}</span>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">{step.title}</h2>
                <p className="text-muted-foreground text-base leading-relaxed">{step.description}</p>
                <ul className="space-y-2">
                  {step.details.map((d) => (
                    <li key={d} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Summary stats */}
      <section className="py-16 px-6 bg-muted/30 border-y border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-3">
              <Clock className="h-6 w-6" />
            </div>
            <p className="text-2xl font-bold text-foreground">10 min</p>
            <p className="text-sm text-muted-foreground mt-1">To run your first PDSA cycle</p>
          </div>
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-3">
              <BarChart3 className="h-6 w-6" />
            </div>
            <p className="text-2xl font-bold text-foreground">20+</p>
            <p className="text-sm text-muted-foreground mt-1">UDS measures pre-configured</p>
          </div>
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-3">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-2xl font-bold text-foreground">$0</p>
            <p className="text-sm text-muted-foreground mt-1">To get started — free tier included</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-foreground">Ready to try it?</h2>
          <p className="text-muted-foreground text-lg">
            Sign up free, select your UDS measures, and run your first PDSA cycle in under
            10 minutes. No sales call, no credit card.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/auth?signup=true">
                Start 14-day free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <Link to="/pricing">See Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
