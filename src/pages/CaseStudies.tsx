import { ArrowRight, MapPin, Users, TrendingUp } from "lucide-react";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";

interface CaseStudy {
  slug: string;
  number: string;
  org: string;
  location: string;
  patients: string;
  headline: string;
  summary: string;
  metrics: { label: string; value: string }[];
  accent: string; // tailwind bg classes
}

const studies: CaseStudy[] = [
  {
    slug: "valley-community-health",
    number: "01",
    org: "Valley Community Health Center",
    location: "Rural Appalachia · 3 sites",
    patients: "11,400 patients / yr",
    headline: "How a rural FQHC turned failing UDS scores into a grant renewal win",
    summary:
      "Valley was 14 months from a grant renewal review with three UDS measures trending the wrong direction. They used MeasureWise to run focused PDSA cycles tied to those measures — and walked into the renewal with proof.",
    metrics: [
      { label: "Grant renewal", value: "Approved" },
      { label: "UDS measures recovered", value: "3 of 3" },
      { label: "Time with MeasureWise", value: "14 months" },
    ],
    accent: "from-emerald-50 to-amber-50 border-emerald-200",
  },
  {
    slug: "northside-family-health",
    number: "02",
    org: "Northside Family Health Alliance",
    location: "Urban Midwest · 6 sites",
    patients: "28,000 patients / yr",
    headline: "The QI team that reclaimed 31 hours every month",
    summary:
      "Two coordinators were spending more time reporting on improvement work than doing it. Consolidating four tools into one and auto-generating the board report flipped the ratio.",
    metrics: [
      { label: "Hours saved / month", value: "31h" },
      { label: "Cervical screening lift", value: "+14 pts" },
      { label: "QI revenue protected", value: "$840K" },
    ],
    accent: "from-slate-900 to-slate-800 border-slate-700 text-slate-50",
  },
  {
    slug: "sunrise-health-partners",
    number: "03",
    org: "Sunrise Health Partners",
    location: "Suburban Southeast · 4 sites",
    patients: "19,500 patients / yr",
    headline: "How linking QI to revenue unlocked $1.1M in funding",
    summary:
      "Their QI work was real, but the CFO and board couldn't see the financial return. Mapping each UDS measure to its dollar impact turned QI from a compliance function into a revenue driver.",
    metrics: [
      { label: "Funding unlocked / protected", value: "$1.1M" },
      { label: "Avg UDS measure lift", value: "+16 pts" },
      { label: "Time to financial outcome", value: "9 months" },
    ],
    accent: "from-blue-50 to-white border-blue-200",
  },
];

export default function CaseStudies() {
  return (
    <PublicPageLayout>
      <SEO
        title="Case Studies — How FQHCs Use MeasureWise to Move UDS Measures and Protect Funding"
        description="Real customer stories from Federally Qualified Health Centers using MeasureWise to recover UDS scores, save QI admin time, and link clinical improvement to financial outcomes."
        canonical="https://measurewise.org/case-studies"
      />

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Customer stories</p>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 max-w-3xl leading-tight">
          How FQHC quality teams use MeasureWise
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Three Federally Qualified Health Centers. Three different problems. The same playbook: tie every PDSA cycle to a UDS measure, prove the work moved the number, and connect it back to funding.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid gap-8">
        {studies.map((s) => (
          <a
            key={s.slug}
            href={`/case-studies/${s.slug}.html`}
            className="group block"
          >
            <Card className={`overflow-hidden border-2 transition-all hover:shadow-xl hover:-translate-y-0.5`}>
              <CardContent className="p-0">
                <div className="grid md:grid-cols-[1fr_auto] gap-0">
                  <div className="p-8 md:p-10">
                    <div className="flex items-center gap-3 mb-4 text-xs uppercase tracking-wider text-muted-foreground">
                      <span className="font-semibold text-primary">Case Study No. {s.number}</span>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.location}</span>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {s.patients}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-2">{s.org}</p>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-snug group-hover:text-primary transition-colors">
                      {s.headline}
                    </h2>
                    <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed">{s.summary}</p>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Read the full story <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div className="bg-muted/40 border-t md:border-t-0 md:border-l border-border p-8 md:p-10 md:w-72 flex flex-col justify-center gap-5">
                    {s.metrics.map((m) => (
                      <div key={m.label}>
                        <div className="text-2xl font-bold text-foreground inline-flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4 text-primary" /> {m.value}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </section>
    </PublicPageLayout>
  );
}
