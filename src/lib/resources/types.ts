// Types for the MeasureWise Resource Library content registry.

export type ResourceCategory =
  | "HRSA & Operational Site Visits"
  | "UDS Reporting"
  | "Clinical Quality Measures"
  | "PDSA & Quality Improvement"
  | "Templates & Tools";

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  "HRSA & Operational Site Visits",
  "UDS Reporting",
  "Clinical Quality Measures",
  "PDSA & Quality Improvement",
  "Templates & Tools",
];

export interface ResourceBlock {
  /** Plain paragraph of non-regulatory, operational framing copy. */
  type: "p" | "h3" | "list" | "pending" | "callout";
  text?: string;
  items?: string[];
  /** Heading for a callout block. */
  label?: string;
}

export interface ResourceSection {
  /** Rendered as an H2 and used to build the table of contents. */
  heading: string;
  id: string;
  blocks: ResourceBlock[];
}

export interface ResourceSource {
  label: string;
  /** Official source URL, when a canonical public URL is known. */
  href?: string;
  note?: string;
}

export interface Resource {
  slug: string;
  /** H1 on the article page. */
  title: string;
  /** <title> tag; falls back to title. */
  seoTitle?: string;
  description: string;
  category: ResourceCategory;
  published: string; // ISO date
  updated: string; // ISO date
  readingMinutes: number;
  featured?: boolean;
  /**
   * True while the article still needs verified regulatory copy. Such pages
   * ship noindex and are excluded from the sitemap so nothing thin or
   * unverified gets indexed.
   */
  contentInReview?: boolean;
  sections: ResourceSection[];
  /** Slugs of related resources, rendered as internal links. */
  related: string[];
  /** One contextual product/feature link. */
  cta: { label: string; href: string; blurb: string };
  /** Optional download that must already exist in the product. */
  download?: { label: string; href: string };
  sources: ResourceSource[];
}

export const AUTHOR = {
  name: "Jessica R. Smith, BSN",
  title: "Founder, MeasureWise",
  href: "/about",
} as const;
