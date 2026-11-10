import { describe, it, expect } from "vitest";
import { parseAuthLink, authErrorMessage } from "./authLinkParams";

describe("expired or used confirmation links on /auth", () => {
  it("detects an expired link that redirects straight to /auth with the error in the hash", () => {
    const intent = parseAuthLink(
      "https://measurewise.org/auth#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
    );
    expect(intent).toEqual({
      kind: "error",
      code: "otp_expired",
      description: "Email link is invalid or has expired",
    });
  });

  it("detects the error when it arrives in the query string", () => {
    const intent = parseAuthLink("https://measurewise.org/auth?error=access_denied&error_code=otp_expired");
    expect(intent?.kind).toBe("error");
  });

  it("uses no em-dashes in link error copy", () => {
    for (const code of ["otp_expired", "access_denied", "other"]) {
      expect(authErrorMessage(code, "")).not.toContain("\u2014");
    }
  });
});
