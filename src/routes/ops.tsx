import { createFileRoute } from "@tanstack/react-router";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import OpsConsole from "@/pages/OpsConsole";

export const Route = createFileRoute("/ops")({
  head: () => ({
    meta: [
      { title: "Operations OS" },
      // A private console, not a marketing page: keep it out of every index.
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        // The Just Jessica brand faces. Every one has a real fallback stack in
        // styles.css, so the console still reads correctly if this never loads.
        href: "https://fonts.googleapis.com/css2?family=Anton&family=Playfair+Display:wght@500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap",
      },
    ],
  }),
  component: OpsRoute,
});

function OpsRoute() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <OpsConsole />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
