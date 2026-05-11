export type StoreCategory =
  | "UDS Reporting"
  | "QI Governance"
  | "Board & Leadership"
  | "PDSA Improvement";

export interface StoreProduct {
  id: string;
  slug: string;
  name: string;
  category: StoreCategory;
  price_cents: number;
  currency: string;
  status: "draft" | "published" | "archived";
  hero_emoji: string | null;
  short_description: string | null;
  long_description: string | null;
  bullets: string[];
  whats_inside: string[];
  who_its_for: string[];
  uds_framing: string | null;
  included_file_paths: string[];
  sample_preview_url: string | null;
  stripe_price_id: string | null;
  sort_order: number;
  buyer_guidance: string | null;
  preview_image_urls: string[];
}

export interface StoreBundle {
  id: string;
  slug: string;
  name: string;
  hero_emoji: string | null;
  short_description: string | null;
  long_description: string | null;
  price_cents: number;
  currency: string;
  status: "draft" | "published" | "archived";
  included_product_ids: string[];
  stripe_price_id: string | null;
  sort_order: number;
  buyer_guidance: string | null;
  preview_image_urls: string[];
}

export const STORE_CATEGORIES: StoreCategory[] = [
  "UDS Reporting",
  "QI Governance",
  "PDSA Improvement",
  "Board & Leadership",
];

export function formatPrice(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
