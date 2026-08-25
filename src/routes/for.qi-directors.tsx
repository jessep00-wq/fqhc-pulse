import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/for/qi-directors")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "for-qi-directors", replace: true });
  },
});
