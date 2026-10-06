import { createFileRoute } from "@tanstack/react-router";
import PublicDemo from "@/pages/PublicDemo";

export const Route = createFileRoute("/demo")({
  component: PublicDemo,
  head: () => ({
    meta: [
      { title: "Product Demo | MeasureWise" },
      { name: "description", content: "See MeasureWise with sample data: PDSA cycles, UDS measure tracking, SPC charts, and audit-ready exports." },
      { property: "og:title", content: "Product Demo | MeasureWise" },
      { property: "og:description", content: "See MeasureWise with sample data: PDSA cycles, UDS measure tracking, SPC charts, and audit-ready exports." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/demo" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/demo" }],
  }),
});
