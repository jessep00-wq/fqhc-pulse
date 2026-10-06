import { createFileRoute } from "@tanstack/react-router";
import Auth from "@/pages/Auth";

export const Route = createFileRoute("/auth")({
  component: Auth,
  head: () => ({
    meta: [
      { title: "Sign In or Start a Trial | MeasureWise" },
      { name: "description", content: "Sign in to MeasureWise or start a 14-day free trial for your health center's quality team." },
      { property: "og:title", content: "Sign In or Start a Trial | MeasureWise" },
      { property: "og:description", content: "Sign in to MeasureWise or start a 14-day free trial for your health center's quality team." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/auth" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/auth" }],
  }),
});
