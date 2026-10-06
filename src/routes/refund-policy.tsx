import { createFileRoute } from "@tanstack/react-router";
import RefundPolicy from "@/pages/RefundPolicy";

export const Route = createFileRoute("/refund-policy")({
  component: RefundPolicy,
  head: () => ({
    meta: [
      { title: "Refund Policy | MeasureWise" },
      { name: "description", content: "Refund terms for MeasureWise subscriptions and one-time digital product purchases." },
      { property: "og:title", content: "Refund Policy | MeasureWise" },
      { property: "og:description", content: "Refund terms for MeasureWise subscriptions and one-time digital product purchases." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/refund-policy" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/refund-policy" }],
  }),
});
