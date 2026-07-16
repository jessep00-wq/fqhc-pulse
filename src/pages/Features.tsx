import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import {
  FlaskConical, Target, ClipboardList, BarChart3, Users, RefreshCw,
  TrendingUp, Bell, FileCheck, LineChart,
  Download, FolderOpen, Clock, Shield, Printer,
  AlertTriangle, Sigma, Eye,
  ClipboardCheck, CalendarCheck, Layers,
} from "lucide-react";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MeasureWise",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description:
    "Quality operations platform for FQHCs — PDSA cycles, UDS tracking, SPC charts, HRSA audit binders, and PCMH Q-PASS evidence collection.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free 14-day trial" },
};

type FeatureCard = { icon: typeof FlaskConical; title: string; description: string };

type FeatureSection = {
  id: string;
  eyebrow: string;
  eyebrowIcon: typeof FlaskConical;
  title: string;
  titleAccent: string;
  intro: string;
  cardsHeading: string;
  cards: FeatureCard[];
  narrative: { heading: string; paragraphs: (string | JSX.Element)[] }[];
};

const sections: FeatureSection[] = [
  {
    id: "pdsa",
    eyebrow: "PDSA Cycle Manager",
    eyebrowIcon: FlaskConical,
    title: "UDS-aligned PDSA cycles",
    titleAccent: "built for FQHCs",
    intro:
      "FQHC Quality Directors run dozens of Plan-Do-Study-Act cycles each year, but most live in disconnected spreadsheets that never tie back to a UDS measure. MeasureWise structures every cycle around the specific UDS clinical quality measure it's meant to move — and proves the movement with an SPC chart HRSA reviewers expect to see.",
    cardsHeading: "Why FQHCs need a dedicated PDSA tool",
    cards: [
      { icon: FlaskConical, title: "Guided 4-Phase Workflow", description: "Walk your team through Plan → Do → Study → Act with built-in coaching prompts, prediction fields, and structured data collection at each phase." },
      { icon: Target, title: "Linked to UDS Measures", description: "Every PDSA cycle connects to one or more UDS clinical quality measures. When your cycle succeeds, you can see the measure move — and prove it to HRSA." },
      { icon: ClipboardList, title: "Pre-Built FQHC Templates", description: "Start from 30+ templates covering cervical cancer screening, diabetes control, depression screening, hypertension, and more." },
      { icon: BarChart3, title: "SPC Charts Per Cycle", description: "Statistical Process Control charts auto-generate for each cycle, showing whether your intervention produced a statistically significant change." },
      { icon: Users, title: "Team Task Assignment", description: "Assign cycle tasks to specific staff members with deadlines and accountability tracking." },
      { icon: RefreshCw, title: "Cycle-to-Cycle Linkage", description: "Link completed cycles to the next iteration — a documented chain of improvement auditors love to see." },
    ],
    narrative: [
      {
        heading: "How PDSA cycles work in MeasureWise",
        paragraphs: [
          "When you create a new PDSA cycle in MeasureWise, you start by selecting a UDS measure — for example, Cervical Cancer Screening (CMS124). The system pulls your current baseline and asks you to set an aim statement and a prediction.",
          "The Plan phase defines intervention, test population, and assigned tasks. The Do phase captures what actually happened. The Study phase compares results against your prediction and generates an SPC chart. The Act phase asks you to Adopt, Adapt, or Abandon — each decision links forward to the next cycle.",
        ],
      },
    ],
  },
  {
    id: "uds-tracking",
    eyebrow: "UDS Measure Tracking",
    eyebrowIcon: BarChart3,
    title: "UDS measure tracking software",
    titleAccent: "for FQHCs",
    intro:
      "The spreadsheet you inherited can't tell you which UDS measure is sliding this month. MeasureWise replaces that spreadsheet with a live, trend-aware tracker for every UDS clinical quality measure, so you act on declining numbers before they end up in HRSA's report.",
    cardsHeading: "What you can track",
    cards: [
      { icon: BarChart3, title: "20+ UDS Measures", description: "Cervical cancer screening, diabetes HbA1c, hypertension, depression screening, BMI, and more — every measure HRSA reviews." },
      { icon: TrendingUp, title: "Real-Time Trend Analysis", description: "See how each measure trends month over month. Identify declining measures before they become audit findings." },
      { icon: Target, title: "Gap-to-Target Tracking", description: "Set targets and instantly see which measures are below goal. Weekly digest tells you exactly where to focus." },
      { icon: LineChart, title: "SPC Chart Integration", description: "Statistical Process Control charts distinguish real improvement from random variation." },
      { icon: Bell, title: "Automated Alerts", description: "Get notified when a measure drops below target or shows a declining trend." },
      { icon: FileCheck, title: "Audit-Ready Reports", description: "Generate UDS performance summaries formatted for HRSA site visit reviewers. One click, done." },
    ],
    narrative: [
      {
        heading: "Why UDS tracking matters for FQHCs",
        paragraphs: [
          "The Uniform Data System (UDS) is the primary reporting mechanism for HRSA-funded health centers. Strong UDS performance leads to better site-visit outcomes, higher grant funding, and Quality Award eligibility.",
          "MeasureWise connects your UDS measure data to your active PDSA cycles, creating a live feedback loop. When cervical cancer screening drops, you see it immediately — and you can link it to the PDSA cycle working to improve it.",
        ],
      },
    ],
  },
  {
    id: "spc-charts",
    eyebrow: "SPC Charts",
    eyebrowIcon: LineChart,
    title: "SPC charts for",
    titleAccent: "UDS measure tracking",
    intro:
      "Did the intervention actually move the UDS measure, or was it random month-to-month noise? MeasureWise auto-generates Statistical Process Control charts on every UDS line item — so your QI committee can answer that question with a chart, not a hunch.",
    cardsHeading: "SPC made simple for healthcare",
    cards: [
      { icon: LineChart, title: "Auto-Generated Charts", description: "SPC charts generate automatically from your UDS measure data — no manual entry, no Excel formulas." },
      { icon: TrendingUp, title: "Trend Detection", description: "MeasureWise flags runs, shifts, and trends using Western Electric rules." },
      { icon: AlertTriangle, title: "Out-of-Control Signals", description: "Points outside control limits are highlighted automatically." },
      { icon: Sigma, title: "Control Limits Calculated", description: "UCL/LCL calculated using standard SPC formulas. Center line, ±1σ, ±2σ, and ±3σ all displayed." },
      { icon: BarChart3, title: "Before/After Comparison", description: "Split at the intervention point to see separate control limits for pre- and post-intervention periods." },
      { icon: Eye, title: "Board-Ready Visuals", description: "Export as images for board presentations. Clean, professional, annotated." },
    ],
    narrative: [
      {
        heading: "Why SPC matters for quality improvement",
        paragraphs: [
          "The Institute for Healthcare Improvement (IHI) recommends SPC charts as the primary tool for distinguishing common cause variation from special cause variation. Without SPC, teams either celebrate random improvement as real or panic about a random decline.",
          "For FQHCs, well-annotated SPC charts linked to documented PDSA cycles are exactly the evidence of \"data-driven quality improvement\" that HRSA Chapter 10 requires.",
        ],
      },
    ],
  },
  {
    id: "audit-binder",
    eyebrow: "HRSA Audit Binder",
    eyebrowIcon: FileCheck,
    title: "HRSA audit binder generator for",
    titleAccent: "FQHC quality improvement",
    intro:
      "HRSA Operational Site Visits demand a documented trail of UDS-aligned PDSA cycles, SPC analysis, and QI committee action. Most FQHC Quality Directors spend two to four weeks assembling that binder by hand. MeasureWise generates it in seconds because the evidence is captured as you work.",
    cardsHeading: "What's in the binder",
    cards: [
      { icon: Download, title: "One-Click PDF Export", description: "Generate a complete, paginated audit binder PDF in seconds." },
      { icon: FolderOpen, title: "Organized by HRSA Chapter", description: "Evidence organized by HRSA Compliance Manual chapters — Chapter 10, Chapter 19, and more." },
      { icon: FileCheck, title: "PDSA Cycle Documentation", description: "Aim, baseline, intervention, results, SPC chart, and decision rationale for every cycle." },
      { icon: Clock, title: "Timestamped Audit Trail", description: "Every action is timestamped and attributed to a specific staff member." },
      { icon: Shield, title: "Compliance Gap Analysis", description: "Run a gap analysis before the site visit to see which HRSA requirements have documented evidence." },
      { icon: Printer, title: "Print-Ready Formatting", description: "Professional formatting with headers, page numbers, table of contents, and appendices." },
    ],
    narrative: [
      {
        heading: "Why site-visit prep is so painful",
        paragraphs: [
          "Every 3-5 years HRSA runs an Operational Site Visit. Reviewers evaluate 19 program requirements covering governance, clinical operations, financial management, and — critically — quality improvement.",
          "Because MeasureWise captures your QI activities as you do them, the audit binder generates itself. Every cycle, every task, every data point is already structured, timestamped, and attributed.",
        ],
      },
    ],
  },
  {
    id: "pcmh-evidence",
    eyebrow: "PCMH Q-PASS Evidence",
    eyebrowIcon: ClipboardCheck,
    title: "PCMH Q-PASS evidence collection,",
    titleAccent: "automated",
    intro:
      "NCQA PCMH recertification requires evidence across dozens of Q-PASS standards. MeasureWise collects that evidence as part of your daily QI workflow — so you're always audit-ready, not scrambling before your recertification window.",
    cardsHeading: "Evidence collection on autopilot",
    cards: [
      { icon: ClipboardCheck, title: "Q-PASS Standards Mapping", description: "Every PDSA cycle and QI activity maps to relevant NCQA Q-PASS evidence requirements." },
      { icon: FolderOpen, title: "Evidence Organized by Domain", description: "Documentation categorized by PCMH concept areas: Team-Based Care, Population Health, Care Coordination, and QI." },
      { icon: FileCheck, title: "One-Click Recertification Binder", description: "Every document organized, labeled, and cross-referenced to the relevant standard." },
      { icon: CalendarCheck, title: "Year-Round Readiness Dashboard", description: "See which standards have current evidence, which need updates, and which have upcoming deadlines." },
      { icon: Shield, title: "Compliance Gap Alerts", description: "Get notified when evidence is aging out or when new Q-PASS requirements need documentation." },
      { icon: Layers, title: "Dual Compliance", description: "Many evidence items satisfy both HRSA and NCQA requirements. Document once, satisfy both." },
    ],
    narrative: [
      {
        heading: "How MeasureWise helps",
        paragraphs: [
          "Because MeasureWise already captures your PDSA cycles, quality activities, and measure tracking as structured data, it automatically maps this evidence to Q-PASS standards. Your daily QI work generates the documentation NCQA needs to see.",
        ],
      },
    ],
  },
];

export default function Features() {
  return (
    <PublicPageLayout backTo={{ label: "Back to Home", href: "/" }}>
      <SEO
        title="Features — PDSA, UDS, SPC, HRSA & PCMH for FQHCs"
        description="Every MeasureWise feature in one place: guided PDSA cycles, UDS measure tracking, SPC charts, HRSA audit binder export, and PCMH Q-PASS evidence collection."
        canonical="https://measurewise.org/features"
        jsonLd={jsonLd}
      />

      {/* Page hero + jump nav */}
      <section className="py-16 px-6 border-b border-border">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Everything MeasureWise does,
            <br />
            <span className="text-primary">in one place</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Five capabilities that together replace the spreadsheets, binders, and one-off consultants FQHC quality teams stitch together today.
          </p>
          <nav className="flex flex-wrap justify-center gap-2 pt-2 text-sm">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                {s.eyebrow}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {sections.map((section, idx) => {
        const Eyebrow = section.eyebrowIcon;
        const alt = idx % 2 === 1;
        return (
          <section
            key={section.id}
            id={section.id}
            className={`py-20 px-6 scroll-mt-24 ${alt ? "bg-muted/30" : ""}`}
          >
            <div className="max-w-5xl mx-auto space-y-12">
              <div className="max-w-3xl mx-auto text-center space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground">
                  <Eyebrow className="h-4 w-4 text-primary" />
                  {section.eyebrow}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
                  {section.title}
                  <br />
                  <span className="text-primary">{section.titleAccent}</span>
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {section.intro}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground text-center mb-8">
                  {section.cardsHeading}
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {section.cards.map((c) => (
                    <Card key={c.title} className="border-border">
                      <CardContent className="p-6">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                          <c.icon className="h-5 w-5" />
                        </div>
                        <h4 className="font-semibold text-foreground mb-2">{c.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {section.narrative.map((n) => (
                <div key={n.heading} className="max-w-3xl mx-auto space-y-4 text-muted-foreground leading-relaxed">
                  <h3 className="text-2xl font-bold text-foreground">{n.heading}</h3>
                  {n.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </PublicPageLayout>
  );
}
