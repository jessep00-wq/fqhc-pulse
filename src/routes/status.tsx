import { createFileRoute } from "@tanstack/react-router";
import Status from "@/pages/Status";

export const Route = createFileRoute("/status")({
  component: Status,
  head: () => ({
    meta: [
      { title: "System Status | MeasureWise" },
      { name: "description", content: "Current availability of the MeasureWise app, sign-in, and email delivery." },
      { property: "og:title", content: "System Status | MeasureWise" },
      { property: "og:description", content: "Current availability of the MeasureWise app, sign-in, and email delivery." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/status" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/status" }],
  }),
});
