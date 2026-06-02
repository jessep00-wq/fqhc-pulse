export type EvidenceDocumentType =
  | "policy"
  | "procedure"
  | "job_description"
  | "schedule"
  | "minutes"
  | "survey_report"
  | "dashboard_report"
  | "pdsa_packet"
  | "other";

export type EvidenceDocumentStatus = "active" | "archived" | "expired";
export type EvidenceDocumentSource = "uploaded" | "auto_pdsa" | "auto_minutes";
export type EvidenceExportType = "full_osv" | "quarterly_qi" | "board_packet";

export interface EvidenceCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  chapter8_reference: string | null;
  required_doc_types: string[];
  default_review_cadence_months: number;
}

export interface EvidenceDocument {
  id: string;
  organization_id: string;
  category_id: string;
  title: string;
  document_type: EvidenceDocumentType;
  doc_date: string | null;
  author_user_id: string | null;
  author_name_override: string | null;
  associated_measure: string | null;
  associated_requirement: string | null;
  review_date: string | null;
  expires_at: string | null;
  current_version_id: string | null;
  status: EvidenceDocumentStatus;
  source: EvidenceDocumentSource;
  source_ref_id: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface EvidenceDocumentVersion {
  id: string;
  document_id: string;
  organization_id: string;
  version: number;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
  change_note: string | null;
}

export interface CategoryStatus {
  category: EvidenceCategory;
  documentCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  status: "complete" | "pending" | "missing";
  score: number; // 0-100
}

export const DOCUMENT_TYPE_LABELS: Record<EvidenceDocumentType, string> = {
  policy: "Policy",
  procedure: "Procedure",
  job_description: "Job Description",
  schedule: "Schedule / Calendar",
  minutes: "Meeting Minutes",
  survey_report: "Survey Report",
  dashboard_report: "Dashboard / Report",
  pdsa_packet: "PDSA Packet",
  other: "Other",
};
