import { createFileRoute } from "@tanstack/react-router";
import ReadinessScore from "@/pages/ReadinessScore";

export const Route = createFileRoute("/readiness")({
  component: ReadinessScore,
  head: () => ({
    meta: [
      { title: "HRSA Site Visit Readiness Score | MeasureWise" },
      { name: "description", content: "A short self-assessment that scores how ready your FQHC's QI/QA documentation is for an HRSA operational site visit." },
      { property: "og:title", content: "HRSA Site Visit Readiness Score | MeasureWise" },
      { property: "og:description", content: "A short self-assessment that scores how ready your FQHC's QI/QA documentation is for an HRSA operational site visit." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/readiness" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/readiness" }],
  }),
});
