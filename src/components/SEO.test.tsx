import { describe, it, expect } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { SEO } from "./SEO";

function renderSEO(props: Parameters<typeof SEO>[0]) {
  return render(
    <HelmetProvider>
      <SEO {...props} />
    </HelmetProvider>
  );
}

describe("SEO meta tags", () => {
  it("emits og:site_name and og:image dimensions", async () => {
    renderSEO({ title: "Hello", description: "World" });
    await waitFor(() => {
      expect(document.querySelector('meta[property="og:site_name"]')).toBeTruthy();
    });
    expect(document.querySelector('meta[property="og:image:width"]')?.getAttribute("content")).toBe("1200");
    expect(document.querySelector('meta[property="og:image:height"]')?.getAttribute("content")).toBe("630");
  });

  it("does not emit redundant twitter:title or twitter:description", async () => {
    renderSEO({ title: "Hello", description: "World" });
    await waitFor(() => {
      expect(document.querySelector('meta[name="twitter:card"]')).toBeTruthy();
    });
    expect(document.querySelector('meta[name="twitter:title"]')).toBeNull();
    expect(document.querySelector('meta[name="twitter:description"]')).toBeNull();
  });
});
