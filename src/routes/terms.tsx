import { createFileRoute } from "@tanstack/react-router";
import TermsOfService from "@/pages/TermsOfService";

export const Route = createFileRoute("/terms")({
  component: TermsOfService,
  head: () => ({
    meta: [
      { title: "Terms of Service | MeasureWise" },
      { name: "description", content: "The terms that govern use of the MeasureWise quality-operations platform for FQHCs." },
      { property: "og:title", content: "Terms of Service | MeasureWise" },
      { property: "og:description", content: "The terms that govern use of the MeasureWise quality-operations platform for FQHCs." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/terms" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/terms" }],
  }),
});
