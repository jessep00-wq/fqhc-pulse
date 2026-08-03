export type PDSAStatus = "plan" | "do" | "study" | "act" | "completed";

export interface DBCycle {
  id: string;
  organization_id: string;
  title: string;
  status: string;
  uds_measure: string | null;
  focus_area?: string | null;
  root_cause: string | null;
  target_goal: string | null;
  clinical_workflow_impact: string | null;
  assigned_staff: string[] | null;
  improvement_pct: number | null;
  created_at: string;
  aim_statement?: string | null;
  prediction?: string | null;
  measurement_plan?: string | null;
  test_description?: string | null;
  analysis_summary?: string | null;
  decision?: string | null;
  template_id?: string | null;
}

export interface DBTask {
  id: string;
  pdsa_cycle_id: string | null;
  status: string;
  acknowledged?: boolean;
}

export const STATUS_COLUMNS: { key: PDSAStatus; label: string; color: string; borderColor: string }[] = [
  { key: "plan", label: "Plan", color: "bg-primary/10 text-primary", borderColor: "border-l-4 border-l-primary" },
  { key: "do", label: "Do", color: "bg-info/10 text-info", borderColor: "border-l-4 border-l-info" },
  { key: "study", label: "Study", color: "bg-warning/10 text-warning", borderColor: "border-l-4 border-l-warning" },
  { key: "act", label: "Act", color: "bg-accent/10 text-accent", borderColor: "border-l-4 border-l-accent" },
  { key: "completed", label: "Completed", color: "bg-success/10 text-success", borderColor: "border-l-4 border-l-success" },
];
