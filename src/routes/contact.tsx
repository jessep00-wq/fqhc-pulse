import { createFileRoute } from "@tanstack/react-router";
import Contact from "@/pages/Contact";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({
    meta: [
      { title: "Contact MeasureWise | Talk to the Founder" },
      { name: "description", content: "Questions about MeasureWise for your health center? Send a note and Jessica Smith, the founder, will reply directly." },
      { property: "og:title", content: "Contact MeasureWise | Talk to the Founder" },
      { property: "og:description", content: "Questions about MeasureWise for your health center? Send a note and Jessica Smith, the founder, will reply directly." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://measurewise.org/contact" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/contact" }],
  }),
});
