import { useEffect } from "react";
import { useLocation } from "@/lib/router-compat";
import { withPostHog } from "@/lib/posthog";

export function PostHogPageView() {
  const { pathname } = useLocation();

  useEffect(() => {
    withPostHog((ph) => ph.capture("$pageview"));
  }, [pathname]);

  return null;
}
