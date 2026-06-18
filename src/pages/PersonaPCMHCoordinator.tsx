import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  ClipboardCheck,
  FileCheck,
  FolderOpen,
  CalendarCheck,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { PublicPageLayout } from "@/components/PublicPageLayout";

const features = [
  {
    icon: ClipboardCheck,
    title: "Q-PASS Evidence Mapping",
    description:
      "Every PDSA cycle and quality activity maps directly to NCQA Q-PASS standards. Know exactly which evidence requirements you've satisfied.",
  },
  {
    icon: FolderOpen,
    title: "Organized Documentation Workflows",
    description:
      "Structured templates for capturing policies, procedures, and improvement activities that NCQA reviewers expect to see.",
  },
  {
    icon: FileCheck,
    title: "Audit-Ready Binder Export",
    description:
      "Generate comprehensive compliance binders for PCMH recertification with one click — no more scrambling before site visits.",
  },
  {
    icon: CalendarCheck,
    title: "Year-Round Readiness Tracking",
    description:
      "Dashboard views show your PCMH evidence status at a glance so you stay audit-ready 365 days a year, not just before recertification.",
  },
];

const steps = [
  { step: "1", title: "Map your Q-PASS requirements", description: "MeasureWise knows the NCQA standards — just confirm which apply to your clinic." },
  { step: "2", title: "Document as you go", description: "Capture evidence within your daily QI workflow instead of retroactive documentation." },
  { step: "3", title: "Track readiness status", description: "See which standards are covered, which need attention, and what's overdue." },
  { step: "4", title: "Export for recertification", description: "One-click audit binder with all evidence organized by NCQA standard." },
];

export default function PersonaPCMHCoordinator() {
  return (
    <PublicPageLayout>
      <SEO
        title="MeasureWise for PCMH Coordinators: Q-PASS Ready"
        description="Build NCQA PCMH evidence as you work. Map PDSA cycles to standards and export Q-PASS-ready packets in minutes."
        canonical="https://measurewise.org/for/pcmh-coordinators"
      />

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            For PCMH Coordinators
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Stay PCMH audit-ready
            <br />
            <span className="text-primary">every single day</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop scrambling before recertification. MeasureWise maps your QI activities directly to
            NCQA Q-PASS evidence requirements so you're always prepared.
          </p>
          <Button size="lg" asChild className="text-base px-8">
            <Link to="/auth?signup=true">Start Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Evidence collection, simplified
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-border">
                <CardContent className="p-6 flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{f.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">How it works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="text-center space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">{s.step}</div>
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </PublicPageLayout>
  );
}
