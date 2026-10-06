import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/features/spc-charts")({
  beforeLoad: () => {
    throw redirect({ to: "/features", hash: "spc-charts", replace: true });
  },
  head: () => ({
    meta: [
      { title: "SPC Charts for UDS Measures | MeasureWise" },
      { name: "description", content: "Statistical process control charts that show whether a UDS measure actually moved or just varied." },
      { property: "og:title", content: "SPC Charts for UDS Measures | MeasureWise" },
      { property: "og:description", content: "Statistical process control charts that show whether a UDS measure actually moved or just varied." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/features/spc-charts" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/features/spc-charts" }],
  }),
});
