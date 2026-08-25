import { createFileRoute } from "@tanstack/react-router";
import Features from "@/pages/Features";

export const Route = createFileRoute("/features/")({
  component: Features,
});
