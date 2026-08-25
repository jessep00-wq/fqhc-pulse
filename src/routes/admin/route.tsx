import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AdminRoute } from "@/components/AdminRoute";
import { AdminLayout } from "@/components/AdminLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const Route = createFileRoute("/admin")({
  component: AdminShell,
});

function AdminShell() {
  return (
    <AdminRoute>
      <AdminLayout>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </AdminLayout>
    </AdminRoute>
  );
}
