import { createFileRoute } from "@tanstack/react-router";
import ManualThankYou from "@/pages/ManualThankYou";

export const Route = createFileRoute("/manual/thank-you")({
  component: ManualThankYou,
});
