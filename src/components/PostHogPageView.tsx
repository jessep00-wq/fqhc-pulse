import { useEffect } from "react";
import { useLocation } from "@/lib/router-compat";
import posthog from "posthog-js";

export function PostHogPageView() {
  const { pathname } = useLocation();

  useEffect(() => {
    posthog.capture("$pageview");
  }, [pathname]);

  return null;
}
