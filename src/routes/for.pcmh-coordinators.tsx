import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/for/pcmh-coordinators")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "for-compliance-leads", replace: true });
  },
});
