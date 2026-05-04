import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  DollarSign,
  Users,
  TrendingDown,
  ShieldCheck,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import qualityosLogo from "@/assets/qualityos_logo_v1.png";

const features = [
  {
    icon: DollarSign,
    title: "Community Health Budget Friendly",
    description:
      "Fraction of the cost of enterprise QI platforms. No multi-year contracts, no implementation consultants, no hidden fees.",
  },
  {
    icon: Users,
    title: "Staff Task Management",
    description:
      "Assign QI tasks to clinical and operational staff, track completion, and keep improvement cycles moving without endless email chains.",
  },
  {
    icon: TrendingDown,
    title: "Financial Impact Tracking",
    description:
      "Quantify how quality improvement drives revenue through HRSA Quality Award tiers, ACO shared savings, and grant compliance.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Without Complexity",
    description:
      "Built-in HRSA and PCMH alignment means your team stays compliant without needing a dedicated compliance officer or consultant.",
  },
];

const steps = [
  { step: "1", title: "Replace your spreadsheets", description: "Migrate from scattered Excel files to a unified QI platform in minutes." },
  { step: "2", title: "Assign and track tasks", description: "Give your team clear ownership of improvement activities with built-in task management." },
  { step: "3", title: "Monitor financial impact", description: "See how quality performance translates to revenue — Quality Award tiers, shared savings, and more." },
  { step: "4", title: "Report to leadership", description: "Generate board-ready reports and compliance binders without manual assembly." },
];

export default function PersonaCHCOpsManager() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={qualityosLogo} alt="QualityOS" className="h-9" />
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/auth">Sign In</Link></Button>
            <Button asChild><Link to="/auth?signup=true">Get Started Free</Link></Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-6">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
        </Link>
      </div>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 text-primary" />
            For CHC Operations Managers
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Enterprise QI capability,
            <br />
            <span className="text-primary">community health pricing</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your health center deserves real QI tools — not another spreadsheet workaround.
            QualityOS delivers the features enterprise vendors charge six figures for,
            at a price that fits your budget.
          </p>
          <Button size="lg" asChild className="text-base px-8">
            <Link to="/auth?signup=true">Start Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            More impact, less overhead
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

      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Stop overpaying for QI tools</h2>
          <p className="text-primary-foreground/80 text-lg">
            QualityOS is built for community health centers — not repurposed enterprise software with a healthcare label.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-primary-foreground/70">
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Free to start</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> No contracts</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Budget-friendly</span>
          </div>
          <Button size="lg" variant="secondary" asChild className="text-base px-8">
            <Link to="/auth?signup=true">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} QualityOS. All rights reserved.</p>
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
