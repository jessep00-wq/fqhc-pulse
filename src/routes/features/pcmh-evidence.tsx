import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/features/pcmh-evidence")({
  beforeLoad: () => {
    throw redirect({ to: "/features", replace: true });
  },
});
