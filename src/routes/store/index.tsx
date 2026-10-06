import { createFileRoute } from "@tanstack/react-router";
import StoreIndex from "@/pages/store/StoreIndex";

export const Route = createFileRoute("/store/")({
  component: StoreIndex,
  head: () => ({
    meta: [
      { title: "QI Toolkits and Templates | MeasureWise Store" },
      { name: "description", content: "Ready-to-use quality improvement templates, playbooks, and toolkits for FQHC teams." },
      { property: "og:title", content: "QI Toolkits and Templates | MeasureWise Store" },
      { property: "og:description", content: "Ready-to-use quality improvement templates, playbooks, and toolkits for FQHC teams." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/store" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/store" }],
  }),
});
