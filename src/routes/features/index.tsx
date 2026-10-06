import { createFileRoute } from "@tanstack/react-router";
import Features from "@/pages/Features";

export const Route = createFileRoute("/features/")({
  component: Features,
  head: () => ({
    meta: [
      { title: "Features | MeasureWise Quality Operations for FQHCs" },
      { name: "description", content: "PDSA cycle management, UDS measure tracking, SPC charts, PCMH evidence, and HRSA audit binders in one system." },
      { property: "og:title", content: "Features | MeasureWise Quality Operations for FQHCs" },
      { property: "og:description", content: "PDSA cycle management, UDS measure tracking, SPC charts, PCMH evidence, and HRSA audit binders in one system." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/features" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/features" }],
  }),
});
