import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * Bridges /case-studies/:slug (React route) to the static styled HTML files
 * in /public/case-studies/{slug}.html. Using a React route means the click
 * never falls through to NotFound (and the auth flow) on slow CDN paths.
 *
 * Audit fix 41: slug allow-list is now derived dynamically by HEAD-checking
 * the static file in /public/case-studies/. Adding a new case study no longer
 * requires a code deploy — just drop {slug}.html into /public/case-studies/.
 */
export default function CaseStudyRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const [status, setStatus] = useState<"checking" | "missing">("checking");

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      window.location.replace("/case-studies");
      return;
    }
    // Reject path traversal / weird slugs before issuing a network request.
    if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(slug)) {
      window.location.replace("/case-studies");
      return;
    }
    const url = `/case-studies/${slug}.html`;
    fetch(url, { method: "HEAD" })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          window.location.replace(url);
        } else {
          setStatus("missing");
          window.location.replace("/case-studies");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("missing");
        window.location.replace("/case-studies");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">
          {status === "missing" ? "Redirecting…" : "Loading case study…"}
        </p>
      </div>
    </div>
  );
}
