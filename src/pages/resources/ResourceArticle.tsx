import { Link, Navigate, useParams } from "react-router-dom";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRight, ExternalLink, Info } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { getResource, RESOURCES } from "@/lib/resources/registry";
import { AUTHOR, type ResourceBlock } from "@/lib/resources/types";

function Block({ block }: { block: ResourceBlock }) {
  if (block.type === "h3") {
    return <h3 className="mt-8 text-lg font-semibold text-foreground">{block.text}</h3>;
  }
  if (block.type === "list") {
    return (
      <ul className="mt-4 space-y-2 pl-5 list-disc marker:text-primary">
        {block.items?.map((item) => (
          <li key={item} className="text-muted-foreground leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "pending") {
    return (
      <Alert className="mt-6">
        <Info className="h-4 w-4" aria-hidden />
        <AlertTitle>Content in review</AlertTitle>
        <AlertDescription className="leading-relaxed">{block.text}</AlertDescription>
      </Alert>
    );
  }
  return <p className="mt-4 text-muted-foreground leading-relaxed">{block.text}</p>;
}

export default function ResourceArticle() {
  const { slug } = useParams<{ slug: string }>();
  const resource = slug ? getResource(slug) : undefined;

  if (!resource) return <Navigate to="/resources" replace />;

  const url = `${BRAND.url}/resources/${resource.slug}`;
  const related = resource.related
    .map((s) => RESOURCES.find((r) => r.slug === s))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: resource.title,
      description: resource.description,
      datePublished: resource.published,
      dateModified: resource.updated,
      author: { "@type": "Person", name: AUTHOR.name },
      publisher: { "@type": "Organization", name: BRAND.name, url: BRAND.url },
      mainEntityOfPage: url,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${BRAND.url}/` },
        { "@type": "ListItem", position: 2, name: "Resources", item: `${BRAND.url}/resources` },
        { "@type": "ListItem", position: 3, name: resource.title, item: url },
      ],
    },
  ];

  return (
    <PublicPageLayout backTo={{ label: "Back to Resource Library", href: "/resources" }}>
      <SEO
        title={resource.seoTitle || resource.title}
        description={resource.description}
        canonical={url}
        type="article"
        noindex={resource.contentInReview}
        jsonLd={jsonLd}
        article={{
          publishedTime: resource.published,
          modifiedTime: resource.updated,
          author: AUTHOR.name,
        }}
      />

      <article className="max-w-6xl mx-auto px-6 py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link to="/resources" className="hover:text-foreground transition-colors">
                Resources
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-foreground">
              {resource.category}
            </li>
          </ol>
        </nav>

        <header className="mt-6 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {resource.category}
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {resource.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            {resource.description}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            By{" "}
            <Link to={AUTHOR.href} className="underline hover:text-foreground">
              {AUTHOR.name}
            </Link>{" "}
            · Updated{" "}
            <time dateTime={resource.updated}>
              {new Date(resource.updated).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>{" "}
            · {resource.readingMinutes} min read
          </p>
        </header>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="max-w-3xl">
            {resource.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28 mt-10 first:mt-0">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                  {section.heading}
                </h2>
                {section.blocks.map((block, i) => (
                  <Block key={i} block={block} />
                ))}
              </section>
            ))}

            <section className="mt-12 rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground">{resource.cta.label}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {resource.cta.blurb}
              </p>
              <Button asChild className="mt-4 font-semibold">
                <Link to={resource.cta.href}>
                  {resource.cta.label} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </section>

            {resource.sources.length > 0 && (
              <section className="mt-12">
                <h2 className="text-lg font-semibold text-foreground">Official sources</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {resource.sources.map((s) => (
                    <li key={s.label} className="text-muted-foreground leading-relaxed">
                      {s.href ? (
                        <a
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-start gap-1.5 underline hover:text-foreground"
                        >
                          {s.label}
                          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                        </a>
                      ) : (
                        s.label
                      )}
                      {s.note && <span className="block text-xs opacity-80">{s.note}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {related.length > 0 && (
              <section className="mt-12">
                <h2 className="text-lg font-semibold text-foreground">Related resources</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link
                        to={`/resources/${r.slug}`}
                        className="text-primary underline underline-offset-2 hover:text-foreground"
                      >
                        {r.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <nav aria-label="On this page" className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                On this page
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {resource.sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      </article>
    </PublicPageLayout>
  );
}
