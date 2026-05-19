import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { BarChart3, TrendingUp, Target, Bell, FileCheck, LineChart } from "lucide-react";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MeasureWise UDS Tracking",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description: "UDS clinical quality measure tracking software for Federally Qualified Health Centers. Monitor 20+ measures with real-time trends and gap-to-target analysis.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free 14-day trial" },
};

const features = [
  { icon: BarChart3, title: "20+ UDS Measures", description: "Track cervical cancer screening, diabetes HbA1c, hypertension control, depression screening, BMI assessment, and more — all the measures HRSA reviews during site visits." },
  { icon: TrendingUp, title: "Real-Time Trend Analysis", description: "See how each measure is trending month over month. Identify declining measures before they become audit findings." },
  { icon: Target, title: "Gap-to-Target Tracking", description: "Set targets for each measure and instantly see which ones are below goal. Weekly digest emails tell you exactly where to focus your QI efforts." },
  { icon: LineChart, title: "SPC Chart Integration", description: "Statistical Process Control charts distinguish real improvement from random variation. Know when a PDSA cycle actually moved the needle." },
  { icon: Bell, title: "Automated Alerts", description: "Get notified when a measure drops below target or shows a declining trend. Don't wait for your quarterly UDS pull to find problems." },
  { icon: FileCheck, title: "Audit-Ready Reports", description: "Generate UDS performance summaries formatted for HRSA site visit reviewers. One click, done." },
];

export default function FeatureUDSTracking() {
  return (
    <PublicPageLayout backTo={{ label: "Back to Home", href: "/" }}>
      <SEO
        title="UDS measure tracking software for FQHCs"
        description="A spreadsheet replacement for FQHC UDS measure tracking — real-time trends, gap-to-target analysis, SPC chart integration, and audit-ready exports for all 20+ UDS clinical quality measures."
        canonical="https://measurewise.org/features/uds-tracking"
        jsonLd={jsonLd}
      />

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4 text-primary" />
            Feature
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            UDS measure tracking software
            <br />
            <span className="text-primary">for FQHCs</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The spreadsheet you inherited can't tell you which UDS measure is sliding this month — it just shows last year's UDS report. MeasureWise replaces that spreadsheet with a live, trend-aware tracker for every UDS clinical quality measure, so you act on declining numbers before they end up in HRSA's report.
          </p>
        </div>
      </section>


      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">What you can track</h2>
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
          <h2 className="text-2xl font-bold text-foreground">Why UDS tracking matters for FQHCs</h2>
          <p>
            The Uniform Data System (UDS) is the primary reporting mechanism for HRSA-funded health centers. Every year, FQHCs submit UDS data covering clinical quality measures, patient demographics, financial performance, and staffing. Strong UDS performance leads to better HRSA operational site visit outcomes, higher grant funding, and eligibility for quality improvement awards.
          </p>
          <p>
            Most health centers track UDS measures quarterly — pulling data from their EHR, loading it into spreadsheets, and manually calculating rates. By the time the data is ready, it's already 2-3 months old. Quality improvement decisions based on stale data miss opportunities to course-correct.
          </p>
          <p>
            MeasureWise connects your UDS measure data to your active PDSA cycles, creating a live feedback loop. When your cervical cancer screening rate drops, you see it immediately — and you can link it to the PDSA cycle that's working to improve it. When that cycle succeeds, you see the measure rise. This is the connection between quality improvement work and measurable outcomes that HRSA wants to see.
          </p>
          <h3 className="text-xl font-semibold text-foreground mt-8">Supported UDS clinical quality measures</h3>
          <p>
            MeasureWise supports tracking for all major UDS clinical quality measures including: Cervical Cancer Screening (CMS124), Colorectal Cancer Screening (CMS130), Diabetes HbA1c Poor Control (CMS122), Controlling High Blood Pressure (CMS165), Depression Screening (CMS2), BMI Screening and Follow-Up (CMS69), Tobacco Screening and Cessation (CMS138), Prenatal and Postpartum Care, HIV Screening, and Dental Sealants for Children. Additional measures can be configured for your health center's specific needs.
          </p>
        </div>
      </section>

      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">Related resources</h2>
          <ul className="space-y-3">
            <li><Link to="/features/pdsa-cycle-manager" className="text-primary hover:underline">PDSA Cycle Manager →</Link> — Run improvement cycles linked to your UDS measures</li>
            <li><Link to="/features/spc-charts" className="text-primary hover:underline">SPC Charts →</Link> — Statistical analysis for each measure's performance</li>
            <li><Link to="/blog/uds-clinical-quality-measures-2026" className="text-primary hover:underline">UDS Clinical Quality Measures in 2026 →</Link> — What's changed this reporting year</li>
            <li><Link to="/features/hrsa-audit-binder" className="text-primary hover:underline">HRSA Audit Binder →</Link> — Export UDS performance data for site visits</li>
          </ul>
        </div>
      </section>
    </PublicPageLayout>
  );
}
