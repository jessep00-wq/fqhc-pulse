export type AICategory = "clinical" | "operational" | "administrative";
export type RiskTier = 1 | 2 | 3;
export type ToolStatus = "active" | "paused" | "retired";
export type PatientImpact = "none" | "low" | "moderate" | "high";
export type VendorAgreementStatus = "none" | "requested" | "signed" | "expired";

export interface AITool {
  id: string;
  organization_id: string;
  name: string;
  vendor: string | null;
  purpose: string | null;
  ai_category: AICategory;
  user_role: string | null;
  workflow_location: string | null;
  patient_impact: PatientImpact;
  data_accessed: string[];
  handles_phi: boolean;
  risk_tier: RiskTier;
  date_adopted: string | null;
  vendor_agreement_status: VendorAgreementStatus;
  is_shadow_ai: boolean;
  reported_by: string | null;
  internal_owner_user_id: string | null;
  status: ToolStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIVendorReview {
  id: string;
  organization_id: string;
  ai_tool_id: string;
  review_date: string;
  next_review_date: string | null;
  baa_signed: boolean;
  baa_file_path: string | null;
  data_retention_terms: string | null;
  model_update_notification: string | null;
  audit_rights: string | null;
  indemnification: string | null;
  known_limitations: string | null;
  signed_agreement_path: string | null;
  reviewer_user_id: string | null;
  status: "draft" | "approved";
  created_at: string;
  updated_at: string;
}

export type IncidentType =
  | "unexpected_output"
  | "near_miss"
  | "patient_safety"
  | "bias"
  | "privacy"
  | "other";

export type ResolutionStatus =
  | "open"
  | "investigating"
  | "resolved"
  | "escalated";

export interface AIIncident {
  id: string;
  organization_id: string;
  ai_tool_id: string | null;
  occurred_at: string;
  reported_by: string | null;
  incident_type: IncidentType;
  description: string;
  patient_impact: boolean;
  patient_impact_detail: string | null;
  corrective_action: string | null;
  resolution_status: ResolutionStatus;
  resolved_at: string | null;
  qi_committee_reviewed: boolean;
  qi_review_date: string | null;
  created_at: string;
  updated_at: string;
}

export type ReviewAction = "accepted" | "modified" | "rejected" | "escalated";
export type OutputCategory =
  | "clinical_recommendation"
  | "documentation"
  | "billing_code"
  | "policy_approval"
  | "other";

export interface AIReviewEvent {
  id: string;
  organization_id: string;
  ai_tool_id: string | null;
  reviewer_user_id: string | null;
  reviewed_at: string;
  output_category: OutputCategory;
  output_summary: string | null;
  action_taken: ReviewAction;
  patient_reference: string | null;
  notes: string | null;
  created_at: string;
}

export type PolicyStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "active"
  | "retired";

export interface AIPolicy {
  id: string;
  organization_id: string;
  version: number;
  title: string;
  body_md: string;
  status: PolicyStatus;
  cmo_approved_by: string | null;
  cmo_approved_at: string | null;
  ceo_approved_by: string | null;
  ceo_approved_at: string | null;
  board_chair_approved_by: string | null;
  board_chair_approved_at: string | null;
  activated_at: string | null;
  next_review_date: string | null;
  created_at: string;
  updated_at: string;
}
