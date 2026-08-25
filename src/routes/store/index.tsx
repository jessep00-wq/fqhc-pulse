import { createFileRoute } from "@tanstack/react-router";
import StoreIndex from "@/pages/store/StoreIndex";

export const Route = createFileRoute("/store/")({
  component: StoreIndex,
});
