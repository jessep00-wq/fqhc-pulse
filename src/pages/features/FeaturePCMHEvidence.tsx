import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { ClipboardCheck, FolderOpen, FileCheck, CalendarCheck, Shield, Layers } from "lucide-react";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MeasureWise PCMH Evidence Collection",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description: "Automated PCMH Q-PASS evidence collection for health centers. Map QI activities to NCQA standards and generate recertification binders with one click.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free 14-day trial" },
};

const features = [
  { icon: ClipboardCheck, title: "Q-PASS Standards Mapping", description: "Every PDSA cycle and QI activity automatically maps to relevant NCQA Q-PASS evidence requirements. See which standards are covered and which have gaps." },
  { icon: FolderOpen, title: "Evidence Organized by Domain", description: "Documentation is categorized by PCMH concept areas: Team-Based Care, Population Health Management, Care Coordination, and Quality Improvement." },
  { icon: FileCheck, title: "One-Click Recertification Binder", description: "Generate a complete evidence package for NCQA PCMH recertification. Every document organized, labeled, and cross-referenced to the relevant standard." },
  { icon: CalendarCheck, title: "Year-Round Readiness Dashboard", description: "See your PCMH readiness at a glance: which standards have current evidence, which need updates, and which have upcoming deadlines." },
  { icon: Shield, title: "Compliance Gap Alerts", description: "Get notified when evidence is aging out or when new Q-PASS requirements need documentation. Never be caught off-guard by recertification." },
  { icon: Layers, title: "Dual Compliance", description: "Many evidence items satisfy both HRSA and NCQA requirements. MeasureWise tracks this overlap so you can document once and satisfy both." },
];

export default function FeaturePCMHEvidence() {
  return (
    <PublicPageLayout backTo={{ label: "Back to Home", href: "/" }}>
      <SEO
        title="PCMH Recertification Evidence Collection"
        description="Automated PCMH Q-PASS evidence collection for health centers. Map QI activities to NCQA standards and generate recertification binders automatically."
        canonical="https://measurewise.org/features/pcmh-evidence"
        jsonLd={jsonLd}
      />

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            Feature
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            PCMH Q-PASS Evidence Collection,
            <br />
            <span className="text-primary">Automated</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            NCQA PCMH recertification requires evidence across dozens of Q-PASS standards. MeasureWise collects that evidence as part of your daily QI workflow — so you're always audit-ready, not scrambling before your recertification window.
          </p>
        </div>
      </section>

      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Evidence collection on autopilot</h2>
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
        <div className="max-w-3xl mx-auto space-y-6 text-muted-foreground leading-relaxed">
          <h2 className="text-2xl font-bold text-foreground">The PCMH recertification challenge</h2>
          <p>
            NCQA's Patient-Centered Medical Home (PCMH) recognition is the gold standard for primary care transformation. For FQHCs, PCMH recognition demonstrates commitment to patient-centered care, supports grant applications, and can unlock higher reimbursement rates from payers.
          </p>
          <p>
            But maintaining PCMH recognition requires ongoing evidence collection. The Q-PASS (Quality-Pathways for Self-Assessment and Submission) framework requires documentation across six concept areas: Team-Based Care and Practice Organization, Knowing and Managing Your Patients, Patient-Centered Access and Continuity, Care Management and Support, Care Coordination and Care Transitions, and Performance Measurement and Quality Improvement.
          </p>
          <p>
            Most PCMH coordinators maintain evidence in shared drives, binders, and spreadsheets. When recertification comes due (every 3 years), they spend weeks gathering, organizing, and cross-referencing documentation. Evidence gaps discovered at this stage create stress and risk.
          </p>
          <h3 className="text-xl font-semibold text-foreground mt-8">How MeasureWise helps</h3>
          <p>
            Because MeasureWise already captures your PDSA cycles, quality activities, and measure tracking as structured data, it can automatically map this evidence to Q-PASS standards. Your daily QI work generates the documentation NCQA needs to see. The readiness dashboard shows your evidence status in real time — no quarterly scrambles, no last-minute gaps.
          </p>
        </div>
      </section>

      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">Related resources</h2>
          <ul className="space-y-3">
            <li><Link to="/for/pcmh-coordinators" className="text-primary hover:underline">For PCMH Coordinators →</Link> — See how MeasureWise supports your role</li>
            <li><Link to="/features/hrsa-audit-binder" className="text-primary hover:underline">HRSA Audit Binder →</Link> — Similar export for HRSA site visits</li>
            <li><Link to="/features/pdsa-cycle-manager" className="text-primary hover:underline">PDSA Cycle Manager →</Link> — The cycles that generate your PCMH evidence</li>
            <li><Link to="/blog/quality-improvement-fqhc-staff" className="text-primary hover:underline">Quality Improvement Guide →</Link> — Build a QI culture that supports PCMH</li>
          </ul>
        </div>
      </section>
    </PublicPageLayout>
  );
}
