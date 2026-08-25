import { createFileRoute } from "@tanstack/react-router";
import ResourcesIndex from "@/pages/resources/ResourcesIndex";

export const Route = createFileRoute("/resources/")({
  component: ResourcesIndex,
});
