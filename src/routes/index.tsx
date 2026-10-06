import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/pages/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MeasureWise | PDSA and QI Evidence Management for FQHCs" },
      { name: "description", content: "Document interventions, study results, and keep QI evidence. Download the free one-page PDSA template for your FQHC." },
      { property: "og:title", content: "MeasureWise | PDSA and QI Evidence Management for FQHCs" },
      { property: "og:description", content: "Document interventions, study results, and keep QI evidence. Download the free one-page PDSA template for your FQHC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});
