import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import {
  FlaskConical, Target, ClipboardList, BarChart3, Users, Save,
  TrendingUp, Bell, FileCheck, LineChart,
  Download, Clock, Printer,
  AlertTriangle, Sigma, BookOpen,
  ClipboardCheck, Bot, ShieldCheck, Building2, PenLine,
} from "lucide-react";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MeasureWise",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description:
    "Quality operations platform for FQHCs — PDSA cycles, UDS measure tracking, SPC charts, QI/QA board reports, and the HRSA OSV Export Packet.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "14-day free trial" },
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
    eyebrow: "PDSA Lab",
    eyebrowIcon: FlaskConical,
    title: "UDS-aligned PDSA cycles",
    titleAccent: "built for FQHCs",
    intro:
      "FQHC Quality Directors run improvement cycles all year, but most live in disconnected spreadsheets that never tie back to a UDS measure. PDSA Lab is a Kanban board where every cycle is structured around the UDS measure it's meant to move, with the Plan-Do-Study-Act detail HRSA reviewers expect to see.",
    cardsHeading: "What PDSA Lab does today",
    cards: [
      { icon: FlaskConical, title: "Guided 4-Phase Workflow", description: "A creation wizard walks your team through Plan → Do → Study → Act with prompts, prediction fields, and structured fields at each phase." },
      { icon: Target, title: "Linked to UDS Measures", description: "Each cycle is tied to one of the 7 core UDS clinical quality measures, with a baseline and target recorded on the cycle." },
      { icon: ClipboardList, title: "19 Pre-Built FQHC Templates", description: "Start from templates covering diabetes control, hypertension, cervical and colorectal cancer screening, depression screening, tobacco use, and more — searchable in the wizard." },
      { icon: Users, title: "Team Task Assignment", description: "Assign cycle tasks to staff with owners and due dates, tracked on the Staff Tasks page." },
      { icon: Save, title: "Auto-Saved Drafts", description: "Progress saves as you type. Leave mid-cycle and resume from the step you left off, on desktop or mobile." },
      { icon: ClipboardCheck, title: "Completeness Tracking", description: "A completeness indicator on every card shows which phase fields are still missing before the cycle is documentation-ready." },
    ],
    narrative: [
      {
        heading: "How PDSA cycles work in MeasureWise",
        paragraphs: [
          "When you create a cycle you pick a UDS measure — for example, Cervical Cancer Screening (CMS124) — then record your aim, baseline, and prediction.",
          "The Plan phase defines the intervention, test population, and assigned tasks. The Do phase captures what actually happened. The Study phase records results against your prediction. The Act phase asks you to Adopt, Adapt, or Abandon. Everything you enter flows into the OSV Export Packet.",
        ],
      },
    ],
  },
  {
    id: "uds-tracking",
    eyebrow: "UDS Measure Tracking",
    eyebrowIcon: BarChart3,
    title: "UDS measure tracking",
    titleAccent: "for the 7 core measures",
    intro:
      "MeasureWise tracks monthly performance for the seven core UDS clinical quality measures, so you can see which one is sliding before it shows up in your HRSA report. Measure values are entered by your team — MeasureWise does not connect to an EHR.",
    cardsHeading: "What you can track",
    cards: [
      { icon: BarChart3, title: "7 Core UDS Measures", description: "Depression screening, tobacco use, colorectal cancer, cervical cancer, breast cancer, hypertension control, and diabetes HbA1c > 9%." },
      { icon: TrendingUp, title: "Monthly Trend View", description: "Enter monthly values and see each measure trend across the reporting year on the dashboard." },
      { icon: Target, title: "Gap-to-Target Tracking", description: "Set a target per measure and see at a glance which measures sit below goal." },
      { icon: LineChart, title: "SPC Chart on Your Data", description: "The dashboard SPC chart is built from the same monthly measure data — no separate entry." },
      { icon: Bell, title: "In-App Notifications & Task Emails", description: "A notification feed in the app plus automated email reminders when assigned tasks approach their due date." },
      { icon: FileCheck, title: "Measures in Your Exports", description: "Current measure performance is included in the OSV Export Packet and QI/QA board reports." },
    ],
    narrative: [
      {
        heading: "Why UDS tracking matters for FQHCs",
        paragraphs: [
          "The Uniform Data System (UDS) is the primary reporting mechanism for HRSA-funded health centers. Strong UDS performance leads to better site-visit outcomes and Quality Award eligibility.",
          "MeasureWise keeps measure performance next to the PDSA cycles working on it, so the connection between the work and the number is documented rather than remembered.",
        ],
      },
    ],
  },
  {
    id: "spc-charts",
    eyebrow: "SPC Chart",
    eyebrowIcon: LineChart,
    title: "A control chart on your",
    titleAccent: "UDS measure data",
    intro:
      "Was that change real, or month-to-month noise? The dashboard SPC chart plots any of the seven UDS measures against calculated control limits so your QI committee can answer with a chart instead of a hunch.",
    cardsHeading: "What the SPC chart gives you",
    cards: [
      { icon: LineChart, title: "Generated From Your Entries", description: "The chart builds itself from the monthly UDS values your team already enters — no Excel formulas." },
      { icon: Sigma, title: "Center Line and 3σ Limits", description: "Center line plus upper and lower control limits calculated at three standard deviations, labeled directly on the axis." },
      { icon: AlertTriangle, title: "Out-of-Control Points Flagged", description: "Any point falling outside the control limits is highlighted on the chart." },
      { icon: BarChart3, title: "Measure Switcher", description: "Switch between all seven core UDS measures from a single control on the dashboard." },
    ],
    narrative: [
      {
        heading: "Why SPC matters for quality improvement",
        paragraphs: [
          "The Institute for Healthcare Improvement recommends control charts as the primary tool for separating common cause variation from special cause variation. Without one, teams celebrate random improvement as real or panic over a random dip.",
          "For FQHCs, a control chart paired with documented PDSA cycles is the kind of evidence of data-driven quality improvement HRSA expects to see.",
        ],
      },
    ],
  },
  {
    id: "audit-binder",
    eyebrow: "OSV Export Packet",
    eyebrowIcon: FileCheck,
    title: "HRSA OSV packet generated from",
    titleAccent: "the work you already logged",
    intro:
      "HRSA Operational Site Visits demand a documented trail of UDS-aligned improvement work, QI committee oversight, and follow-through. MeasureWise assembles that packet as a paginated PDF from the data already in your workspace.",
    cardsHeading: "What's in the packet",
    cards: [
      { icon: Download, title: "One-Click PDF Export", description: "Generate a complete, paginated packet as a PDF in seconds." },
      { icon: ShieldCheck, title: "Quality Infrastructure", description: "Your documented QI oversight roles and quality program structure." },
      { icon: BarChart3, title: "Measure Monitoring", description: "Current UDS measure performance against targets for the reporting period." },
      { icon: FlaskConical, title: "PDSA Documentation", description: "Cycle summaries plus full phase-by-phase detail for each documented cycle." },
      { icon: Clock, title: "Task & Meeting Records", description: "Task tracking history and QI committee meeting documentation you've logged." },
      { icon: Printer, title: "Audit Readiness Checklist", description: "A closing checklist flagging which sections still have gaps before you rely on the packet." },
    ],
    narrative: [
      {
        heading: "Honest about what it is",
        paragraphs: [
          "The packet reflects what your team has entered into MeasureWise — nothing more. Completeness depends on what's been logged for the period, which is exactly why the readiness checklist is printed at the end.",
          "Because the evidence is captured as you work, prep becomes review instead of reconstruction.",
        ],
      },
    ],
  },
  {
    id: "qi-reports",
    eyebrow: "QI/QA Reports",
    eyebrowIcon: ClipboardCheck,
    title: "Board-ready QI/QA reports",
    titleAccent: "without the rewrite",
    intro:
      "Quality committees and boards need a periodic QI/QA report. MeasureWise builds one from your measure data and active cycles, then exports it as a PDF you can hand to your board.",
    cardsHeading: "What the report module does",
    cards: [
      { icon: PenLine, title: "Guided Report Wizard", description: "Step through the report period, measure snapshot, cycle summaries, and board actions." },
      { icon: BarChart3, title: "Measure Snapshot Table", description: "Current performance against target for the reporting period, pulled from your entered data." },
      { icon: ClipboardList, title: "Board Actions Table", description: "Track the actions and recommendations the report puts in front of your board." },
      { icon: Users, title: "Approval Chain", description: "Record who reviewed and approved the report before it goes to the board." },
      { icon: Download, title: "PDF Export", description: "Export the full report or a condensed board view as a formatted PDF." },
    ],
    narrative: [],
  },
  {
    id: "ai-and-more",
    eyebrow: "Also Included",
    eyebrowIcon: Bot,
    title: "The rest of the",
    titleAccent: "workspace",
    intro:
      "Beyond the core cycle-to-packet workflow, your workspace includes tools your quality team reaches for week to week.",
    cardsHeading: "Included in every plan unless noted",
    cards: [
      { icon: Bot, title: "AI Quality Assistant", description: "Chat-based help with root cause analysis and framing improvement work, grounded in your workspace context." },
      { icon: ShieldCheck, title: "AI Governance (NIST)", description: "Inventory the AI tools your health center uses, log vendor reviews and incidents, and score your posture against NIST AI RMF characteristics." },
      { icon: BookOpen, title: "Playbook Library", description: "Reference playbooks organized by clinical domain to start improvement work from a proven approach." },
      { icon: Users, title: "Team Roles & Staff Tasks", description: "Invite teammates, assign cycle tasks by role, and track what's due on the Staff Tasks page." },
      { icon: Building2, title: "Network Dashboard — Network plan only", description: "Multi-site rollup comparing performance across the health centers in your network. Available on the Network plan." },
    ],
    narrative: [
      {
        heading: "What MeasureWise does not do",
        paragraphs: [
          "No EHR integration — measure values are entered by your team. No claims, billing, or financial ROI modeling. No PCMH recertification module. We would rather you know that now than discover it in week two of a trial.",
        ],
      },
    ],
  },
];

export default function Features() {
  return (
    <PublicPageLayout backTo={{ label: "Back to Home", href: "/" }}>
      <SEO
        title="Features — PDSA, UDS Tracking, SPC & HRSA OSV Packets"
        description="Everything MeasureWise does today: guided PDSA cycles, 7-measure UDS tracking, an SPC control chart, QI/QA board reports, and the HRSA OSV Export Packet."
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
            One workflow: run UDS-aligned PDSA cycles, watch the measures, and export the documentation HRSA asks for. Listed below is what ships today — nothing planned, nothing retired.
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
