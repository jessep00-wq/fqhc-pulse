import { createFileRoute } from "@tanstack/react-router";
import StoreBundleDetail from "@/pages/store/StoreBundleDetail";

export const Route = createFileRoute("/store/bundle/$slug")({
  component: StoreBundleDetail,
});
