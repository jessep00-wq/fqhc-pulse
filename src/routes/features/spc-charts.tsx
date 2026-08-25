import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/features/spc-charts")({
  beforeLoad: () => {
    throw redirect({ to: "/features", hash: "spc-charts", replace: true });
  },
});
