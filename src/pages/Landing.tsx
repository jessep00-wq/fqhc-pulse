import { Link } from "react-router-dom";
import ContactForm from "@/components/ContactForm";
import { SampleExportButtons } from "@/components/SampleExportButtons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { BRAND } from "@/lib/brand";
import jessicaPhoto from "@/assets/jessica-smith.jpg.asset.json";

import {
  FlaskConical,
  BarChart3,
  LineChart,
  FileCheck,
  ArrowRight,
  Shield,
  ClipboardCheck,
  DollarSign,
  CheckCircle,
  
  X,
  Lock,
  
  TrendingUp,
  Target,
  
} from "lucide-react";
import { useState } from "react";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { PlaybookLeadMagnetSection } from "@/components/lead-magnets/PlaybookLeadMagnetSection";
import { TrustStrip } from "@/components/landing/TrustStrip";
import dashboardPreview from "@/assets/dashboard-preview.jpg";
import dashboardPreviewWebp from "@/assets/dashboard-preview.webp";
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


/** Canonical trial terms — reuse verbatim everywhere trial terms appear. */
const TRIAL_TERMS =
  "14 days free, no card to start. Add a card before day 14 to keep your workspace.";

const features = [
  {
    icon: FileCheck,
    title: "One-Click HRSA Audit Binder",
    painPoint: "Tired of assembling audit evidence manually?",
    description:
      "Generate a print-ready HRSA Audit Binder: cycle log, task evidence, baseline-to-result deltas, and next-cycle linkages. Two weeks of prep, done in seconds. Every PDSA cycle automatically builds the documentation your surveyors ask for.",
    outcome:
      "Walk into your Operational Site Visit with documentation already assembled — not reconstructed the week before.",
  },
  {
    icon: FlaskConical,
    title: "Guided PDSA Cycles for FQHCs",
    painPoint: "Your team knows PDSA but struggles with consistency?",
    description:
      "Walk your team through Aim → Prediction → Measurement → Test → Analysis → Decision with coaching prompts, pre-built templates, and automatic linkage to the UDS measure you're trying to move. No more cycles that end in a binder and never get reviewed.",
    outcome:
      "Teams report cutting PDSA documentation time by 60–80% — time that goes back to patient care.",
  },
  {
    icon: BarChart3,
    title: "Real-Time UDS Measure Tracking",
    painPoint: "Waiting until year-end to see if your QI work moved the needle?",
    description:
      "Track the 7 core UDS clinical quality measures with live trend updates as your team completes cycles — so you know whether to scale an intervention or pivot before HRSA reporting.",
    outcome:
      "Year-over-year movement on the specific clinical measures you targeted — not just more reports.",
  },
  {
    icon: ClipboardCheck,
    title: "QI/QA Board Reports",
    painPoint: "Rebuilding the same board report every quarter?",
    description:
      "Turn your active cycles, measure trends, and completed work into a quarterly QI committee and board report you can review, approve, and export — without re-typing anything.",
    outcome:
      "Your board and HRSA reviewers see exactly what changed, when, and what evidence backs it.",
  },
];


type PersonaDeep = {
  id: string;
  icon: typeof LineChart;
  eyebrow: string;
  headline: string;
  pain: string;
  capabilities: string[];
  quote: string;
};

const personaDeepSections: PersonaDeep[] = [
  {
    id: "for-qi-directors",
    icon: LineChart,
    eyebrow: "For QI Directors",
    headline: "Your UDS measures, PDSA cycles, and audit evidence — unified",
    pain: "Stop juggling spreadsheets and siloed tools. See every clinical quality measure, every improvement cycle, and every piece of audit evidence in one view.",
    capabilities: [
      "UDS dashboards for the 7 core measures, with targets and gap-to-goal tracking",
      "Guided PDSA cycles linked to the exact UDS measure they're meant to move",
      "SPC charts with control limits so you know when a change is real, not noise",
    ],
    quote: "\"We stopped emailing UDS spreadsheets around and started running PDSA cycles that actually move the number.\"",
  },
  {
    id: "for-compliance-leads",
    icon: ClipboardCheck,
    eyebrow: "For Compliance & Survey Leads",
    headline: "Stay OSV-ready every single day",
    pain: "Stop scrambling before an operational site visit. Every cycle, task, and attachment is captured as you work, so the evidence is already there when HRSA asks.",
    capabilities: [
      "Cycle logs, tasks, and attachments captured in the moment, not reconstructed later",
      "Readiness view that shows which cycles are missing documentation",
      "One-click HRSA Audit Binder export, organized for survey review",
    ],
    quote: "\"OSV prep used to eat two months. Now the evidence is already there when we need it.\"",
  },
  {
    id: "for-operations-managers",
    icon: DollarSign,
    eyebrow: "For CHC Operations Managers",
    headline: "Enterprise QI capability, community-health pricing",
    pain: "Your health center deserves real QI tools — not another spreadsheet workaround or a six-figure enterprise contract you can't justify.",
    capabilities: [
      "Staff task management so improvement cycles keep moving between committee meetings",
      "HRSA Audit Binder that keeps every cycle log, task, and attachment survey-ready",
      "Board-ready reports and HRSA-aligned compliance binders without manual assembly",
    ],
    quote: "\"Same evidence trail our old enterprise vendor produced, at a fraction of the cost.\"",
  },
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
  { feature: "UDS measure tracking (7 core measures)", measurewise: true, spreadsheet: "Manual", generic: false },
  { feature: "SPC charts with control limits", measurewise: true, spreadsheet: false, generic: "Add-on" },
  { feature: "HRSA Audit Binder export", measurewise: true, spreadsheet: false, generic: false },
  { feature: "Built specifically for FQHCs", measurewise: true, spreadsheet: false, generic: false },
  { feature: "No per-seat licensing fees", measurewise: true, spreadsheet: true, generic: false },
  { feature: "Board-ready report export", measurewise: true, spreadsheet: "Manual", generic: "Add-on" },
];

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

const howItWorksSteps = [
  {
    icon: Target,
    number: "01",
    title: "Set up your UDS measures",
    description: "Select the clinical quality measures your FQHC is tracking — cervical cancer screening, diabetes HbA1c, depression screening, and more. MeasureWise pre-loads the 7 core UDS measures so you're ready in minutes.",
  },
  {
    icon: FlaskConical,
    number: "02",
    title: "Build a PDSA cycle",
    description: "Use guided templates or start from scratch. Every cycle is linked to the specific UDS measure you're trying to improve, with structured fields for Aim, Prediction, Measurement Plan, and Decision.",
  },
  {
    icon: TrendingUp,
    number: "03",
    title: "Track measure impact",
    description: "Watch your UDS rates update in real time with SPC charts that separate real improvement from noise. Know whether your intervention is working before you report to HRSA.",
  },
  {
    icon: FileCheck,
    number: "04",
    title: "Generate audit-ready documentation",
    description: "One click produces a complete HRSA Audit Binder — cycle logs, task evidence, baseline-to-result deltas, and next-cycle linkages included.",
  },
];



const faqItems = [
  {
    q: "What is MeasureWise?",
    a: "MeasureWise is a quality improvement platform built exclusively for Federally Qualified Health Centers (FQHCs). It connects PDSA cycles to the core UDS measures and keeps the documentation HRSA asks for — replacing spreadsheets with guided workflows, SPC charts, and one-click evidence exports.",
  },
  {
    q: "Does this replace our EHR or Azara?",
    a: "No. MeasureWise sits on top of your existing EHR and reporting tools like Azara, eClinicalWorks, or athenahealth. It doesn't replace them — it structures the quality improvement work that those systems can't manage. Think of it as the action layer between your data and your UDS outcomes.",
  },
  {
    q: "What data does MeasureWise use?",
    a: "MeasureWise uses aggregate quality improvement metrics — screening rates, cycle documentation, task completion, and trend data. No patient-level data or PHI enters the system. You enter your UDS measure rates and MeasureWise handles the rest.",
  },
  {
    q: "How long does it take to get started?",
    a: "Most teams are running their first PDSA cycle within 10 minutes. Sign up, select your UDS measures, and use a pre-built template or create a cycle from scratch. No implementation project, no IT involvement required.",
  },
  {
    q: "Can we start with one site or pilot program?",
    a: "Absolutely. Many FQHCs start with a single site or a single clinical measure and expand from there. Every plan starts with a 14-day free trial, which is plenty of time to run a pilot cycle. Multi-site features are available on the Multi-Site and Network plans.",
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
    a: "Spreadsheets can track data but they can't guide a PDSA cycle, calculate SPC control limits, or assemble an HRSA Audit Binder from linked evidence. MeasureWise does all of this in one purpose-built tool.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. Every plan starts with a 14-day free trial — no credit card required to begin. You get full access during the trial. Add a card before day 14 to keep your workspace; otherwise it locks until you subscribe.",
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
  name: BRAND.name,
  url: BRAND.url,
  logo: `${BRAND.url}/measurewise-logo.png`,
  description: "Quality improvement software built exclusively for Federally Qualified Health Centers.",
  sameAs: [],
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: BRAND.name,
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description: "The only quality improvement platform built exclusively for FQHCs. Link PDSA cycles to UDS measures and HRSA funding outcomes.",
  offers: [
    { "@type": "Offer", name: "Solo Clinic", price: "149", priceCurrency: "USD", priceSpecification: { "@type": "UnitPriceSpecification", price: "149", priceCurrency: "USD", unitText: "MONTH" } },
    { "@type": "Offer", name: "Multi-Site", price: "349", priceCurrency: "USD", priceSpecification: { "@type": "UnitPriceSpecification", price: "349", priceCurrency: "USD", unitText: "MONTH" } },
    { "@type": "Offer", name: "Network", price: "699", priceCurrency: "USD", priceSpecification: { "@type": "UnitPriceSpecification", price: "699", priceCurrency: "USD", unitText: "MONTH" } },
  ],
};


function ComparisonCell({ value }: { value: boolean | string }) {
  if (value === true) return <CheckCircle className="h-5 w-5 text-primary mx-auto" />;
  if (value === false) return <X className="h-5 w-5 text-muted-foreground mx-auto" aria-label="Not included" />;
  return <span className="text-sm text-muted-foreground">{value}</span>;
}

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <PublicPageLayout>
      <SEO
        title={`${BRAND.nameTm} — ${BRAND.tagline}`}
        description="Link every PDSA cycle to a UDS measure, track impact in real time, and export HRSA Audit Binders — built for FQHC quality teams."
        canonical={`${BRAND.url}/`}
        jsonLd={[orgJsonLd, softwareJsonLd, faqJsonLd]}

      />


      {/* Hero — audience → outcome → proof */}
      <section className="py-20 md:py-24 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: copy + CTA */}
          <div className="space-y-7 text-center lg:text-left">
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wide">
              Built for FQHC Quality Teams
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight text-foreground leading-[1.08]">
              Move a UDS measure in 90 days — and walk into your next HRSA site visit binder-ready.
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed">
              MeasureWise gives FQHC quality directors one defensible workflow for every
              PDSA cycle: guided templates, real-time SPC charts, and a one-click
              HRSA Chapter-10 Audit Binder. Replace 4–6 spreadsheets with the system your
              surveyors expect to see.
            </p>

            <ul className="grid sm:grid-cols-3 gap-3 text-left max-w-xl mx-auto lg:mx-0">
              <li className="rounded-lg border border-border bg-card px-3 py-2.5">
                <p className="text-sm font-semibold text-foreground">Move a measure in 90 days</p>
                <p className="text-xs text-muted-foreground">SPC-backed cycles, not spreadsheets</p>
              </li>
              <li className="rounded-lg border border-border bg-card px-3 py-2.5">
                <p className="text-sm font-semibold text-foreground">Audit prep: 2 weeks → 2 hours</p>
                <p className="text-xs text-muted-foreground">Binder builds itself as you work</p>
              </li>
              <li className="rounded-lg border border-border bg-card px-3 py-2.5">
                <p className="text-sm font-semibold text-foreground">Retire 4–6 spreadsheets</p>
                <p className="text-xs text-muted-foreground">One system, one source of truth</p>
              </li>
            </ul>

            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 pt-1">
              <Button size="lg" asChild className="text-base px-8 w-full sm:w-auto">
                <Link to="/auth?signup=true">
                  Start your 14-day free trial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base px-8 w-full sm:w-auto">
                <Link to="/demo">See a real cycle — no signup</Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              {TRIAL_TERMS}{" "}
              <Link to="/contact" className="text-primary hover:underline">Talk to the founder</Link>
            </p>


          </div>

          {/* Right: dashboard preview */}
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-3xl blur-2xl" aria-hidden="true" />
            <div className="relative rounded-xl border border-border shadow-2xl overflow-hidden bg-card">
              <picture>
                <source srcSet={dashboardPreviewWebp} type="image/webp" />
                <img
                  src={dashboardPreview}
                  alt={`${BRAND.name} dashboard showing active PDSA cycles, UDS measures at risk, tasks due this week, and an SPC control chart`}
                  className="w-full h-auto"
                  width={1503}
                  height={790}
                  {...({ fetchpriority: "high" } as any)}
                  decoding="async"
                />
              </picture>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof + trust */}
      <TrustStrip />


      <section className="py-20 md:py-24 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            The quality system FQHCs were never given
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            MeasureWise sits on top of your EHR and Azara. It structures every PDSA cycle,
            links it to the UDS measure it should move, and builds your HRSA Audit Binder
            as you work — so quality improvement actually shows up in your numbers and in
            your site-visit binder.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            Dashboards show you where your rates <em>are</em>. MeasureWise helps you
            change them — and proves you did.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/auth?signup=true">
                Start your 14-day free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <a href="#how-it-works">See the full workflow</a>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-muted/30 scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              How it works — in four steps
            </h2>
            <p className="text-muted-foreground mt-3 text-lg max-w-2xl mx-auto">
              From measure selection to HRSA Audit Binder, MeasureWise guides your team through
              the entire quality improvement workflow.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step) => (
              <div key={step.number} className="relative space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-extrabold text-primary/20">{step.number}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
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
                <Link to="/features#spc-charts">
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

      {/* Key Features — with pain-point openers */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Key features built for FQHC quality teams
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
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                  </div>
                  <p className="text-sm font-medium text-primary/80 italic">{f.painPoint}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                  <p className="flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span><span className="font-semibold">Outcome:</span> {f.outcome}</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/auth?signup=true">
                Start your 14-day free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <Link to="/contact">Talk to the founder</Link>
            </Button>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">{TRIAL_TERMS}</p>

        </div>
      </section>


      {/* Pricing Teaser */}
      <section className="py-12 px-6 bg-primary/5 border-y border-primary/10">
        <div className="max-w-5xl mx-auto text-center space-y-5">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">Simple, FQHC-friendly pricing</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm font-semibold">
              <span className="text-foreground">Solo</span>
              <span className="text-primary">$149</span>
              <span className="text-muted-foreground text-xs">/mo</span>
            </span>
            <ArrowRight className="h-4 w-4 text-primary/50 hidden sm:block" />
            <span className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm font-semibold">
              <span className="text-foreground">Multi-Site</span>
              <span className="text-primary">$349</span>
              <span className="text-muted-foreground text-xs">/mo</span>
            </span>
            <ArrowRight className="h-4 w-4 text-primary/50 hidden sm:block" />
            <span className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm font-semibold">
              <span className="text-foreground">Network</span>
              <span className="text-primary">$699</span>
              <span className="text-muted-foreground text-xs">/mo</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {TRIAL_TERMS} No per-seat licensing.
          </p>
          <Button variant="outline" asChild>
            <Link to="/pricing">See full pricing <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Store Teaser */}
      <section className="py-12 px-6 border-b border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">MeasureWise Store</p>
            <h3 className="text-2xl font-bold text-foreground">
              Templates that move UDS measures and survive HRSA audits
            </h3>
            <p className="text-muted-foreground">
              UDS, PDSA, QI committee, and board reporting templates. Buy once, no subscription.
            </p>
          </div>
          <div className="shrink-0">
            <Button asChild>
              <Link to="/store">Browse the Store <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
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


      {/* AthenaOne Playbook Lead Magnet */}
      <PlaybookLeadMagnetSection />

      {/* Sample Export Preview */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-foreground">
              See what MeasureWise produces
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Download a sample HRSA Audit Binder — the same format your health center
              will generate in one click after completing a PDSA cycle.
            </p>
          </div>
          <SampleExportButtons />
          <p className="text-xs text-muted-foreground">
            This is a sample preview binder with example data. Your actual exports will reflect your health center's real QI activity.
          </p>
        </div>
      </section>

      {/* Who it's for — intro to the three role sections below */}
      <section className="pt-24 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-3">
          <h2 className="text-3xl font-bold text-foreground">Who MeasureWise is for</h2>
          <p className="text-muted-foreground text-lg">
            Whether you lead QI, own compliance, or manage operations — here's what the platform does for your role.
          </p>
        </div>
      </section>


      {/* Per-role deep sections (were separate /for/* pages) */}
      {personaDeepSections.map((p, idx) => {
        const Icon = p.icon;
        const alt = idx % 2 === 0;
        return (
          <section
            key={p.id}
            id={p.id}
            className={`py-20 px-6 scroll-mt-24 ${alt ? "bg-background" : "bg-muted/30"}`}
          >
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-start">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4 text-primary" />
                  {p.eyebrow}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  {p.headline}
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">{p.pain}</p>
                <blockquote className="border-l-2 border-primary/40 pl-4 text-sm italic text-muted-foreground">
                  {p.quote}
                </blockquote>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button asChild>
                    <Link to="/pricing">
                      Start 14-day free trial <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="#how-it-works">See how it works</a>
                  </Button>
                </div>
              </div>
              <ul className="space-y-4">
                {p.capabilities.map((cap) => (
                  <li key={cap} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground leading-relaxed">{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}



      {/* Founder Authority */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <img
              src={jessicaPhoto.url}
              alt={`${BRAND.founder.formalName}, Founder of ${BRAND.name}`}
              loading="lazy"
              className="h-36 w-36 md:h-44 md:w-44 rounded-full object-cover border-2 border-primary/20 shadow-lg"
            />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Built for FQHCs by an FQHC operator
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            MeasureWise is built by a current FQHC quality and clinical operations leader with 12 years of experience who has
            lived through UDS season, survived HRSA site visits, managed NCQA submissions, and
            watched quality teams drown in spreadsheets that were never designed for PDSA tracking.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            I built MeasureWise because the enterprise QI tools on the market are overpriced,
            overcomplicated, and built by people who have never had to defend a PDSA cycle
            in front of a site-visit reviewer. This is the tool I wish I had — designed to close
            the gap between what happens in clinics and what shows up in your UDS tables.
          </p>
          <p className="text-sm text-muted-foreground italic">
            — {BRAND.founder.formalName} · {BRAND.founder.title}
          </p>
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
    </PublicPageLayout>
  );
}
