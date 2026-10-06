import { Link, useNavigate } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { BRAND } from "@/lib/brand";
import { useEffect } from "react";
import { parseAuthLink } from "@/lib/authLinkParams";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { SECURITY_BULLETS, DATA_SCOPE_STATEMENT, CATEGORY_LINE } from "@/lib/siteContent";
import { ArrowRight, CheckCircle, X, FileText, FlaskConical, FolderCheck, Shield } from "lucide-react";

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
        <Link to="/contact?topic=pdsa-template">Get the free PDSA Study Template</Link>
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
            AthenaOne and Azara tell you where performance sits. MeasureWise is where you document the
            intervention, assign the work, study whether it moved the measure, record the decision, and
            keep the evidence for QI committee, board review, and HRSA preparation.
          </p>
          <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground">
            {DATA_SCOPE_STATEMENT}
          </p>
          <Ctas />
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
