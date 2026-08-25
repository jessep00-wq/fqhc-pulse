import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/for/operations-managers")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "for-operations-managers", replace: true });
  },
});
