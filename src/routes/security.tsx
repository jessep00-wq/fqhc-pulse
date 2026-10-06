import { createFileRoute } from "@tanstack/react-router";
import Security from "@/pages/Security";

export const Route = createFileRoute("/security")({
  component: Security,
  head: () => ({
    meta: [
      { title: "Security at MeasureWise | Data Handling for FQHCs" },
      { name: "description", content: "How MeasureWise isolates organization data, controls access, and why the platform is built to work without PHI." },
      { property: "og:title", content: "Security at MeasureWise | Data Handling for FQHCs" },
      { property: "og:description", content: "How MeasureWise isolates organization data, controls access, and why the platform is built to work without PHI." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/security" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/security" }],
  }),
});
