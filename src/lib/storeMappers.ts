import type { StoreBundle, StoreCategory, StoreProduct } from "@/types/store";

type Row = Record<string, unknown>;

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function asStringOrNull(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}
function asNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" ? v : fallback;
}
function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export function mapStoreProduct(row: Row): StoreProduct {
  return {
    id: asString(row.id),
    slug: asString(row.slug),
    name: asString(row.name),
    category: asString(row.category) as StoreCategory,
    price_cents: asNumber(row.price_cents),
    currency: asString(row.currency, "usd"),
    status: (asString(row.status, "draft") as StoreProduct["status"]),
    hero_emoji: asStringOrNull(row.hero_emoji),
    hero_image_url: asStringOrNull(row.hero_image_url),
    hero_icon: asStringOrNull(row.hero_icon),
    short_description: asStringOrNull(row.short_description),
    long_description: asStringOrNull(row.long_description),
    bullets: asStringArray(row.bullets),
    whats_inside: asStringArray(row.whats_inside),
    who_its_for: asStringArray(row.who_its_for),
    uds_framing: asStringOrNull(row.uds_framing),
    file_count: asNumber(row.file_count),
    sample_preview_url: asStringOrNull(row.sample_preview_url),
    stripe_price_id: asStringOrNull(row.stripe_price_id),
    sort_order: asNumber(row.sort_order),
    buyer_guidance: asStringOrNull(row.buyer_guidance),
    preview_image_urls: asStringArray(row.preview_image_urls),
    is_coming_soon: asBool(row.is_coming_soon),
  };
}

export function mapStoreBundle(row: Row): StoreBundle {
  return {
    id: asString(row.id),
    slug: asString(row.slug),
    name: asString(row.name),
    hero_emoji: asStringOrNull(row.hero_emoji),
    hero_image_url: asStringOrNull(row.hero_image_url),
    hero_icon: asStringOrNull(row.hero_icon),
    short_description: asStringOrNull(row.short_description),
    long_description: asStringOrNull(row.long_description),
    price_cents: asNumber(row.price_cents),
    currency: asString(row.currency, "usd"),
    status: (asString(row.status, "draft") as StoreBundle["status"]),
    included_product_ids: asStringArray(row.included_product_ids),
    stripe_price_id: asStringOrNull(row.stripe_price_id),
    sort_order: asNumber(row.sort_order),
    buyer_guidance: asStringOrNull(row.buyer_guidance),
    preview_image_urls: asStringArray(row.preview_image_urls),
  };
}
