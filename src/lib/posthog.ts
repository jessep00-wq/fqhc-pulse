import posthog from "posthog-js";

const SENSITIVE_KEYS = new Set([
  "access_token",
  "refresh_token",
  "provider_token",
  "provider_refresh_token",
  "token",
  "code",
]);

function sanitizeUrl(url: string): string {
  if (!url) return url;
  try {
    const parsed = new URL(
      url,
      typeof window !== "undefined" ? window.location.href : "http://localhost"
    );

    const queryKeys = Array.from(parsed.searchParams.keys()).filter((key) =>
      SENSITIVE_KEYS.has(key.toLowerCase())
    );
    queryKeys.forEach((key) => parsed.searchParams.delete(key));

    const hash = parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash;
    const hashParams = new URLSearchParams(hash);
    const hashKeys = Array.from(hashParams.keys()).filter((key) =>
      SENSITIVE_KEYS.has(key.toLowerCase())
    );
    hashKeys.forEach((key) => hashParams.delete(key));
    parsed.hash = hashParams.toString() ? `#${hashParams.toString()}` : "";

    return parsed.toString();
  } catch {
    return url.split("#")[0].split("?")[0];
  }
}

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
    sanitize_properties: (properties, _event) => {
      if (typeof properties.$current_url === "string") {
        properties.$current_url = sanitizeUrl(properties.$current_url);
      }
      if (typeof properties.$referrer === "string") {
        properties.$referrer = sanitizeUrl(properties.$referrer);
      }
      if (
        typeof properties.$pathname === "string" &&
        properties.$pathname.includes("access_token")
      ) {
        properties.$pathname = properties.$pathname.split("#")[0].split("?")[0];
      }
      if (typeof properties.$session_entry_url === "string") {
        properties.$session_entry_url = sanitizeUrl(properties.$session_entry_url);
      }
      if (typeof properties.$initial_current_url === "string") {
        properties.$initial_current_url = sanitizeUrl(properties.$initial_current_url);
      }

      for (const key of Object.keys(properties)) {
        const value = properties[key];
        if (
          typeof value === "string" &&
          key !== "$current_url" &&
          key !== "$referrer" &&
          key !== "$pathname" &&
          key !== "$session_entry_url" &&
          key !== "$initial_current_url" &&
          (value.includes("access_token=") || value.includes("refresh_token="))
        ) {
          properties[key] = sanitizeUrl(value);
        }
      }

      return properties;
    },
  });
}
