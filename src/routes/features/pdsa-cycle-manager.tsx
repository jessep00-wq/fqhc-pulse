import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/features/pdsa-cycle-manager")({
  beforeLoad: () => {
    throw redirect({ to: "/features", hash: "pdsa", replace: true });
  },
});
