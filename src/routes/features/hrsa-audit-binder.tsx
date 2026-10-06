import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/features/hrsa-audit-binder")({
  beforeLoad: () => {
    throw redirect({ to: "/features", hash: "audit-binder", replace: true });
  },
  head: () => ({
    meta: [
      { title: "HRSA Audit Binder Export | MeasureWise" },
      { name: "description", content: "Generate an organized QI/QA evidence packet for HRSA operational site visits from records your team already keeps." },
      { property: "og:title", content: "HRSA Audit Binder Export | MeasureWise" },
      { property: "og:description", content: "Generate an organized QI/QA evidence packet for HRSA operational site visits from records your team already keeps." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/features/hrsa-audit-binder" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/features/hrsa-audit-binder" }],
  }),
});
