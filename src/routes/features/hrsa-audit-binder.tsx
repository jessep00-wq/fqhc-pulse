import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/features/hrsa-audit-binder")({
  beforeLoad: () => {
    throw redirect({ to: "/features", hash: "audit-binder", replace: true });
  },
});
