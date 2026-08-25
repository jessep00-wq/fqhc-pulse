import { createFileRoute } from "@tanstack/react-router";
import PublicDemo from "@/pages/PublicDemo";

export const Route = createFileRoute("/demo")({
  component: PublicDemo,
});
