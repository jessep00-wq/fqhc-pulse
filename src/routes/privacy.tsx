import { createFileRoute } from "@tanstack/react-router";
import PrivacyPolicy from "@/pages/PrivacyPolicy";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPolicy,
  head: () => ({
    meta: [
      { title: "Privacy Policy | MeasureWise" },
      { name: "description", content: "How MeasureWise collects, uses, and protects account and organization data. MeasureWise does not accept PHI." },
      { property: "og:title", content: "Privacy Policy | MeasureWise" },
      { property: "og:description", content: "How MeasureWise collects, uses, and protects account and organization data. MeasureWise does not accept PHI." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/privacy" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/privacy" }],
  }),
});
