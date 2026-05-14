import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  LineChart,
  FlaskConical,
  BarChart3,
  Trophy,
  CheckCircle,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { PublicPageLayout } from "@/components/PublicPageLayout";

const features = [
  {
    icon: BarChart3,
    title: "UDS Measure Dashboards",
    description:
      "Monitor 20+ UDS clinical quality measures in real time. See exactly where your health center stands against HRSA benchmarks and peer percentiles.",
  },
  {
    icon: LineChart,
    title: "SPC Charts with Control Limits",
    description:
      "Automatically calculated center lines and ±3σ limits surface special cause variation before it impacts your UDS report.",
  },
  {
    icon: FlaskConical,
    title: "Structured PDSA Cycles",
    description:
      "Drag-and-drop Kanban boards for every improvement cycle. Assign teams, track root causes, and document each phase for HRSA OSV readiness.",
  },
  {
    icon: Trophy,
    title: "HRSA Quality Award Tier Tracking",
    description:
      "See how your measure performance maps to Bronze, Silver, and Gold Quality Award tiers — and the revenue impact of reaching the next level.",
  },
];

const steps = [
  { step: "1", title: "Upload your UDS data", description: "Import your current clinical quality measures or enter them manually." },
  { step: "2", title: "Identify improvement targets", description: "SPC charts and dashboards highlight measures with the greatest opportunity." },
  { step: "3", title: "Run PDSA cycles", description: "Plan interventions, assign staff, track results, and iterate — all documented." },
  { step: "4", title: "Export your audit binder", description: "Generate a compliance-ready PDF for HRSA OSV or board reporting in one click." },
];

export default function PersonaQIDirector() {
  return (
    <PublicPageLayout>
      <SEO
        title="MeasureWise for QI Directors — PDSA + UDS in one platform"
        description="Run PDSA cycles tied to UDS measures, prove impact on SPC charts, and export HRSA-ready binders. Built for FQHC Quality Directors."
        canonical="https://measurewise.org/for/qi-directors"
      />

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            <LineChart className="h-4 w-4 text-primary" />
            For QI Directors at FQHCs
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Your UDS measures, PDSA cycles,
            <br />
            <span className="text-primary">and Quality Award tracking — unified</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop juggling spreadsheets and siloed tools. MeasureWise gives you a single view of every
            clinical quality measure, every improvement cycle, and the financial impact of hitting
            your next HRSA Quality Award tier.
          </p>
          <Button size="lg" asChild className="text-base px-8">
            <Link to="/auth?signup=true">
              Start Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Built for the way you work
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

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">How it works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="text-center space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to elevate your QI program?</h2>
          <p className="text-primary-foreground/80 text-lg">
            Join QI Directors who use MeasureWise to move from reactive reporting to proactive improvement.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-primary-foreground/70">
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Free to start</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> UDS-aligned</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> OSV-ready</span>
          </div>
          <Button size="lg" variant="secondary" asChild className="text-base px-8">
            <Link to="/auth?signup=true">Start 14-day free trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} MeasureWise. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
