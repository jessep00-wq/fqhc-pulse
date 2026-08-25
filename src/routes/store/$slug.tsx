import { createFileRoute } from "@tanstack/react-router";
import StoreProductDetail from "@/pages/store/StoreProductDetail";

export const Route = createFileRoute("/store/$slug")({
  component: StoreProductDetail,
});
