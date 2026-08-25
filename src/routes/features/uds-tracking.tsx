import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/features/uds-tracking")({
  beforeLoad: () => {
    throw redirect({ to: "/features", hash: "uds-tracking", replace: true });
  },
});
