import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PublicPageLayout } from "@/components/PublicPageLayout";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How to Run Effective PDSA Cycles at Your FQHC",
  datePublished: "2026-04-15",
  author: { "@type": "Person", name: "MeasureWise Team" },
  publisher: { "@type": "Organization", name: "MeasureWise" },
  description: "A step-by-step guide to Plan-Do-Study-Act cycles for Federally Qualified Health Centers.",
};

export default function BlogPDSAGuide() {
  return (
    <PublicPageLayout backTo={{ label: "Back to Blog", href: "/blog" }}>
      <SEO
        title="How to Run PDSA Cycles at Your FQHC — Step-by-Step Guide"
        description="A practical guide to Plan-Do-Study-Act cycles for FQHC quality teams. Learn aim statements, small tests of change, data collection, and scaling interventions."
        canonical="https://measurewise.org/blog/pdsa-cycle-fqhc-guide"
        type="article"
        article={{ publishedTime: "2026-04-15", author: "MeasureWise Team" }}
        jsonLd={jsonLd}
      />

      <article className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <header className="mb-12">
            <p className="text-sm text-muted-foreground mb-4">April 15, 2026 · 8 min read</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
              How to Run Effective PDSA Cycles at Your FQHC
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The Plan-Do-Study-Act cycle is the engine of quality improvement at Federally Qualified Health Centers. But running effective cycles requires more than filling out a template. Here's how to make your PDSA work actually move your UDS measures.
            </p>
          </header>

          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground leading-relaxed">
            <h2 className="text-2xl font-bold text-foreground">What is a PDSA cycle?</h2>
            <p>
              The PDSA cycle — Plan, Do, Study, Act — is a structured method for testing and implementing changes in healthcare settings. Developed by W. Edwards Deming and adapted for healthcare by the Institute for Healthcare Improvement (IHI), it's the most widely used quality improvement methodology in Federally Qualified Health Centers.
            </p>
            <p>
              HRSA expects health centers to demonstrate the use of PDSA cycles as part of their Quality Improvement/Quality Assurance (QI/QA) program. During Operational Site Visits, reviewers look for documented cycles that show a clear connection between improvement activities and clinical outcomes.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-10">Step 1: Write a clear aim statement</h2>
            <p>
              Every PDSA cycle starts with an aim statement that answers three questions: What are you trying to accomplish? How will you know a change is an improvement? What changes can you make that will result in improvement?
            </p>
            <p>
              A good aim statement for an FQHC might be: "Increase our cervical cancer screening rate (CMS124) from 42% to 55% among female patients aged 21-64 by June 30, 2026, by implementing standing orders for Pap smears during annual wellness visits."
            </p>
            <p>
              Notice the specifics: a named UDS measure, a baseline value, a target, a timeframe, and a brief description of the intervention. Vague aim statements like "improve screening" are the most common reason PDSA cycles fail to produce results.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-10">Step 2: Plan a small test of change</h2>
            <p>
              The key insight of the PDSA methodology is that you should test changes on a small scale before rolling them out. This is where many FQHC teams struggle — they want to implement a change clinic-wide immediately.
            </p>
            <p>
              Instead, start small. Test your standing orders for Pap smears with one provider, one day a week, for two weeks. This lets you identify problems (Are the standing orders clear? Does the workflow disrupt visit flow? Do patients accept the screening?) before investing in a full rollout.
            </p>
            <p>
              During planning, document: who will do what, when, where, and what data you'll collect. Assign specific staff members to specific tasks with deadlines. Quality improvement doesn't happen unless someone is accountable.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-10">Step 3: Do — run the test and collect data</h2>
            <p>
              Execute the test as planned, but document everything — including deviations. If the provider skipped the standing orders on Tuesday because of a schedule conflict, that's important data. If patients refused screening more often than expected, note the reasons.
            </p>
            <p>
              Collect quantitative data (how many patients were eligible, how many were screened) and qualitative data (what did staff observe, what did patients say). Both types inform the Study phase.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-10">Step 4: Study — analyze what happened</h2>
            <p>
              Compare your results to your prediction. Did the screening rate increase? By how much? Was the change consistent across the test period, or was there variation? Use a <Link to="/features/spc-charts" className="text-primary hover:underline">Statistical Process Control chart</Link> to determine whether the change produced a statistically significant improvement.
            </p>
            <p>
              This is where many teams stop too early. Running a test for one week with 10 patients doesn't give you enough data to draw conclusions. Plan your test duration to generate at least 15-20 data points before analyzing trends.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-10">Step 5: Act — decide what's next</h2>
            <p>
              Based on your Study results, choose one of three options: <strong className="text-foreground">Adopt</strong> the change (it worked — scale it up), <strong className="text-foreground">Adapt</strong> it (it partially worked — modify and test again), or <strong className="text-foreground">Abandon</strong> it (it didn't work — try a different intervention).
            </p>
            <p>
              Document your decision and rationale clearly. If you're adapting, describe what you'll change and why. If you're abandoning, explain what you learned that will inform your next cycle. This documentation creates the chain of learning that HRSA reviewers want to see.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-10">Linking PDSA cycles to UDS measures</h2>
            <p>
              The most common mistake FQHCs make with PDSA cycles is running them in isolation — disconnected from the UDS measures they're supposed to improve. Every PDSA cycle should explicitly link to one or more UDS clinical quality measures, and you should be tracking those measures in real time to see the impact.
            </p>
            <p>
              <Link to="/features/uds-tracking" className="text-primary hover:underline">MeasureWise's UDS tracking</Link> connects your PDSA cycles directly to your measure data, so when a cycle succeeds, you can see the measure move. This is the connection between quality improvement work and measurable outcomes that makes FQHC QI programs credible to HRSA.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-10">Common PDSA mistakes to avoid</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Testing too big:</strong> Start with one provider, one day, one week. Scale up in subsequent cycles.</li>
              <li><strong className="text-foreground">Skipping the prediction:</strong> Making a prediction before the test forces you to think critically about what you expect to happen and why.</li>
              <li><strong className="text-foreground">Not collecting data:</strong> Without data, the Study phase is just opinion. Define your measures before the test begins.</li>
              <li><strong className="text-foreground">Stopping after one cycle:</strong> Real improvement comes from rapid, iterative cycling. Plan to run 3-5 cycles on the same measure.</li>
              <li><strong className="text-foreground">Not documenting:</strong> If it's not documented, it didn't happen — at least as far as HRSA is concerned.</li>
            </ul>

            <div className="mt-12 p-6 bg-muted rounded-lg border border-border">
              <p className="font-semibold text-foreground mb-2">Ready to run your first PDSA cycle?</p>
              <p>
                <Link to="/features/pdsa-cycle-manager" className="text-primary hover:underline">MeasureWise's PDSA Cycle Manager</Link> guides your team through each phase with templates, coaching prompts, and automatic UDS measure linking. <Link to="/auth?signup=true" className="text-primary hover:underline font-semibold">Start your free trial →</Link>
              </p>
            </div>
          </div>
        </div>
      </article>
    </PublicPageLayout>
  );
}
