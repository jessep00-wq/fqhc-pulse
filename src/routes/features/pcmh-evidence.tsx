import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/features/pcmh-evidence")({
  beforeLoad: () => {
    throw redirect({ to: "/features", replace: true });
  },
  head: () => ({
    meta: [
      { title: "PCMH Evidence Tracking | MeasureWise" },
      { name: "description", content: "Keep PCMH documentation tied to the quality work that produced it, ready for recognition and renewal." },
      { property: "og:title", content: "PCMH Evidence Tracking | MeasureWise" },
      { property: "og:description", content: "Keep PCMH documentation tied to the quality work that produced it, ready for recognition and renewal." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/features/pcmh-evidence" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/features/pcmh-evidence" }],
  }),
});
