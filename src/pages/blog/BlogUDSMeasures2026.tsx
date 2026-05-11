import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PublicPageLayout } from "@/components/PublicPageLayout";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "UDS Clinical Quality Measures in 2026: What's Changed",
  datePublished: "2026-03-28",
  author: { "@type": "Person", name: "MeasureWise Team" },
  publisher: { "@type": "Organization", name: "MeasureWise" },
};

export default function BlogUDSMeasures2026() {
  return (
    <PublicPageLayout backTo={{ label: "Back to Blog", href: "/blog" }}>
      <SEO
        title="UDS Clinical Quality Measures 2026 — What's Changed"
        description="Complete guide to 2026 UDS reporting requirements for FQHCs. Updated measures, new additions, retired measures, and what quality teams need to know."
        canonical="https://measurewise.org/blog/uds-clinical-quality-measures-2026"
        type="article"
        article={{ publishedTime: "2026-03-28", author: "MeasureWise Team" }}
        jsonLd={jsonLd}
      />

      <article className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <header className="mb-12">
            <p className="text-sm text-muted-foreground mb-4">March 28, 2026 · 10 min read</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
              UDS Clinical Quality Measures in 2026: What's Changed
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Every year, HRSA updates the Uniform Data System reporting requirements for Federally Qualified Health Centers. Here's what quality teams need to know for the 2026 reporting cycle.
            </p>
          </header>

          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground leading-relaxed">
            <h2 className="text-2xl font-bold text-foreground">Understanding the UDS</h2>
            <p>
              The Uniform Data System (UDS) is the standardized reporting system used by HRSA to collect data from all Health Center Program grantees and look-alikes. UDS data covers patient demographics, services provided, clinical quality measures, staffing, costs, and revenue. For FQHCs, strong UDS performance is directly tied to continued funding, grant renewals, and eligibility for quality improvement awards.
            </p>
            <p>
              The clinical quality measures in UDS are primarily drawn from CMS (Centers for Medicare & Medicaid Services) electronic Clinical Quality Measures (eCQMs). These measures align with national quality priorities and are updated periodically to reflect current evidence and clinical guidelines.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-10">Core clinical quality measures</h2>
            <p>
              The 2026 UDS reporting cycle maintains the core set of clinical quality measures that FQHCs have been tracking. These include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Cervical Cancer Screening (CMS124):</strong> Percentage of women aged 21-64 who were screened for cervical cancer</li>
              <li><strong className="text-foreground">Colorectal Cancer Screening (CMS130):</strong> Percentage of adults aged 45-75 who had appropriate colorectal cancer screening</li>
              <li><strong className="text-foreground">Diabetes: HbA1c Poor Control (CMS122):</strong> Percentage of patients with diabetes aged 18-75 whose most recent HbA1c was greater than 9% (lower is better)</li>
              <li><strong className="text-foreground">Controlling High Blood Pressure (CMS165):</strong> Percentage of patients aged 18-85 with hypertension whose blood pressure was adequately controlled</li>
              <li><strong className="text-foreground">Screening for Depression (CMS2):</strong> Percentage of patients aged 12 and older screened for depression with a follow-up plan</li>
              <li><strong className="text-foreground">Body Mass Index Screening (CMS69):</strong> Percentage of patients aged 18 and older with BMI documented and follow-up plan</li>
              <li><strong className="text-foreground">Tobacco Screening and Cessation (CMS138):</strong> Percentage of patients aged 18 and older screened for tobacco use with cessation intervention if applicable</li>
              <li><strong className="text-foreground">HIV Screening (CMS349):</strong> Percentage of patients aged 15-65 screened for HIV</li>
            </ul>

            <h2 className="text-2xl font-bold text-foreground mt-10">What's changed in 2026</h2>
            <p>
              HRSA has made several updates to the UDS clinical quality measure specifications for the 2026 reporting year. Key changes include updated age ranges for some screening measures, revised denominator exclusion criteria, and alignment with updated clinical practice guidelines.
            </p>
            <p>
              Quality teams should review the updated measure specifications carefully and ensure their EHR reporting configurations match. Discrepancies between EHR configuration and UDS specifications are one of the most common sources of inaccurate UDS data.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-10">How to prepare your quality team</h2>
            <p>
              Start by reviewing your current measure performance against the updated specifications. Identify any measures where the specification changes might affect your numerator or denominator calculations. Then prioritize your <Link to="/features/pdsa-cycle-manager" className="text-primary hover:underline">PDSA cycles</Link> based on the measures with the largest gap to target.
            </p>
            <p>
              <Link to="/features/uds-tracking" className="text-primary hover:underline">MeasureWise's UDS tracking</Link> automatically incorporates updated measure specifications and shows your performance against current benchmarks. This eliminates the manual work of updating spreadsheet formulas every reporting year.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-10">Benchmarking against peers</h2>
            <p>
              HRSA publishes national UDS data that allows health centers to benchmark their performance against peers. Understanding where your health center falls relative to national averages and top performers helps prioritize quality improvement efforts. Focus your resources on measures where you're below the national mean and where improvement has the greatest clinical impact.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-10">Timeline for 2026 reporting</h2>
            <p>
              UDS data for calendar year 2026 is due to HRSA in February 2027. However, waiting until January to start preparing your submission is a recipe for stress and errors. Build UDS preparation into your monthly QI workflow:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Monthly:</strong> Review measure trends and address data quality issues</li>
              <li><strong className="text-foreground">Quarterly:</strong> Run preliminary UDS reports and compare to targets</li>
              <li><strong className="text-foreground">October:</strong> Begin final data validation and cleanup</li>
              <li><strong className="text-foreground">January:</strong> Finalize submission with clean, validated data</li>
            </ul>

            <div className="mt-12 p-6 bg-muted rounded-lg border border-border">
              <p className="font-semibold text-foreground mb-2">Track your UDS measures year-round</p>
              <p>
                Stop relying on quarterly spreadsheet pulls. <Link to="/features/uds-tracking" className="text-primary hover:underline">MeasureWise tracks 20+ UDS measures</Link> in real time with gap-to-target analysis and automated alerts. <Link to="/auth?signup=true" className="text-primary hover:underline font-semibold">Start 14-day free trial →</Link>
              </p>
            </div>
          </div>
        </div>
      </article>
    </PublicPageLayout>
  );
}
