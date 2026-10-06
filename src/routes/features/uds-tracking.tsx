import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/features/uds-tracking")({
  beforeLoad: () => {
    throw redirect({ to: "/features", hash: "uds-tracking", replace: true });
  },
  head: () => ({
    meta: [
      { title: "UDS Measure Tracking | MeasureWise" },
      { name: "description", content: "Track core UDS clinical quality measures monthly against your targets, by site." },
      { property: "og:title", content: "UDS Measure Tracking | MeasureWise" },
      { property: "og:description", content: "Track core UDS clinical quality measures monthly against your targets, by site." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/features/uds-tracking" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/features/uds-tracking" }],
  }),
});
