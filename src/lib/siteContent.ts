// Single source of truth for credibility-sensitive marketing copy.
// Founder experience, PHI/BAA boundary, and security wording live here so the
// homepage, security page, legal pages, and FAQs can never drift apart.

export const FOUNDER_EXPERIENCE_YEARS = 14;

export const FOUNDER_EXPERIENCE_SENTENCE =
  `${FOUNDER_EXPERIENCE_YEARS} years of healthcare quality improvement and operational experience`;

/** Long-form product data-use boundary. Approved copy — do not reword ad hoc. */
export const PHI_BOUNDARY_LONG =
  "MeasureWise is designed for quality-improvement workflows that do not require protected health information (PHI). Do not enter patient-identifying information into MeasureWise.";

/** Short form for badges, cards, and compact FAQ answers. */
export const PHI_BOUNDARY_SHORT = "No PHI required or permitted.";

/** Security-page explanatory paragraph. Approved copy. */
export const PHI_BOUNDARY_SECURITY_PARAGRAPH =
  "MeasureWise is designed for operational and quality-improvement workflows using aggregate, de-identified, or non-patient-identifying information. Because MeasureWise is not intended to collect, store, transmit, or process protected health information (PHI), a Business Associate Agreement (BAA) is not offered or required. Organizations should not enter patient-identifying information into the platform.";

export const PHI_CALLOUT = {
  title: "No PHI in MeasureWise",
  body: "Use MeasureWise with aggregate, de-identified, or non-patient-identifying quality-improvement information. Do not enter patient-identifying information.",
} as const;

/** Encryption wording — one phrasing sitewide. */
export const TLS_IN_TRANSIT = "TLS 1.2+ in transit";
export const ENCRYPTION_AT_REST = "AES-256 encryption at rest";

/**
 * Vendor-attestation wording. MeasureWise itself is NOT SOC 2 certified and
 * must never be described as such. Set `enabled` to false to drop the claim
 * entirely if the hosting vendors' attestations are not verified.
 */
export const VENDOR_SOC2 = {
  enabled: true,
  label: "Hosted on infrastructure provided by vendors with SOC 2 Type II attestations",
} as const;

export const SECURITY_BULLETS = [
  ENCRYPTION_AT_REST,
  TLS_IN_TRANSIT,
  "Row-Level Security tenant isolation by organization",
  "Role-based access controls (RBAC)",
  PHI_BOUNDARY_SHORT,
  ...(VENDOR_SOC2.enabled ? [VENDOR_SOC2.label] : []),
];

/**
 * Independent validation (outside proof). Disabled until a real, approved
 * quote exists. Never populate with placeholder or illustrative content —
 * when `enabled` is false the section renders nothing at all.
 */
export const externalValidation = {
  enabled: false,
  quote: "",
  name: "",
  title: "",
  organization: "",
  verificationLabel: "",
  caseStudyUrl: "",
} as const;

/** 2025 UDS resource labeling — there is no 2026 resource yet. */
export const UDS_RESOURCE_2025 = {
  eyebrow: "2025 UDS Reference Guide",
  title: "The 2025 UDS Reporting Resource for AthenaOne",
  note: "This resource reflects 2025 reporting guidance. Review current HRSA guidance before using it for 2026 reporting.",
} as const;
