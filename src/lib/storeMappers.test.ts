import { describe, it, expect } from "vitest";
import { mapStoreProduct, mapStoreBundle } from "./storeMappers";

describe("mapStoreProduct", () => {
  it("maps a complete row", () => {
    const p = mapStoreProduct({
      id: "p1",
      slug: "uds-kit",
      name: "UDS Kit",
      category: "UDS Reporting",
      price_cents: 4900,
      currency: "usd",
      status: "published",
      hero_emoji: "📊",
      short_description: "short",
      long_description: "long",
      bullets: ["a", "b"],
      whats_inside: ["x"],
      who_its_for: ["QI"],
      uds_framing: "frame",
      file_count: 1,
      sample_preview_url: "https://x/y",
      stripe_price_id: "price_123",
      sort_order: 2,
      buyer_guidance: "guide",
      preview_image_urls: ["https://x/img"],
      is_coming_soon: false,
    });
    expect(p.id).toBe("p1");
    expect(p.price_cents).toBe(4900);
    expect(p.bullets).toEqual(["a", "b"]);
    expect(p.file_count).toBe(1);
  });

  it("applies safe defaults for missing/null fields", () => {
    const p = mapStoreProduct({ id: "p2" });
    expect(p.slug).toBe("");
    expect(p.currency).toBe("usd");
    expect(p.status).toBe("draft");
    expect(p.price_cents).toBe(0);
    expect(p.bullets).toEqual([]);
    expect(p.preview_image_urls).toEqual([]);
    expect(p.hero_emoji).toBeNull();
    expect(p.is_coming_soon).toBe(false);
  });

  it("filters non-string array entries", () => {
    const p = mapStoreProduct({ bullets: ["ok", 1, null, "yes"] });
    expect(p.bullets).toEqual(["ok", "yes"]);
  });
});

describe("mapStoreBundle", () => {
  it("maps required fields and defaults", () => {
    const b = mapStoreBundle({
      id: "b1",
      slug: "kit",
      name: "Bundle",
      price_cents: 9900,
      included_product_ids: ["p1", "p2"],
    });
    expect(b.id).toBe("b1");
    expect(b.currency).toBe("usd");
    expect(b.status).toBe("draft");
    expect(b.included_product_ids).toEqual(["p1", "p2"]);
    expect(b.preview_image_urls).toEqual([]);
    expect(b.hero_emoji).toBeNull();
  });
});
