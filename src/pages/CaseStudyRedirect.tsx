import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const VALID_SLUGS = new Set([
  "valley-community-health",
  "northside-family-health",
  "sunrise-health-partners",
]);

/**
 * Bridges /case-studies/:slug (React route) to the static styled HTML files
 * in /public/case-studies/{slug}.html. Using a React route means the click
 * never falls through to NotFound (and the auth flow) on slow CDN paths.
 */
export default function CaseStudyRedirect() {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    if (!slug) {
      window.location.replace("/case-studies");
      return;
    }
    if (!VALID_SLUGS.has(slug)) {
      window.location.replace("/case-studies");
      return;
    }
    window.location.replace(`/case-studies/${slug}.html`);
  }, [slug]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Loading case study…</p>
      </div>
    </div>
  );
}
