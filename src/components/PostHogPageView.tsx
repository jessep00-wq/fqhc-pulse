import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import posthog from "posthog-js";

export function PostHogPageView() {
  const { pathname } = useLocation();

  useEffect(() => {
    posthog.capture("$pageview");
  }, [pathname]);

  return null;
}
