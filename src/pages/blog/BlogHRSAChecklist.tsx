import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PublicPageLayout } from "@/components/PublicPageLayout";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "HRSA Site Visit Checklist: What QI Directors Need to Prepare",
  datePublished: "2026-03-10",
  author: { "@type": "Person", name: "MeasureWise Team" },
  publisher: { "@type": "Organization", name: "MeasureWise" },
};

export default function BlogHRSAChecklist() {
  return (
    <PublicPageLayout backTo={{ label: "Back to Blog", href: "/blog" }}>
      <SEO
        title="HRSA Site Visit Checklist for QI Directors"
        description="Complete HRSA Operational Site Visit preparation checklist for FQHC quality directors. Organized by compliance chapter with practical tips for each requirement."
        canonical="https://measurewise.org/blog/hrsa-site-visit-checklist"
        type="article"
        article={{ publishedTime: "2026-03-10", author: "MeasureWise Team" }}
        jsonLd={jsonLd}
      />

      <article className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <header className="mb-12">
            <p className="text-sm text-muted-foreground mb-4">March 10, 2026 · 12 min read</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
              HRSA Site Visit Checklist: What QI Directors Need to Prepare
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              An HRSA Operational Site Visit (OSV) can feel overwhelming. This comprehensive checklist breaks down what your quality improvement team needs to have ready — organized by compliance chapter.
            </p>
          </header>

          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground leading-relaxed">
            <h2 className="text-2xl font-bold text-foreground">What is an HRSA Operational Site Visit?</h2>
            <p>
              Every 3-5 years, HRSA conducts an Operational Site Visit (OSV) at each Federally Qualified Health Center. The purpose is to evaluate compliance with the 19 Health Center Program requirements and identify areas for improvement. OSV outcomes directly affect your health center's funding, conditions of award, and operational standing.
            </p>
            <p>
              For Quality Improvement directors, the most relevant sections are Chapter 10 (Quality Improvement/Assurance) and parts of Chapter 4 (Required and Additional Services), Chapter 12 (Sliding Fee Discounts), and Chapter 19 (Board Authority). However, QI touches every chapter — reviewers want to see a culture of continuous improvement across the organization.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-10">Chapter 10: Quality Improvement/Assurance</h2>
            <p>This is your primary focus area. Reviewers will evaluate:</p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong className="text-foreground">Board-approved QI/QA plan:</strong> Is there a current, board-approved quality improvement and quality assurance plan? Does it cover clinical measures, patient satisfaction, and operational efficiency? Is it updated annually?
              </li>
              <li>
                <strong className="text-foreground">Documented PDSA cycles:</strong> Can you show at least 3-4 complete <Link to="/features/pdsa-cycle-manager" className="text-primary hover:underline">PDSA cycles</Link> with clear aim statements, baseline data, interventions, results, and decisions? Are they linked to specific clinical quality measures?
              </li>
              <li>
                <strong className="text-foreground">Clinical quality measure tracking:</strong> Are you monitoring <Link to="/features/uds-tracking" className="text-primary hover:underline">UDS clinical quality measures</Link> on a regular basis? Can you show trends over time? Do you have targets for each measure?
              </li>
              <li>
                <strong className="text-foreground">Data-driven decision making:</strong> Can you demonstrate that quality improvement decisions are based on data analysis? <Link to="/features/spc-charts" className="text-primary hover:underline">SPC charts</Link> are excellent evidence of this.
              </li>
              <li>
                <strong className="text-foreground">Staff involvement:</strong> Is QI work distributed across clinical and administrative staff? Are there assigned responsibilities with accountability tracking?
              </li>
              <li>
                <strong className="text-foreground">Board reporting:</strong> Does the board receive regular QI reports? Are board meeting minutes showing discussion and action on quality metrics?
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-foreground mt-10">Pre-visit preparation timeline</h2>
            <p>When you receive your OSV notification (typically 60-90 days before the visit):</p>

            <h3 className="text-xl font-semibold text-foreground mt-6">Immediately (Day 1-7)</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Review the site visit notification letter for specific focus areas</li>
              <li>Assign a preparation lead for each compliance chapter</li>
              <li>Inventory your existing documentation — what do you have, what's missing?</li>
              <li>Schedule preparation meetings with department leads</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">Weeks 2-4: Documentation assembly</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Compile PDSA cycle documentation with supporting data</li>
              <li>Generate UDS measure trend reports for the past 2-3 years</li>
              <li>Gather board meeting minutes showing QI discussion</li>
              <li>Prepare staff training records related to quality improvement</li>
              <li>Document your QI committee structure, meeting schedules, and membership</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">Weeks 4-8: Review and organize</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Organize all evidence into a structured binder (or <Link to="/features/hrsa-audit-binder" className="text-primary hover:underline">generate one automatically</Link>)</li>
              <li>Conduct a mock review with your QI committee</li>
              <li>Identify and address any documentation gaps</li>
              <li>Prepare talking points for key staff who will interact with reviewers</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">Final week: Logistics</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Confirm reviewer schedule and site logistics</li>
              <li>Brief all staff on the visit schedule and expectations</li>
              <li>Place reference binders in the review room</li>
              <li>Do a final walk-through of the facility</li>
            </ul>

            <h2 className="text-2xl font-bold text-foreground mt-10">Common findings to avoid</h2>
            <p>Based on published HRSA site visit data, the most common Chapter 10 findings include:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">No documented QI/QA plan</strong> — or a plan that hasn't been updated in years</li>
              <li><strong className="text-foreground">PDSA cycles without data</strong> — interventions were described but not measured</li>
              <li><strong className="text-foreground">Measures tracked without improvement action</strong> — data was collected but no cycles were run on underperforming measures</li>
              <li><strong className="text-foreground">No board involvement</strong> — QI work happened but the board wasn't informed or didn't take action</li>
              <li><strong className="text-foreground">Incomplete documentation</strong> — cycles started but not completed, or missing key phases</li>
            </ul>

            <div className="mt-12 p-6 bg-muted rounded-lg border border-border">
              <p className="font-semibold text-foreground mb-2">Be audit-ready every day</p>
              <p>
                MeasureWise captures your QI evidence as you work — so when HRSA calls, your <Link to="/features/hrsa-audit-binder" className="text-primary hover:underline">audit binder</Link> is already built. <Link to="/auth?signup=true" className="text-primary hover:underline font-semibold">Start 14-day free trial →</Link>
              </p>
            </div>
          </div>
        </div>
      </article>
    </PublicPageLayout>
  );
}
