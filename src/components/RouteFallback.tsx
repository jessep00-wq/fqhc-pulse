import { Loader2 } from "lucide-react";

/**
 * Shown while a lazily-loaded route chunk downloads. Without this the app
 * renders a blank white page between the click and the chunk arriving —
 * on a slow connection that reads as a broken site.
 */
export function RouteFallback({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 px-6"
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
