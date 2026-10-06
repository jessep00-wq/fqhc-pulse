import { createFileRoute } from "@tanstack/react-router";
import ManualLanding from "@/pages/ManualLanding";

export const Route = createFileRoute("/manual/")({
  component: ManualLanding,
  head: () => ({
    meta: [
      { title: "FQHC Quality Manual | MeasureWise" },
      { name: "description", content: "A practical quality-program manual for FQHC QI directors preparing for HRSA review." },
      { property: "og:title", content: "FQHC Quality Manual | MeasureWise" },
      { property: "og:description", content: "A practical quality-program manual for FQHC QI directors preparing for HRSA review." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/manual" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/manual" }],
  }),
});
