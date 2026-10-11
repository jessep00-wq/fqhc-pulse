import { createFileRoute } from "@tanstack/react-router";
import ResourceArticle from "@/pages/resources/ResourceArticle";
import { getResource } from "@/lib/resources/registry";

export const Route = createFileRoute("/resources/$slug")({
  component: ResourceArticle,
  head: ({ params }) => {
    const r = getResource(params.slug);
    if (!r) return {};
    const title = `${r.seoTitle || r.title} | MeasureWise`;
    const url = `https://measurewise.org/resources/${r.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: r.description },
        { property: "og:title", content: title },
        { property: "og:description", content: r.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        ...(r.contentInReview ? [{ name: "robots", content: "noindex, follow" }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
});
