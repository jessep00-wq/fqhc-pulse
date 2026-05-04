import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FlaskConical,
  BarChart3,
  LineChart,
  FileCheck,
  ArrowRight,
  Shield,
  ClipboardCheck,
  Users,
  DollarSign,
  CheckCircle,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import measurewiseLogo from "@/assets/measurewise-logo.png";
import dashboardPreview from "@/assets/dashboard-preview.jpg";

const complianceBadges = [
  { label: "HRSA Chapter 10 Aligned", icon: Shield },
  { label: "NCQA PCMH Q-PASS Ready", icon: ClipboardCheck },
  { label: "UDS-Friendly Reporting", icon: BarChart3 },
];

const features = [
  {
    icon: FileCheck,
    title: "One-Click HRSA / NCQA Evidence Packet",
    description:
      "Generate a print-ready audit binder for any date range: cycle log, task evidence, baseline-to-result deltas, lessons learned, and next-cycle linkages. Two weeks of prep, done in seconds.",
  },
  {
    icon: FlaskConical,
    title: "Guided PDSA Methodology",
    description:
      "Walk your team through Aim → Prediction → Measurement → Test → Analysis → Decision with coaching prompts and pre-built templates for common FQHC use cases.",
  },
  {
    icon: BarChart3,
    title: "UDS Clinical Measure Dashboards",
    description:
      "Track 20+ UDS measures with real-time trend analysis and SPC charts. Run charts are automatic — no chart-type decisions required.",
  },
  {
    icon: ClipboardCheck,
    title: "NCQA Q-PASS Evidence Collection",
    description:
      "Capture and organize the evidence NCQA requires for PCMH recognition, mapped directly to Q-PASS standards.",
  },
];

const personas = [
  {
    icon: LineChart,
    title: "QI Directors",
    description:
      "Track UDS measures, run PDSA cycles, and quantify your HRSA Quality Award tier impact — all in one view.",
    link: "/for/qi-directors",
  },
  {
    icon: ClipboardCheck,
    title: "PCMH Coordinators",
    description:
      "Organize Q-PASS evidence, manage documentation workflows, and stay audit-ready year-round.",
    link: "/for/pcmh-coordinators",
  },
  {
    icon: DollarSign,
    title: "CHC Operations Managers",
    description:
      "Replace expensive enterprise QI tools, manage staff tasks, and track financial impact on community health budgets.",
    link: "/for/operations-managers",
  },
];

const stats = [
  { value: "20+", label: "UDS Measures Tracked" },
  { value: "HRSA", label: "Chapter 10 Aligned" },
  { value: "PCMH", label: "Q-PASS Ready" },
  { value: "$0", label: "Enterprise Sales Calls" },
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={measurewiseLogo} alt="MeasureWise" className="h-12" />
          </div>
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/pricing">Pricing</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth?signup=true">Get Started Free</Link>
            </Button>
          </div>
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card px-6 py-4 space-y-2">
            <Button variant="ghost" asChild className="w-full justify-start">
              <Link to="/pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            </Button>
            <Button variant="ghost" asChild className="w-full justify-start">
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            </Button>
            <Button asChild className="w-full">
              <Link to="/auth?signup=true" onClick={() => setMobileMenuOpen(false)}>Get Started Free</Link>
            </Button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Compliance badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {complianceBadges.map((b) => (
              <div
                key={b.label}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground"
              >
                <b.icon className="h-4 w-4 text-primary" />
                {b.label}
              </div>
            ))}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            Walk into your next HRSA site visit with your PDSA binder already generated.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The only compliance-first PDSA tracker built specifically for FQHCs.
            One-click evidence packets, guided QI cycles, and UDS dashboards
            — at a price community health budgets can afford.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/auth?signup=true">
                Start Your Free PDSA Tracker <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Product Screenshot */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="rounded-xl border border-border shadow-2xl overflow-hidden">
            <img
              src={dashboardPreview}
              alt="MeasureWise dashboard showing PDSA cycles, UDS measure trends, and financial impact tracking"
              className="w-full"
              width={1280}
              height={720}
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/50 py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Founder Authority */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Why I Built <span className="text-primary">MeasureWise</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            I'm a BSN-trained clinical operations professional who has spent years inside FQHCs —
            surviving HRSA site visits, wrestling with UDS reporting deadlines, and watching
            quality teams drown in spreadsheets that were never designed for PDSA tracking.
            I built MeasureWise because the enterprise QI tools on the market are overpriced,
            overcomplicated, and built by people who have never had to defend a PDSA cycle
            in front of a site-visit reviewer. This is the tool I wish I had.
          </p>
          <p className="text-sm text-muted-foreground/70 italic">
            — The MeasureWise Team
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground">
              Compliance-first tools for community health QI
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              Every feature maps to the regulatory frameworks your health center lives by.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <Card
                key={f.title}
                className="border-border hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-6 flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Persona section */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground">
              Built for your role
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              Whether you lead QI, coordinate PCMH, or manage operations — MeasureWise speaks your language.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {personas.map((p) => (
              <Link key={p.title} to={p.link} className="group">
                <Card className="h-full border-border hover:border-primary/40 transition-colors group-hover:shadow-md">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <p.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-foreground text-lg">{p.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {p.description}
                    </p>
                    <span className="inline-flex items-center text-sm text-primary font-medium group-hover:underline">
                      Learn more <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">
            Start your free PDSA tracker today
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            No enterprise sales call. No six-month implementation. Just the QI tools
            your FQHC actually needs — at a price community health budgets can afford.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-primary-foreground/70">
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Free to start</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> HRSA-aligned</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Audit-ready</span>
          </div>
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="text-base px-8"
          >
            <Link to="/auth?signup=true">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} MeasureWise. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
