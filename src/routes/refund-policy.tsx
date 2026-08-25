import { createFileRoute } from "@tanstack/react-router";
import RefundPolicy from "@/pages/RefundPolicy";

export const Route = createFileRoute("/refund-policy")({
  component: RefundPolicy,
});
