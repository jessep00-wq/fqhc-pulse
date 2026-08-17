/**
 * Auth email links (signup confirm, recovery, magic link, invite) are one-time
 * use. When GoTrue can't consume the token it 303-redirects to the project Site
 * URL — which is `/`, the marketing landing page. Without this helper the user
 * silently lands on the homepage with no explanation.
 *
 * These helpers read auth parameters from BOTH the query string and the URL
 * fragment (implicit flow puts them in the hash) so any landing surface can
 * route the visitor somewhere useful.
 */

export type AuthLinkIntent =
  | { kind: "error"; code: string; description: string }
  | { kind: "recovery" }
  | { kind: "session" }
  | null;

function readParams(url: string): URLSearchParams {
  const parsed = new URL(url);
  const merged = new URLSearchParams(parsed.search);
  const hash = parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash;
  if (hash) {
    const hashParams = new URLSearchParams(hash);
    hashParams.forEach((value, key) => {
      if (!merged.has(key)) merged.set(key, value);
    });
  }
  return merged;
}

/** Classify an incoming URL that may carry Supabase auth link parameters. */
export function parseAuthLink(href: string): AuthLinkIntent {
  let params: URLSearchParams;
  try {
    params = readParams(href);
  } catch {
    return null;
  }

  const error = params.get("error") || params.get("error_code");
  if (error) {
    return {
      kind: "error",
      code: params.get("error_code") || params.get("error") || "invalid_link",
      description: params.get("error_description") || "",
    };
  }

  const type = params.get("type");
  if (type === "recovery") return { kind: "recovery" };

  // PKCE code exchange: `?code=` only appears on auth links, never on
  // ordinary marketing traffic.
  if (params.get("code")) {
    return type && type !== "recovery" ? { kind: "session" } : { kind: "recovery" };
  }

  if (params.get("access_token") || type === "signup" || type === "magiclink" || type === "invite") {
    return { kind: "session" };
  }

  return null;
}

/** Human-readable copy for an auth link failure. */
export function authErrorMessage(code: string, description: string): string {
  const normalized = (description || "").trim();
  switch (code) {
    case "otp_expired":
      return "That link has expired. Links are single use and expire after a short time — request a new one below.";
    case "access_denied":
      return "That link has expired or was already used. Request a new one below.";
    default:
      return normalized
        ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`
        : "That link is no longer valid. Request a new one below.";
  }
}
