import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export interface ResourcePageLink {
  to: string;
  label: string;
  blurb: string;
}

export interface ResourcePageProps {
  /** SEO title (also the H1). */
  title: string;
  /** Canonical URL path, e.g. /resources/uds-aligned-pdsa */
  path: string;
  /** Meta description (also the opening sub-paragraph). */
  description: string;
  /** Short chip label above the H1. */
  eyebrow: string;
  /** 2–6 short paragraphs forming the body. */
  body: string[];
  /** Bulleted "what's in it" or "what to do" list. */
  checklist?: string[];
  /** Cross-link cards. */
  related: ResourcePageLink[];
  /** ISO-8601 publication date. Defaults to a stable historical date. */
  publishedAt?: string;
  /** ISO-8601 last-modified date. Defaults to publishedAt. */
  updatedAt?: string;
}

const DEFAULT_PUBLISHED_AT = "2026-01-15";

export function ResourcePage({
  title,
  path,
  description,
  eyebrow,
  body,
  checklist,
  related,
  publishedAt = DEFAULT_PUBLISHED_AT,
  updatedAt,
}: ResourcePageProps) {
  const canonical = `https://measurewise.org${path}`;
  const dateModified = updatedAt ?? publishedAt;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: canonical,
    datePublished: publishedAt,
    dateModified,
    author: { "@type": "Person", name: "Jessica R. Smith, BSN" },
    publisher: {
      "@type": "Organization",
      name: "MeasureWise",
      url: "https://measurewise.org",
    },
  };

  return (
    <PublicPageLayout backTo={{ label: "All resources", href: "/blog" }}>
      <SEO
        title={title}
        description={description}
        canonical={canonical}
        jsonLd={jsonLd}
        type="article"
        article={{ publishedTime: publishedAt, modifiedTime: dateModified, author: "Jessica R. Smith, BSN" }}
      />

      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            {eyebrow}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto space-y-6 text-muted-foreground leading-relaxed">
          {body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      {checklist && checklist.length > 0 && (
        <section className="px-6 pb-16">
          <div className="max-w-3xl mx-auto rounded-xl border border-border bg-muted/30 p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">What good looks like</h2>
            <ul className="space-y-3">
              {checklist.map((c) => (
                <li key={c} className="flex items-start gap-3 text-foreground/90">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="px-6 pb-20 bg-muted/30">
        <div className="max-w-4xl mx-auto pt-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Related in MeasureWise</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {related.map((r) => (
              <Card key={r.to} className="border-border hover:border-primary/40 transition-colors">
                <CardContent className="p-5">
                  <Link to={r.to} className="group block">
                    <p className="font-semibold text-foreground group-hover:text-primary inline-flex items-center gap-1">
                      {r.label} <ArrowRight className="h-4 w-4" />
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{r.blurb}</p>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
