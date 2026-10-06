import { Link, useNavigate } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { BRAND } from "@/lib/brand";
import { useEffect } from "react";
import { parseAuthLink } from "@/lib/authLinkParams";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { SECURITY_BULLETS, DATA_SCOPE_STATEMENT, CATEGORY_LINE } from "@/lib/siteContent";
import { ArrowRight, CheckCircle, X, FileText, FlaskConical, FolderCheck, Shield } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import pdsaTemplate from "@/assets/pdsa-cycle-record.pdf.asset.json";

const STEPS = [
  {
    icon: FileText,
    title: "Document the intervention",
    body: "Record the measure, the baseline, what you are changing, and who owns the work.",
  },
  {
    icon: FlaskConical,
    title: "Study and Act",
    body: "Compare the result to baseline on an SPC chart. Record whether you adopt, adapt, or abandon, and who decided.",
  },
  {
    icon: FolderCheck,
    title: "Keep the evidence",
    body: "Tasks, files, decisions, and history stay with the cycle. Export it for QI committee, board review, or site-visit preparation.",
  },
];

const DOES = [
  "Guided PDSA cycles",
  "Monthly measure tracking",
  "SPC charts",
  "Task evidence and ownership",
  "QI committee and board reporting",
  "Audit-binder export",
];

const DOES_NOT = [
  "Connect to your EHR or Azara",
  "Calculate or submit UDS data",
  "Accept protected health information (PHI)",
];

const MEASURE_PILLS = ["CMS130", "CMS122", "CMS165", "CMS124", "CMS2", "CMS117", "Prenatal care"];

const STACK = [
  { layer: "Clinical layer", title: "Your EHR", body: "Where care is documented. MeasureWise never connects to it." },
  { layer: "Reporting layer", title: "Your reporting tools", body: "Where rates, gap lists, and provider performance come from." },
  { layer: "Action layer", title: "MeasureWise", body: "Where you test changes, assign the work, decide, and keep the evidence." },
];

const ROLES = [
  {
    id: "qi",
    label: "QI Director",
    points: ["See every open cycle across sites", "Know who owns each change and what is overdue", "Pull a board or committee report without rebuilding it"],
  },
  {
    id: "pcmh",
    label: "PCMH Coordinator",
    points: ["Dated evidence of improvement work", "Decisions and history kept with each cycle", "Export records for recognition preparation"],
  },
  {
    id: "ops",
    label: "Ops / Medical Director",
    points: ["Clear owners for every intervention", "Study results on an SPC chart, not a hunch", "Sign off on adopt, adapt, or abandon"],
  },
];

const FAQ = [
  { q: "Do we need a BAA or IT review?", a: "MeasureWise does not accept protected health information and does not offer a BAA. You enter monthly aggregate measure values only. Follow your own organization's review process." },
  { q: "Does it connect to our EHR or Azara?", a: "No. You enter values from the reports you already run. There is nothing to install or integrate." },
  { q: "Does it calculate or submit UDS?", a: "No. MeasureWise manages the improvement work on your measures. Your UDS reporting stays where it is." },
  { q: "Can our QI committee use it?", a: "Yes. Cycles, decisions, and history can be exported for QI committee and board review." },
  { q: "Is there a free trial?", a: "Yes. Every paid plan starts with a 14-day free trial." },
];

const SPREADSHEET = [
  "Several versions of the same tracker in email",
  "No record of who decided what, or when",
  "Run charts rebuilt by hand",
  "A scramble to pull evidence before board or site visits",
];

const WITH_MW = [
  "One record per cycle, with history",
  "Named owners and due dates on every task",
  "SPC charts from your monthly values",
  "Export for QI committee, board, or site-visit preparation",
];

function RecordRow({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="font-medium text-foreground">{v}</dd>
    </div>
  );
}

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MeasureWise",
  url: BRAND.url,
};

export default function Landing() {
  const navigate = useNavigate();

  // Route Supabase auth links that land on "/" to the right page.
  useEffect(() => {
    const intent = parseAuthLink(window.location.href);
    if (!intent) return;
    const { hash, search } = window.location;
    if (intent.kind === "error") {
      navigate(
        `/auth?authError=${encodeURIComponent(intent.code)}&authErrorDescription=${encodeURIComponent(intent.description)}`,
        { replace: true },
      );
      return;
    }
    const target = intent.kind === "recovery" ? "/reset-password" : "/auth";
    navigate(`${target}${search}${hash}`, { replace: true });
  }, [navigate]);

  const Ctas = () => (
    <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
      <Button size="lg" asChild>
        <Link to="/contact?topic=measure-rescue">
          Book a 15-minute Measure Rescue call <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
      <Button size="lg" variant="outline" asChild>
        <a href={pdsaTemplate.url} download="MeasureWise_PDSA_Cycle_Record.pdf">Get the free PDSA Study Template</a>
      </Button>
    </div>
  );

  return (
    <PublicPageLayout>
      <SEO
        title="MeasureWise | PDSA and QI Evidence Management for FQHCs"
        description="Document the intervention, assign the work, study whether it moved the measure, and keep the evidence for QI committee, board review, and HRSA preparation."
        canonical={`${BRAND.url}/`}
        jsonLd={[orgJsonLd]}
      />

      {/* Hero */}
      <section className="py-20 md:py-24 px-6">
        <div className="max-w-4xl mx-auto space-y-7 text-center lg:text-left">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wide">
            {CATEGORY_LINE}
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            "We have quality work happening everywhere, and I cannot produce one clean record showing
            what we tried, who owned it, whether it worked, and what we decided."
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Your reporting tools tell you where performance sits. MeasureWise is where you manage what
            happens next. The rate, the gap list, and the providers off pace are useful. They are not a
            quality program. MeasureWise is where you document the intervention, assign the work, study
            whether it moved the measure, record the decision, and keep the evidence for QI committee,
            board review, and HRSA preparation.
          </p>
          <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground">
            {DATA_SCOPE_STATEMENT}
          </p>
          <Ctas />
          <ul className="flex flex-wrap gap-2 justify-center lg:justify-start pt-2" aria-label="Example measures teams track">
            {MEASURE_PILLS.map((m) => (
              <li key={m} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">
                {m}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Clean record preview */}
      <section className="py-16 px-6 bg-muted/30" aria-labelledby="record-heading">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <h2 id="record-heading" className="text-3xl font-bold text-foreground">One clean record per cycle</h2>
            <p className="text-muted-foreground leading-relaxed">
              The measure, the baseline, the change you tested, who owned it, what the data showed, and what you
              decided. All in one place, with dates and history.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-foreground">PDSA cycle: FIT kit pre-ordering</p>
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                Illustrative example, not customer data
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <RecordRow k="Measure" v="CMS130 Colorectal screening" />
              <RecordRow k="Owner" v="MA Team Lead" />
              <RecordRow k="Baseline" v="41%" />
              <RecordRow k="30-day value" v="46%" />
            </dl>
            <svg viewBox="0 0 300 80" className="w-full h-20" role="img" aria-label="Run chart rising after the change">
              <line x1="0" y1="50" x2="300" y2="50" className="stroke-muted-foreground" strokeDasharray="4 4" strokeWidth="1" />
              <polyline
                fill="none"
                className="stroke-primary"
                strokeWidth="2.5"
                points="10,56 50,52 90,58 130,54 170,55 210,40 250,34 290,30"
              />
            </svg>
            <div className="flex items-center gap-2 text-sm">
              <span className="rounded-md bg-primary px-2 py-0.5 font-medium text-primary-foreground">Adapt</span>
              <span className="text-muted-foreground">Signed off by QI Director</span>
            </div>
          </div>
        </div>
      </section>

      {/* Simulator teaser */}
      <section className="py-16 px-6" aria-labelledby="teaser-heading">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 id="teaser-heading" className="text-3xl font-bold text-foreground">Walk through a cycle right now</h2>
          <p className="text-muted-foreground">Pick a measure and see how one PDSA cycle gets documented, start to finish.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {["CMS130 Colorectal", "CMS122 Diabetes", "CMS165 Blood pressure", "CMS124 Cervical"].map((m) => (
              <Button key={m} variant="outline" asChild>
                <Link to="/how-it-works">{m}</Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Spreadsheet vs MeasureWise */}
      <section className="py-16 px-6 bg-muted/30" aria-labelledby="compare-heading">
        <div className="max-w-5xl mx-auto space-y-8">
          <h2 id="compare-heading" className="text-3xl font-bold text-foreground text-center">
            Spreadsheets vs. MeasureWise
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-4">The spreadsheet way</h3>
              <ul className="space-y-2">
                {SPREADSHEET.map((d) => (
                  <li key={d} className="flex gap-2 text-sm text-foreground">
                    <X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-primary/30 bg-card p-6">
              <h3 className="font-semibold text-foreground mb-4">With MeasureWise</h3>
              <ul className="space-y-2">
                {WITH_MW.map((d) => (
                  <li key={d} className="flex gap-2 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What happens after the report */}
      <section className="py-16 px-6 bg-muted/30" aria-labelledby="after-report-heading">
        <div className="max-w-5xl mx-auto space-y-10">
          <h2 id="after-report-heading" className="text-3xl font-bold text-foreground text-center">
            What happens after the report
          </h2>
          <ol className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-xl border border-border bg-card p-6 space-y-3">
                <s.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-foreground">
                  {i + 1}. {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Does / does not */}
      <section className="py-16 px-6" aria-labelledby="scope-heading">
        <div className="max-w-5xl mx-auto space-y-8">
          <h2 id="scope-heading" className="text-3xl font-bold text-foreground text-center">
            What MeasureWise does and does not do
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-4">Does</h3>
              <ul className="space-y-2">
                {DOES.map((d) => (
                  <li key={d} className="flex gap-2 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-4">Does not</h3>
              <ul className="space-y-2">
                {DOES_NOT.map((d) => (
                  <li key={d} className="flex gap-2 text-sm text-foreground">
                    <X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Built to organize the evidence FQHC quality teams need for QI/QA and site-visit preparation.
          </p>
        </div>
      </section>

      {/* Security summary */}
      <section className="py-12 px-6 border-y border-border" aria-labelledby="security-heading">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 id="security-heading" className="text-center text-2xl font-bold text-foreground">
            Security summary
          </h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SECURITY_BULLETS.map((label) => (
              <li key={label} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                <Shield className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                <span className="text-sm text-foreground">{label}</span>
              </li>
            ))}
          </ul>
          <p className="text-center text-sm">
            <Link to="/security" className="text-primary underline underline-offset-4 hover:no-underline">
              Read the full security overview
            </Link>
          </p>
        </div>
      </section>

      {/* Tech stack */}
      <section className="py-16 px-6" aria-labelledby="stack-heading">
        <div className="max-w-5xl mx-auto space-y-8">
          <h2 id="stack-heading" className="text-3xl font-bold text-foreground text-center">
            Where MeasureWise fits
          </h2>
          <ol className="grid md:grid-cols-3 gap-4">
            {STACK.map((s, i) => (
              <li
                key={s.title}
                className={`rounded-xl border p-6 space-y-2 bg-card ${i === 2 ? "border-primary" : "border-border"}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.layer}</p>
                <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="text-center text-sm text-muted-foreground">
            No integration. You enter monthly aggregate values from the reports you already run.
          </p>
        </div>
      </section>

      {/* Role tabs */}
      <section className="py-16 px-6 bg-muted/30" aria-labelledby="roles-heading">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 id="roles-heading" className="text-3xl font-bold text-foreground text-center">Built for your role</h2>
          <Tabs defaultValue={ROLES[0].id}>
            <TabsList className="flex flex-wrap h-auto justify-center">
              {ROLES.map((r) => (
                <TabsTrigger key={r.id} value={r.id}>{r.label}</TabsTrigger>
              ))}
            </TabsList>
            {ROLES.map((r) => (
              <TabsContent key={r.id} value={r.id} className="rounded-xl border border-border bg-card p-6">
                <ul className="space-y-2">
                  {r.points.map((p) => (
                    <li key={p} className="flex gap-2 text-sm text-foreground">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Founder note */}
      <section className="py-16 px-6" aria-labelledby="founder-heading">
        <div className="max-w-2xl mx-auto rounded-xl border border-border bg-card p-8 space-y-4">
          <h2 id="founder-heading" className="text-2xl font-bold text-foreground">Why I built this</h2>
          <p className="text-muted-foreground leading-relaxed">
            I spent 14 years in healthcare watching good quality work disappear into email threads and old
            spreadsheets. When the board or a site visit came, we rebuilt the story from memory. I built
            MeasureWise so the record exists while the work is happening.
          </p>
          <p className="font-semibold text-foreground">{BRAND.founder.formalName}</p>
          <p className="text-sm text-muted-foreground -mt-3">{BRAND.founder.title}</p>
        </div>
      </section>

      {/* Template lead */}
      <section className="py-16 px-6 bg-muted/30" aria-labelledby="template-heading">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 id="template-heading" className="text-2xl font-bold text-foreground">Get the free PDSA Study Template</h2>
          <p className="text-muted-foreground">
            A one-page template for recording baseline, change, result, and decision. Use it with or without MeasureWise.
          </p>
          <Button size="lg" asChild>
            <a href={pdsaTemplate.url} download="MeasureWise_PDSA_Cycle_Record.pdf">Download the template (PDF)</a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={pdsaTemplate.url} target="_blank" rel="noopener noreferrer">Open printable template</a>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6" aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 id="faq-heading" className="text-3xl font-bold text-foreground text-center">Questions buyers ask</h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="cursor-pointer font-semibold text-foreground list-none flex justify-between gap-4">
                  {f.q}
                  <span className="text-muted-foreground group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <h2 className="text-2xl font-bold text-foreground">See it on your measure</h2>
          <p className="text-muted-foreground">
            Bring the measure that is giving you trouble. We will walk through one cycle on it in 15 minutes.
          </p>
          <div className="flex justify-center">
            <Ctas />
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
