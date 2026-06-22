export interface QIMeeting {
  id: string;
  organization_id: string;
  site_id: string | null;
  meeting_date: string;
  chair_name: string | null;
  attendees: string[];
  agenda_summary: string[];
  key_decisions: string[];
  created_by: string | null;
  created_at: string;
}

export interface QIOversightRole {
  id: string;
  organization_id: string;
  area: string;
  owner_role: string | null;
  owner_name_override: string | null;
  review_frequency: string | null;
  documentation_location: string | null;
  sort_order: number;
  created_at: string;
}

export interface AuditBinderExport {
  id: string;
  organization_id: string;
  period_start: string;
  period_end: string;
  executive_summary: string | null;
  generated_by: string | null;
  pdsa_count: number;
  measure_count: number;
  evidence_count: number;
  created_at: string;
}
