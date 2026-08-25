import { useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { RESOURCES } from "@/lib/resources/registry";
import { RESOURCE_CATEGORIES } from "@/lib/resources/types";

const ALL = "All topics";

export default function ResourcesIndex() {
  const [active, setActive] = useState<string>(ALL);

  const visible = useMemo(
    () => (active === ALL ? RESOURCES : RESOURCES.filter((r) => r.category === active)),
    [active],
  );

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "FQHC Quality Resource Library",
      description:
        "Practical guidance for FQHC quality teams on HRSA QI/QA documentation, UDS reporting, and PDSA improvement cycles.",
      url: `${BRAND.url}/resources`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${BRAND.url}/` },
        { "@type": "ListItem", position: 2, name: "Resources", item: `${BRAND.url}/resources` },
      ],
    },
  ];

  return (
    <PublicPageLayout>
      <SEO
        title="FQHC Quality Resource Library"
        description="Practical guidance for FQHC quality teams: HRSA QI/QA documentation, Operational Site Visit preparation, UDS reporting troubleshooting, and PDSA improvement cycles."
        canonical={`${BRAND.url}/resources`}
        jsonLd={jsonLd}
      />

      <section className="border-b border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <BookOpen className="h-4 w-4" aria-hidden /> Resource Library
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-foreground max-w-3xl">
            FQHC quality, HRSA compliance, and UDS reporting guidance
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Written for quality directors and PCMH coordinators who have to produce evidence, not
            just improve care. Operational guidance first; every regulatory statement is cited to an
            official source or held back until it can be.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <nav aria-label="Filter resources by topic" className="flex flex-wrap gap-2">
          {[ALL, ...RESOURCE_CATEGORIES.filter((c) => RESOURCES.some((r) => r.category === c))].map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                aria-pressed={active === cat}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active === cat
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ),
          )}
        </nav>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <li key={r.slug} className="h-full">
              <Card className="h-full flex flex-col transition-shadow hover:shadow-md">
                <CardHeader className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {r.category}
                  </p>
                  <CardTitle className="text-lg leading-snug">
                    <Link
                      to={`/resources/${r.slug}`}
                      className="hover:text-primary transition-colors focus-visible:outline-hidden focus-visible:underline"
                    >
                      {r.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>
                  <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" aria-hidden /> {r.readingMinutes} min read
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

        <div className="mt-14 rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Turn this guidance into a dated evidence trail
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            {BRAND.nameTm} keeps PDSA cycles, UDS measure trends, and QI/QA reports in one place and
            exports them as a site-visit-ready binder.
          </p>
          <Button asChild className="mt-6 font-semibold">
            <Link to="/features">
              See how it works <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicPageLayout>
  );
}
