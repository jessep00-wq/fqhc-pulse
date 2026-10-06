import { createFileRoute } from "@tanstack/react-router";
import ResourcesIndex from "@/pages/resources/ResourcesIndex";

export const Route = createFileRoute("/resources/")({
  component: ResourcesIndex,
  head: () => ({
    meta: [
      { title: "Resource Library | MeasureWise" },
      { name: "description", content: "Practical guides on HRSA QI/QA requirements, UDS measures, and PDSA cycles for FQHC quality teams." },
      { property: "og:title", content: "Resource Library | MeasureWise" },
      { property: "og:description", content: "Practical guides on HRSA QI/QA requirements, UDS measures, and PDSA cycles for FQHC quality teams." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/resources" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/resources" }],
  }),
});
