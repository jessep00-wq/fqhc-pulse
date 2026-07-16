import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { LineChart, TrendingUp, AlertTriangle, BarChart3, Sigma, Eye } from "lucide-react";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MeasureWise SPC Charts",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description: "Statistical Process Control charts for healthcare quality improvement. Distinguish real improvement from random variation in your FQHC's clinical measures.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free 14-day trial" },
};

const features = [
  { icon: LineChart, title: "Auto-Generated Charts", description: "SPC charts generate automatically from your UDS measure data. No manual data entry, no Excel formulas, no statistics degree required." },
  { icon: TrendingUp, title: "Trend Detection", description: "MeasureWise flags runs, shifts, and trends using Western Electric rules. Know when your improvement is real — not random noise." },
  { icon: AlertTriangle, title: "Out-of-Control Signals", description: "Points outside control limits are highlighted automatically. See at a glance when a measure needs immediate attention." },
  { icon: Sigma, title: "Control Limits Calculated", description: "Upper and lower control limits (UCL/LCL) are calculated using standard SPC formulas. Center line, ±1σ, ±2σ, and ±3σ are all displayed." },
  { icon: BarChart3, title: "Before/After Comparison", description: "Split your SPC chart at the intervention point to see separate control limits for pre- and post-intervention periods. This is what HRSA reviewers want to see." },
  { icon: Eye, title: "Board-Ready Visuals", description: "Export SPC charts as images for board presentations. Clean, professional, and annotated with measure names and date ranges." },
];

export default function FeatureSPCCharts() {
  return (
    <PublicPageLayout backTo={{ label: "Back to Home", href: "/" }}>
      <SEO
        title="SPC charts for UDS measure tracking"
        description="Statistical Process Control charts built for FQHC UDS measures. Automatic control limits, before/after intervention splits, and trend detection on diabetes A1c, hypertension, depression screening, and the rest of your UDS line items."
        canonical="https://measurewise.org/features/spc-charts"
        jsonLd={jsonLd}
      />

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            <LineChart className="h-4 w-4 text-primary" />
            Feature
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            SPC charts for
            <br />
            <span className="text-primary">UDS measure tracking</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Did the intervention actually move the UDS measure, or was it random month-to-month noise? MeasureWise auto-generates Statistical Process Control charts on every UDS line item — diabetes A1c, hypertension, depression screening, cervical cancer screening — so your QI committee can answer that question with a chart, not a hunch.
          </p>
        </div>
      </section>


      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">SPC made simple for healthcare</h2>
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
          <h2 className="text-2xl font-bold text-foreground">Why SPC matters for quality improvement</h2>
          <p>
            Statistical Process Control has been used in manufacturing since the 1920s, but it's increasingly recognized as essential for healthcare quality improvement. The Institute for Healthcare Improvement (IHI) recommends SPC charts as the primary tool for distinguishing common cause variation (normal fluctuation) from special cause variation (real change).
          </p>
          <p>
            Without SPC, quality teams often make one of two mistakes: they celebrate random improvement as if it were real, or they panic about a random decline and launch unnecessary interventions. Both waste time and resources. SPC charts give you the statistical foundation to make confident decisions about your improvement work.
          </p>
          <p>
            For FQHCs specifically, SPC charts serve a dual purpose. First, they help your internal QI team make better decisions about which interventions to adopt, adapt, or abandon. Second, they provide the kind of rigorous, data-driven evidence that HRSA reviewers want to see during Operational Site Visits. A well-annotated SPC chart showing a statistically significant improvement linked to a documented PDSA cycle is exactly the evidence of "data-driven quality improvement" that Chapter 10 requires.
          </p>
          <h3 className="text-xl font-semibold text-foreground mt-8">How MeasureWise calculates SPC</h3>
          <p>
            MeasureWise uses standard X-bar and p-chart formulas depending on the measure type. For rate-based measures (like screening percentages), p-charts are used. For continuous measures, X-bar charts are generated. Control limits are calculated at ±3 standard deviations from the center line using a minimum of 12 data points. The system automatically applies Nelson rules to detect trends, runs, and out-of-control conditions.
          </p>
        </div>
      </section>

      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">Related resources</h2>
          <ul className="space-y-3">
            <li><Link to="/features/uds-tracking" className="text-primary hover:underline">UDS Tracking →</Link> — The measure data that feeds your SPC charts</li>
            <li><Link to="/features/pdsa-cycle-manager" className="text-primary hover:underline">PDSA Cycle Manager →</Link> — Link interventions to chart annotations</li>
            <li><Link to="/features/hrsa-audit-binder" className="text-primary hover:underline">HRSA Audit Binder →</Link> — Include SPC charts in your site visit documentation</li>
          </ul>
        </div>
      </section>
    </PublicPageLayout>
  );
}
