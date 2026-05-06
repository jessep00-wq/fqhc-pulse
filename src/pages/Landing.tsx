import { Link } from "react-router-dom";
import ContactForm from "@/components/ContactForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
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
  Lock,
  Download,
  Eye,
  Zap,
  Table,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useState, useMemo } from "react";
import measurewiseLogo from "@/assets/measurewise-logo.png";
import dashboardPreview from "@/assets/dashboard-preview.jpg";
import founderPhoto from "@/assets/founder-jessica.png";
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
      "Generate a print-ready audit binder for healthcare compliance software needs: cycle log, task evidence, baseline-to-result deltas, and next-cycle linkages. Two weeks of prep, done in seconds.",
  },
  {
    icon: FlaskConical,
    title: "Guided PDSA Cycles in Healthcare",
    description:
      "Walk your team through Aim → Prediction → Measurement → Test → Analysis → Decision with coaching prompts and pre-built templates for FQHC quality improvement.",
  },
  {
    icon: BarChart3,
    title: "UDS Tracking for FQHCs",
    description:
      "Healthcare data analytics for 20+ UDS measures with real-time trend analysis and SPC charts. FQHC performance metrics and patient outcomes tracking — automated.",
  },
  {
    icon: ClipboardCheck,
    title: "NCQA Q-PASS Evidence Collection",
    description:
      "Clinical operations software that captures and organizes the evidence NCQA requires for PCMH recognition, mapped directly to Q-PASS standards.",
  },
];

const personas = [
  {
    icon: LineChart,
    title: "QI Directors",
    description:
      "Clinical quality management made simple — track UDS measures, run PDSA cycles, and quantify HRSA Quality Award impact with AI for clinical improvement.",
    link: "/for/qi-directors",
  },
  {
    icon: ClipboardCheck,
    title: "PCMH Coordinators",
    description:
      "Federally qualified health center solutions for Q-PASS evidence, documentation workflows, and year-round audit readiness.",
    link: "/for/pcmh-coordinators",
  },
  {
    icon: DollarSign,
    title: "CHC Operations Managers",
    description:
      "Replace expensive tools with clinical operations software that tracks value-based care reporting, staff tasks, and financial impact.",
    link: "/for/operations-managers",
  },
];

const stats = [
  { value: "20+", label: "UDS Measures Tracked" },
  { value: "HRSA", label: "Chapter 10 Aligned" },
  { value: "PCMH", label: "Q-PASS Ready" },
  { value: "$0", label: "Enterprise Sales Calls" },
];

const securityItems = [
  { icon: Lock, label: "256-bit AES encryption at rest" },
  { icon: Shield, label: "TLS 1.3 encryption in transit" },
  { icon: Shield, label: "Built on SOC 2 Type II certified infrastructure" },
  { icon: Lock, label: "HIPAA-ready architecture with BAA available" },
  { icon: Shield, label: "Role-based access controls (RBAC)" },
  { icon: Lock, label: "No PHI stored — only aggregate QI metrics" },
];

const comparisonRows = [
  { feature: "PDSA cycle management", measurewise: true, spreadsheet: "Manual", generic: "Partial" },
  { feature: "UDS measure tracking (20+)", measurewise: true, spreadsheet: "Manual", generic: false },
  { feature: "SPC charts with control limits", measurewise: true, spreadsheet: false, generic: "Add-on" },
  { feature: "HRSA audit binder export", measurewise: true, spreadsheet: false, generic: false },
  { feature: "NCQA Q-PASS evidence mapping", measurewise: true, spreadsheet: false, generic: false },
  { feature: "Built specifically for FQHCs", measurewise: true, spreadsheet: false, generic: false },
  { feature: "No per-seat licensing fees", measurewise: true, spreadsheet: true, generic: false },
  { feature: "Board-ready report export", measurewise: true, spreadsheet: "Manual", generic: "Add-on" },
];

// Static SPC demo data for the hero section
const spcDemoData = [
  { month: "Jul", value: 52, ucl: 68, lcl: 42, mean: 55 },
  { month: "Aug", value: 50, ucl: 68, lcl: 42, mean: 55 },
  { month: "Sep", value: 54, ucl: 68, lcl: 42, mean: 55 },
  { month: "Oct", value: 57, ucl: 68, lcl: 42, mean: 55 },
  { month: "Nov", value: 53, ucl: 68, lcl: 42, mean: 55 },
  { month: "Dec", value: 58, ucl: 68, lcl: 42, mean: 55 },
  { month: "Jan", value: 61, ucl: 68, lcl: 42, mean: 55 },
  { month: "Feb", value: 63, ucl: 68, lcl: 42, mean: 55 },
  { month: "Mar", value: 66, ucl: 68, lcl: 42, mean: 55 },
  { month: "Apr", value: 69, ucl: 68, lcl: 42, mean: 55 },
  { month: "May", value: 71, ucl: 68, lcl: 42, mean: 55 },
  { month: "Jun", value: 72, ucl: 68, lcl: 42, mean: 55 },
];

const faqItems = [
  {
    q: "What is MeasureWise?",
    a: "MeasureWise is a quality improvement platform built exclusively for Federally Qualified Health Centers (FQHCs). It connects PDSA cycles to UDS measures and HRSA funding outcomes — replacing spreadsheets with guided workflows, SPC charts, and one-click audit binders.",
  },
  {
    q: "Do I need to be an FQHC to use MeasureWise?",
    a: "MeasureWise is purpose-built for FQHCs and community health centers that report UDS data and undergo HRSA Operational Site Visits. If your organization runs PDSA cycles and tracks clinical quality measures, MeasureWise will work for you.",
  },
  {
    q: "What are SPC charts and why do I need them?",
    a: "Statistical Process Control (SPC) charts distinguish real improvement from random variation. Instead of guessing whether a screening rate increase is meaningful, SPC uses control limits to tell you statistically. HRSA reviewers increasingly expect this level of rigor.",
  },
  {
    q: "How is MeasureWise different from spreadsheets?",
    a: "Spreadsheets can track data but they can't guide a PDSA cycle, calculate SPC control limits, generate HRSA-ready audit binders, or link clinical improvements to financial outcomes. MeasureWise does all of this in one purpose-built tool.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. The free tier includes 3 active PDSA cycles, UDS dashboards, and guided methodology — no credit card required. Upgrade when you need unlimited cycles, SPC charts, and multi-site support.",
  },
  {
    q: "Does MeasureWise store PHI?",
    a: "No. MeasureWise stores only aggregate quality improvement metrics — screening rates, cycle documentation, and task status. No patient-level data enters the system.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MeasureWise",
  url: "https://measurewise.org",
  logo: "https://measurewise.org/measurewise-logo.png",
  description: "Quality improvement software built exclusively for Federally Qualified Health Centers.",
  sameAs: [],
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MeasureWise",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description: "The only quality improvement platform built exclusively for FQHCs. Link PDSA cycles to UDS measures and HRSA funding outcomes.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free tier available" },
};

function ComparisonCell({ value }: { value: boolean | string }) {
  if (value === true) return <CheckCircle className="h-5 w-5 text-primary mx-auto" />;
  if (value === false) return <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />;
  return <span className="text-sm text-muted-foreground">{value}</span>;
}

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="MeasureWise™ — Quality Improvement Software for FQHCs"
        description="The only QI platform built exclusively for Federally Qualified Health Centers. Link PDSA cycles to UDS measures and HRSA funding outcomes with SPC charts, audit binders, and staff task management."
        canonical="https://measurewise.org"
        jsonLd={orgJsonLd}
      />

      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={measurewiseLogo} alt="MeasureWise" className="h-12" />
          </div>
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/features/pdsa-cycle-manager">Features</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/blog">Blog</Link>
            </Button>
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
              <Link to="/features/pdsa-cycle-manager" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            </Button>
            <Button variant="ghost" asChild className="w-full justify-start">
              <Link to="/blog" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            </Button>
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

      {/* Differentiator Banner */}
      <div className="bg-primary/5 border-b border-primary/10">
        <div className="max-w-6xl mx-auto px-6 py-2.5 text-center">
          <p className="text-sm font-semibold text-primary tracking-wide">
            <Zap className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" />
            The only quality improvement platform built exclusively for FQHCs
          </p>
        </div>
      </div>

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
            Every PDSA cycle you run should move a UDS measure. Now you can prove it.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Link your quality improvement work to UDS scores and HRSA funding
            outcomes — with guided PDSA cycles, real-time measure tracking,
            and one-click audit binders. Built for FQHCs. No sales call required.
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
              loading="lazy"
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

      {/* SPC Chart Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <TrendingUp className="h-4 w-4" />
                Professional-Grade Analytics
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                SPC charts your FQHC actually needs — without the enterprise price tag
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Did your PDSA cycle actually improve that screening rate, or was it random variation?
                Statistical Process Control charts answer this with mathematical rigor — and MeasureWise
                generates them automatically from your UDS data.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">Auto-calculated UCL/LCL control limits using standard SPC formulas</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">Out-of-control signals highlighted — see special cause variation instantly</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">The evidence HRSA reviewers want to see during Operational Site Visits</span>
                </li>
              </ul>
              <Button asChild className="mt-2">
                <Link to="/features/spc-charts">
                  Learn more about SPC <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Cervical Cancer Screening (CMS124) — SPC Chart
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <RechartsLineChart data={spcDemoData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis domain={[35, 80]} className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", fontSize: 12 }} />
                  <ReferenceLine y={68} stroke="hsl(0, 72%, 51%)" strokeDasharray="6 3" strokeOpacity={0.6} label={{ value: "UCL", position: "right", style: { fontSize: 10, fill: "hsl(0, 72%, 51%)" } }} />
                  <ReferenceLine y={42} stroke="hsl(0, 72%, 51%)" strokeDasharray="6 3" strokeOpacity={0.6} label={{ value: "LCL", position: "right", style: { fontSize: 10, fill: "hsl(0, 72%, 51%)" } }} />
                  <ReferenceLine y={55} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "Mean", position: "right", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }} />
                  <Line type="monotone" dataKey="value" stroke="hsl(192, 70%, 35%)" strokeWidth={2.5} dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const outOfControl = payload.value > payload.ucl;
                    return (
                      <circle
                        key={`dot-${payload.month}`}
                        cx={cx}
                        cy={cy}
                        r={outOfControl ? 5 : 3.5}
                        fill={outOfControl ? "hsl(0, 72%, 51%)" : "hsl(192, 70%, 35%)"}
                        stroke={outOfControl ? "hsl(0, 72%, 51%)" : "hsl(192, 70%, 35%)"}
                        strokeWidth={outOfControl ? 2 : 0}
                      />
                    );
                  }} name="Screening Rate" />
                </RechartsLineChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Within limits
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-destructive" /> Out of control
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Export Preview */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-foreground">
              See what MeasureWise produces
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Download a sample HRSA audit binder — the same format your health center
              will generate in one click after completing a PDSA cycle.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <a href="/MeasureWise_Sample_Export.pdf" target="_blank" rel="noopener noreferrer">
                <Eye className="mr-2 h-4 w-4" /> Preview Sample Export (PDF)
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <a href="/MeasureWise_Sample_Export.docx" download>
                <Download className="mr-2 h-4 w-4" /> Download Sample Export (Word)
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This is a sample preview binder with example data. Your actual exports will reflect your health center's real QI activity.
          </p>
        </div>
      </section>

      {/* Founder Authority */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <img
              src={founderPhoto}
              alt="Jessica R. Smith, Founder of MeasureWise"
              className="h-36 w-36 md:h-44 md:w-44 rounded-full object-cover border-2 border-primary/20 shadow-lg"
              loading="lazy"
            />
          </div>
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
            — Jessica R. Smith, BSN · Founder, MeasureWise
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

      {/* Comparison Table */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Why FQHCs choose MeasureWise over spreadsheets
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              Side-by-side: purpose-built QI software vs. what you're probably using now.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left font-semibold p-4 text-foreground">Feature</th>
                    <th className="text-center font-semibold p-4 text-primary">MeasureWise</th>
                    <th className="text-center font-semibold p-4 text-muted-foreground">Spreadsheets</th>
                    <th className="text-center font-semibold p-4 text-muted-foreground">Generic QI Tools</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                      <td className="p-4 font-medium text-foreground">{row.feature}</td>
                      <td className="p-4 text-center"><ComparisonCell value={row.measurewise} /></td>
                      <td className="p-4 text-center"><ComparisonCell value={row.spreadsheet} /></td>
                      <td className="p-4 text-center"><ComparisonCell value={row.generic} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-20 px-6 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Your data security is non-negotiable
            </h2>
            <p className="text-muted-foreground mt-3 text-lg max-w-2xl mx-auto">
              MeasureWise is built on enterprise-grade infrastructure designed for healthcare organizations.
              We never store protected health information (PHI) — only aggregate quality improvement metrics.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {securityItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
              >
                <item.icon className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            Need a Business Associate Agreement (BAA)? <Link to="/auth?signup=true" className="text-primary hover:underline">Contact us</Link> after signing up and we'll have one ready within 48 hours.
          </p>
        </div>
      </section>

      {/* Persona section */}
      <section className="py-24 px-6">
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

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Frequently asked questions</h2>
            <p className="text-muted-foreground mt-3 text-lg">Common questions from FQHC quality teams.</p>
          </div>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={i} className="rounded-lg border border-border bg-card">
                <button
                  className="w-full flex items-center justify-between p-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-foreground text-sm">{item.q}</span>
                  <ArrowRight className={`h-4 w-4 text-muted-foreground shrink-0 ml-4 transition-transform ${openFaq === i ? "rotate-90" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* FAQ JSON-LD */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
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

      {/* Contact Form */}
      <section id="contact" className="py-20 px-6 bg-background">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              Questions? Let's Talk.
            </h2>
            <p className="text-muted-foreground">
              Whether you're exploring QI tools for the first time or switching from spreadsheets, we're here to help.
            </p>
          </div>
          <Card className="p-6">
            <ContactForm />
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src={measurewiseLogo} alt="MeasureWise" className="h-8" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Quality improvement software built for Federally Qualified Health Centers.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/features/pdsa-cycle-manager" className="hover:text-foreground transition-colors">PDSA Cycles</Link></li>
                <li><Link to="/features/uds-tracking" className="hover:text-foreground transition-colors">UDS Tracking</Link></li>
                <li><Link to="/features/hrsa-audit-binder" className="hover:text-foreground transition-colors">HRSA Audit Binder</Link></li>
                <li><Link to="/features/spc-charts" className="hover:text-foreground transition-colors">SPC Charts</Link></li>
                <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link to="/status" className="hover:text-foreground transition-colors">System Status</Link></li>
                <li><a href="#contact" className="hover:text-foreground transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} MeasureWise™. All rights reserved.</p>
            <p>Built on SOC 2 certified infrastructure · No PHI stored</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
