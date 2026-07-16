import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { FileCheck, Download, FolderOpen, Clock, Shield, Printer } from "lucide-react";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MeasureWise HRSA Audit Binder Generator",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description: "Generate print-ready HRSA site visit audit binders with one click. Includes PDSA cycle logs, UDS measure trends, staff task evidence, and compliance documentation.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free 14-day trial" },
};

const features = [
  { icon: Download, title: "One-Click PDF Export", description: "Generate a complete, paginated audit binder PDF in seconds. No more assembling binders from scattered files the week before a site visit." },
  { icon: FolderOpen, title: "Organized by HRSA Chapter", description: "Evidence is automatically organized by HRSA Compliance Manual chapters — Chapter 10 (Quality Improvement), Chapter 19 (Board Authority), and more." },
  { icon: FileCheck, title: "PDSA Cycle Documentation", description: "Every PDSA cycle generates structured documentation: aim statement, baseline data, intervention description, results, SPC chart, and decision rationale." },
  { icon: Clock, title: "Timestamped Audit Trail", description: "Every action — cycle creation, task completion, measure update — is timestamped and attributed to a specific staff member. Auditors see a clear chain of accountability." },
  { icon: Shield, title: "Compliance Gap Analysis", description: "Before your site visit, run a gap analysis to see which HRSA requirements have documented evidence and which need attention." },
  { icon: Printer, title: "Print-Ready Formatting", description: "Professional formatting with headers, page numbers, table of contents, and appendices. Looks like it was prepared by a compliance consultant." },
];

export default function FeatureHRSAAuditBinder() {
  return (
    <PublicPageLayout backTo={{ label: "Back to Home", href: "/" }}>
      <SEO
        title="HRSA audit binder generator for FQHC quality improvement"
        description="Generate an HRSA Operational Site Visit-ready audit binder for your FQHC in one click. Includes UDS-aligned PDSA evidence, SPC trends, QI committee minutes, and Chapter 10 documentation — no last-minute scramble."
        canonical="https://measurewise.org/features/hrsa-audit-binder"
        jsonLd={jsonLd}
      />

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            <FileCheck className="h-4 w-4 text-primary" />
            Feature
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            HRSA audit binder generator for
            <br />
            <span className="text-primary">FQHC quality improvement</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            HRSA Operational Site Visits demand a documented trail of UDS-aligned PDSA cycles, SPC analysis, and QI committee action. Most FQHC Quality Directors spend two to four weeks assembling that binder by hand. MeasureWise generates it in seconds because the evidence is captured as you work — not retro-fitted the week before the OSV.
          </p>
        </div>
      </section>


      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">What's in the binder</h2>
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
          <h2 className="text-2xl font-bold text-foreground">Why site visit preparation is so painful</h2>
          <p>
            Every 3-5 years, HRSA sends a team to conduct an Operational Site Visit (OSV) at your health center. The reviewers evaluate your compliance with 19 program requirements covering governance, clinical operations, financial management, and — critically — quality improvement and assurance.
          </p>
          <p>
            For Chapter 10 (Quality Improvement/Assurance), reviewers want to see documented PDSA cycles, board-approved QI/QA plans, evidence of data-driven decision making, and a clear connection between your improvement activities and your clinical outcomes. Most health centers maintain this evidence in a combination of Word documents, Excel spreadsheets, EHR screenshots, and physical binders.
          </p>
          <p>
            When a site visit is announced, the QI director typically spends 2-4 weeks frantically assembling documentation from these scattered sources. Missing evidence means findings. Findings mean corrective action plans. Corrective action plans mean more work and potential funding implications.
          </p>
          <h3 className="text-xl font-semibold text-foreground mt-8">How MeasureWise solves this</h3>
          <p>
            Because MeasureWise captures your QI activities as you do them — PDSA cycles, task assignments, measure tracking, board reports — the audit binder generates itself. Every cycle, every task, every data point is already structured, timestamped, and attributed. When HRSA calls, you click "Generate Binder" and walk into your site visit with confidence.
          </p>
        </div>
      </section>

      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">Related resources</h2>
          <ul className="space-y-3">
            <li><Link to="/features/pdsa-cycle-manager" className="text-primary hover:underline">PDSA Cycle Manager →</Link> — The cycles that populate your audit binder</li>
            <li><Link to="/features/uds-tracking" className="text-primary hover:underline">UDS Tracking →</Link> — Measure data included in binder reports</li>
            <li><Link to="/features/pcmh-evidence" className="text-primary hover:underline">PCMH Evidence Collection →</Link> — Similar export for NCQA recertification</li>
          </ul>
        </div>
      </section>
    </PublicPageLayout>
  );
}
