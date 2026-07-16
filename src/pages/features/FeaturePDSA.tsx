import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { FlaskConical, Target, ClipboardList, BarChart3, Users, RefreshCw } from "lucide-react";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MeasureWise PDSA Cycle Manager",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description: "Guided PDSA cycle management software built for Federally Qualified Health Centers. Run Plan-Do-Study-Act improvement cycles linked to UDS measures.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free 14-day trial" },
};

const features = [
  { icon: FlaskConical, title: "Guided 4-Phase Workflow", description: "Walk your team through Plan → Do → Study → Act with built-in coaching prompts, prediction fields, and structured data collection at each phase." },
  { icon: Target, title: "Linked to UDS Measures", description: "Every PDSA cycle connects to one or more UDS clinical quality measures. When your cycle succeeds, you can see the measure move — and prove it to HRSA." },
  { icon: ClipboardList, title: "Pre-Built FQHC Templates", description: "Start from 30+ templates covering cervical cancer screening, diabetes control, depression screening, hypertension, and more. Each template includes aim statements, measurement plans, and test ideas." },
  { icon: BarChart3, title: "SPC Charts Per Cycle", description: "Statistical Process Control charts auto-generate for each cycle, showing whether your intervention produced a statistically significant change — not just random variation." },
  { icon: Users, title: "Team Task Assignment", description: "Assign cycle tasks to specific staff members with deadlines and accountability tracking. Quality Directors see who's on track and who needs follow-up." },
  { icon: RefreshCw, title: "Cycle-to-Cycle Linkage", description: "When a PDSA cycle completes, link it to the next iteration. Build a documented chain of improvement that auditors love to see." },
];

export default function FeaturePDSA() {
  return (
    <PublicPageLayout backTo={{ label: "Back to Home", href: "/" }}>
      <SEO
        title="UDS-aligned PDSA cycles for FQHCs"
        description="Guided UDS-aligned PDSA cycle management for Federally Qualified Health Centers. Pre-built FQHC PDSA cycle templates, SPC analysis per cycle, and HRSA-ready documentation."
        canonical="https://measurewise.org/features/pdsa-cycle-manager"
        jsonLd={jsonLd}
      />

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            <FlaskConical className="h-4 w-4 text-primary" />
            Feature
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            UDS-aligned PDSA cycles
            <br />
            <span className="text-primary">built for FQHCs</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            FQHC Quality Directors run dozens of Plan-Do-Study-Act cycles each year, but most live in disconnected spreadsheets that never tie back to a UDS measure. MeasureWise structures every cycle around the specific UDS clinical quality measure it's meant to move — and proves the movement with an SPC chart HRSA reviewers expect to see.
          </p>
        </div>
      </section>


      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">Why FQHCs need a dedicated PDSA tool</h2>
          <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-12 leading-relaxed">
            The Plan-Do-Study-Act cycle is the foundation of quality improvement at Federally Qualified Health Centers. HRSA expects to see documented improvement cycles during site visits. But spreadsheet-based tracking creates gaps: missing data, disconnected measures, and no audit trail. A purpose-built PDSA cycle manager for health centers solves these problems.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-border">
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto prose prose-lg">
          <h2 className="text-2xl font-bold text-foreground">How PDSA cycles work in MeasureWise</h2>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              When you create a new PDSA cycle in MeasureWise, you start by selecting a UDS measure — for example, Cervical Cancer Screening (CMS124). The system pulls your current baseline from your UDS trend data and asks you to set an aim statement and a prediction for what will happen during the test.
            </p>
            <p>
              During the <strong className="text-foreground">Plan</strong> phase, you define your intervention, identify your test population, and assign tasks to team members. MeasureWise provides coaching prompts based on common FQHC quality improvement strategies for each measure domain.
            </p>
            <p>
              The <strong className="text-foreground">Do</strong> phase captures what actually happened during the test — including any deviations from the plan. Staff members log their activities and observations directly in the system.
            </p>
            <p>
              In the <strong className="text-foreground">Study</strong> phase, MeasureWise compares your results against your prediction and generates an SPC chart showing whether the change was statistically significant. This is the data HRSA reviewers want to see.
            </p>
            <p>
              Finally, the <strong className="text-foreground">Act</strong> phase asks you to decide: Adopt the change, Adapt it for another cycle, or Abandon it. Each decision links forward to the next cycle, creating the documented improvement chain that demonstrates your health center's commitment to quality.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">Related resources</h2>
          <ul className="space-y-3">
            <li><Link to="/features/uds-tracking" className="text-primary hover:underline">UDS Measure Tracking →</Link> — See how PDSA cycles connect to your UDS performance data</li>
            <li><Link to="/features/hrsa-audit-binder" className="text-primary hover:underline">HRSA Audit Binder Generator →</Link> — Export your PDSA documentation for site visits</li>
            <li><Link to="/features/spc-charts" className="text-primary hover:underline">SPC Charts for Healthcare →</Link> — Understand the statistical analysis behind your cycles</li>
          </ul>
        </div>
      </section>
    </PublicPageLayout>
  );
}
