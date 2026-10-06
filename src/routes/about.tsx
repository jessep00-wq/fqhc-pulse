import { createFileRoute } from "@tanstack/react-router";
import About from "@/pages/About";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About MeasureWise | Founded by Jessica R. Smith, BSN" },
      { name: "description", content: "Why MeasureWise exists: Jessica R. Smith, BSN, spent 14 years in healthcare and built a quality-operations system for FQHC QI teams." },
      { property: "og:title", content: "About MeasureWise | Founded by Jessica R. Smith, BSN" },
      { property: "og:description", content: "Why MeasureWise exists: Jessica R. Smith, BSN, spent 14 years in healthcare and built a quality-operations system for FQHC QI teams." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/about" }],
  }),
});
