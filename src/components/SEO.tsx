import { Helmet } from "react-helmet-async";
import { BRAND, brandTitle } from "@/lib/brand";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  type?: "website" | "article";
  image?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  article?: {
    publishedTime?: string;
    author?: string;
  };
}

export function SEO({ title, description, canonical, type = "website", image, jsonLd, article }: SEOProps) {
  const fullTitle = brandTitle(title);
  const url = canonical || BRAND.url;
  const ogImage = image
    ? (image.startsWith("http") ? image : `${BRAND.url}${image.startsWith("/") ? "" : "/"}${image}`)
    : `${BRAND.url}/og-image.png`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {article?.author && <meta property="article:author" content={article.author} />}

      {jsonLd && (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
}
