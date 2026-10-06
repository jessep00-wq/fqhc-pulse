import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/features/pdsa-cycle-manager")({
  beforeLoad: () => {
    throw redirect({ to: "/features", hash: "pdsa", replace: true });
  },
  head: () => ({
    meta: [
      { title: "PDSA Cycle Manager | MeasureWise" },
      { name: "description", content: "Plan, run, study, and decide on PDSA cycles with named owners, evidence, and a full change history." },
      { property: "og:title", content: "PDSA Cycle Manager | MeasureWise" },
      { property: "og:description", content: "Plan, run, study, and decide on PDSA cycles with named owners, evidence, and a full change history." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/features/pdsa-cycle-manager" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/features/pdsa-cycle-manager" }],
  }),
});
