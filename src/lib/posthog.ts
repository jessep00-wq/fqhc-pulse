import posthog from "posthog-js";

export function initPostHog() {
  const apiKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
  const apiHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

  if (!apiKey || !apiHost) {
    console.warn("PostHog is not configured; skipping initialization");
    return;
  }

  posthog.init(apiKey, {
    api_host: apiHost,
    capture_pageview: false,
  });
}
