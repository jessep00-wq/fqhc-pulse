import { createFileRoute } from "@tanstack/react-router";
import ManualLanding from "@/pages/ManualLanding";

export const Route = createFileRoute("/manual/")({
  component: ManualLanding,
});
