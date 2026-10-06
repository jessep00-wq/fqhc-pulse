import { createFileRoute } from "@tanstack/react-router";
import Pricing from "@/pages/Pricing";

export const Route = createFileRoute("/pricing")({
  component: Pricing,
  head: () => ({
    meta: [
      { title: "Pricing | MeasureWise for FQHC Quality Teams" },
      { name: "description", content: "Solo, Multi-site, and Network plans for FQHC quality programs. Every paid plan starts with a 14-day free trial." },
      { property: "og:title", content: "Pricing | MeasureWise for FQHC Quality Teams" },
      { property: "og:description", content: "Solo, Multi-site, and Network plans for FQHC quality programs. Every paid plan starts with a 14-day free trial." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/pricing" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/pricing" }],
  }),
});
