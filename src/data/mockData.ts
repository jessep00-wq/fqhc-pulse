export const ORG_ID = "org-001";

export type PDSAStatus = "plan" | "do" | "study" | "act" | "completed";
export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue";
export type StaffRole = "Front Desk" | "MA/RN" | "Provider" | "Care Coordinator" | "QI Manager";

export interface PDSACycle {
  id: string;
  org_id: string;
  title: string;
  status: PDSAStatus;
  uds_measure: string;
  root_cause: string;
  target_goal: string;
  clinical_workflow_impact: string;
  assigned_staff: StaffRole[];
  created_at: string;
  improvement_pct?: number;
}

export interface Task {
  id: string;
  org_id: string;
  pdsa_id: string;
  pdsa_title: string;
  title: string;
  assigned_role: StaffRole;
  status: TaskStatus;
  due_date: string;
  acknowledged: boolean;
}

export type PlaybookDomain = "Preventive Care" | "Chronic Disease" | "Behavioral Health" | "Financial/ACO";

export interface UDSPlaybook {
  id: string;
  measure_id: string;
  title: string;
  description: string;
  domain: PlaybookDomain;
  financial_impact: string;
  ehr_workflow_steps: string[];
  azara_cadence: string;
  pdsa_template: {
    title: string;
    root_cause: string;
    target_goal: string;
    clinical_workflow_impact: string;
    assigned_staff: StaffRole[];
  };
}

export const UDS_MEASURES = [
  "CMS122: Diabetes HbA1c Poor Control",
  "CMS124: Cervical Cancer Screening",
  "CMS125: Breast Cancer Screening",
  "CMS127: Pneumococcal Vaccination",
  "CMS130: Colorectal Cancer Screening",
  "CMS138: Tobacco Screening & Cessation",
  "CMS165: Blood Pressure Control",
  "CMS2: Depression Screening",
  "CMS69: BMI Screening & Follow-Up",
  "CMS75: Children Dental Decay",
];

export const mockPDSACycles: PDSACycle[] = [
  {
    id: "pdsa-001",
    org_id: ORG_ID,
    title: "Improve Cervical Cancer Screening Rate",
    status: "do",
    uds_measure: "CMS124: Cervical Cancer Screening",
    root_cause: "Lack of automated patient outreach for overdue Pap smears. Front desk not consistently flagging eligible patients during check-in.",
    target_goal: "Increase screening rate from 52% to 70% within 6 months",
    clinical_workflow_impact: "Add pre-visit planning checklist, modify MA rooming workflow to include screening eligibility check",
    assigned_staff: ["MA/RN", "Front Desk", "Provider"],
    created_at: "2024-11-15",
    improvement_pct: 12,
  },
  {
    id: "pdsa-002",
    org_id: ORG_ID,
    title: "Reduce HbA1c Poor Control Rate",
    status: "plan",
    uds_measure: "CMS122: Diabetes HbA1c Poor Control",
    root_cause: "Inconsistent follow-up scheduling for diabetic patients. Lab orders not being placed during visits.",
    target_goal: "Reduce poor control rate from 38% to 25%",
    clinical_workflow_impact: "Implement standing lab orders, add diabetic care protocol to EHR templates",
    assigned_staff: ["Provider", "MA/RN", "Care Coordinator"],
    created_at: "2024-12-01",
  },
  {
    id: "pdsa-003",
    org_id: ORG_ID,
    title: "Optimize AWV Completion Workflow",
    status: "study",
    uds_measure: "CMS69: BMI Screening & Follow-Up",
    root_cause: "AWV visits not being coded correctly. BMI follow-up plans not documented in structured fields.",
    target_goal: "Increase AWV completion with proper coding from 45% to 80%",
    clinical_workflow_impact: "Create AWV-specific visit template, train staff on proper coding",
    assigned_staff: ["Provider", "Front Desk"],
    created_at: "2024-10-20",
    improvement_pct: 22,
  },
  {
    id: "pdsa-004",
    org_id: ORG_ID,
    title: "Depression Screening Integration",
    status: "completed",
    uds_measure: "CMS2: Depression Screening",
    root_cause: "PHQ-9 not administered consistently. Results not linked to follow-up care plan.",
    target_goal: "Achieve 90% screening rate for eligible patients",
    clinical_workflow_impact: "Embed PHQ-9 in MA intake workflow, auto-generate referral for scores ≥10",
    assigned_staff: ["MA/RN", "Provider", "Care Coordinator"],
    created_at: "2024-08-10",
    improvement_pct: 35,
  },
  {
    id: "pdsa-005",
    org_id: ORG_ID,
    title: "Blood Pressure Control Initiative",
    status: "act",
    uds_measure: "CMS165: Blood Pressure Control",
    root_cause: "Improper BP measurement technique. No protocol for repeat measurements when elevated.",
    target_goal: "Improve controlled BP rate from 58% to 75%",
    clinical_workflow_impact: "Standardize BP measurement protocol, implement 5-minute rest period before measurement",
    assigned_staff: ["MA/RN", "Provider"],
    created_at: "2024-09-05",
    improvement_pct: 18,
  },
  {
    id: "pdsa-006",
    org_id: ORG_ID,
    title: "Tobacco Cessation Counseling",
    status: "do",
    uds_measure: "CMS138: Tobacco Screening & Cessation",
    root_cause: "Screening done but cessation interventions not documented. Referral to quitline not standardized.",
    target_goal: "Increase cessation intervention rate from 40% to 65%",
    clinical_workflow_impact: "Add cessation order set, integrate quitline referral into EHR workflow",
    assigned_staff: ["Provider", "MA/RN"],
    created_at: "2024-11-28",
    improvement_pct: 8,
  },
];

export const mockTasks: Task[] = [
  { id: "task-001", org_id: ORG_ID, pdsa_id: "pdsa-001", pdsa_title: "Cervical Cancer Screening", title: "Update pre-visit planning checklist in athenaOne", assigned_role: "QI Manager", status: "completed", due_date: "2024-12-15", acknowledged: true },
  { id: "task-002", org_id: ORG_ID, pdsa_id: "pdsa-001", pdsa_title: "Cervical Cancer Screening", title: "Train front desk on eligibility flagging", assigned_role: "Front Desk", status: "in_progress", due_date: "2025-01-10", acknowledged: true },
  { id: "task-003", org_id: ORG_ID, pdsa_id: "pdsa-001", pdsa_title: "Cervical Cancer Screening", title: "Configure automated outreach messages", assigned_role: "Care Coordinator", status: "pending", due_date: "2025-01-20", acknowledged: false },
  { id: "task-004", org_id: ORG_ID, pdsa_id: "pdsa-002", pdsa_title: "HbA1c Poor Control", title: "Create standing lab order template", assigned_role: "Provider", status: "pending", due_date: "2025-01-15", acknowledged: false },
  { id: "task-005", org_id: ORG_ID, pdsa_id: "pdsa-002", pdsa_title: "HbA1c Poor Control", title: "Set up diabetic patient registry in Azara", assigned_role: "QI Manager", status: "in_progress", due_date: "2025-01-05", acknowledged: true },
  { id: "task-006", org_id: ORG_ID, pdsa_id: "pdsa-003", pdsa_title: "AWV Completion", title: "Draft AWV visit template for athenaOne", assigned_role: "Provider", status: "completed", due_date: "2024-12-20", acknowledged: true },
  { id: "task-007", org_id: ORG_ID, pdsa_id: "pdsa-003", pdsa_title: "AWV Completion", title: "Conduct coding training session", assigned_role: "QI Manager", status: "in_progress", due_date: "2025-01-08", acknowledged: true },
  { id: "task-008", org_id: ORG_ID, pdsa_id: "pdsa-004", pdsa_title: "Depression Screening", title: "Embed PHQ-9 in intake workflow", assigned_role: "MA/RN", status: "completed", due_date: "2024-09-15", acknowledged: true },
  { id: "task-009", org_id: ORG_ID, pdsa_id: "pdsa-004", pdsa_title: "Depression Screening", title: "Configure auto-referral for PHQ-9 ≥10", assigned_role: "Provider", status: "completed", due_date: "2024-09-20", acknowledged: true },
  { id: "task-010", org_id: ORG_ID, pdsa_id: "pdsa-005", pdsa_title: "Blood Pressure Control", title: "Order calibrated BP cuffs for all exam rooms", assigned_role: "QI Manager", status: "completed", due_date: "2024-10-01", acknowledged: true },
  { id: "task-011", org_id: ORG_ID, pdsa_id: "pdsa-005", pdsa_title: "Blood Pressure Control", title: "Train MAs on standardized measurement protocol", assigned_role: "MA/RN", status: "in_progress", due_date: "2025-01-12", acknowledged: true },
  { id: "task-012", org_id: ORG_ID, pdsa_id: "pdsa-006", pdsa_title: "Tobacco Cessation", title: "Add cessation order set to athenaOne", assigned_role: "Provider", status: "pending", due_date: "2025-01-25", acknowledged: false },
  { id: "task-013", org_id: ORG_ID, pdsa_id: "pdsa-006", pdsa_title: "Tobacco Cessation", title: "Establish quitline referral partnership", assigned_role: "Care Coordinator", status: "overdue", due_date: "2024-12-30", acknowledged: false },
];

export const mockPlaybooks: UDSPlaybook[] = [
  {
    id: "pb-001",
    measure_id: "CMS124",
    domain: "Preventive Care",
    financial_impact: "High ROI: HRSA Quality Tier",
    title: "CMS124: Cervical Cancer Screening",
    description: "Workflow optimization for increasing cervical cancer screening rates among eligible women aged 21-65.",
    ehr_workflow_steps: [
      "Add screening eligibility alert to patient chart header in athenaOne",
      "Configure pre-visit planning report to flag patients due for Pap/HPV test",
      "Create order set: Pap smear + HPV co-test for ages 30-65",
      "Set up result notification workflow for abnormal results",
      "Configure patient outreach letter template for overdue screenings",
    ],
    azara_cadence: "Monthly DRVS dashboard review, quarterly deep-dive with clinical team",
    pdsa_template: {
      title: "Cervical Cancer Screening Rate Improvement",
      root_cause: "Eligible patients not identified during scheduling/check-in. No systematic outreach for overdue patients.",
      target_goal: "Increase CMS124 rate by 15 percentage points in 6 months",
      clinical_workflow_impact: "Pre-visit planning, MA rooming checklist update, provider standing orders",
      assigned_staff: ["Front Desk", "MA/RN", "Provider"],
    },
  },
  {
    id: "pb-002",
    measure_id: "CMS125",
    domain: "Preventive Care",
    financial_impact: "High ROI: HRSA Quality Tier",
    title: "CMS125: Breast Cancer Screening",
    description: "Systematic approach to improving mammography screening rates for women aged 50-74.",
    ehr_workflow_steps: [
      "Configure mammography referral order set in athenaOne",
      "Set up closed-loop referral tracking for mammography orders",
      "Create patient-facing educational materials and reminders",
      "Add mammography status to patient dashboard view",
      "Implement annual wellness visit mammography prompt",
    ],
    azara_cadence: "Bi-monthly DRVS reporting with referral completion tracking",
    pdsa_template: {
      title: "Breast Cancer Screening Optimization",
      root_cause: "Referral loop failures — mammography orders placed but not completed. No tracking of results.",
      target_goal: "Increase CMS125 rate by 20 percentage points in 6 months",
      clinical_workflow_impact: "Referral tracking workflow, care coordinator follow-up protocol",
      assigned_staff: ["Provider", "Care Coordinator", "Front Desk"],
    },
  },
  {
    id: "pb-003",
    measure_id: "AWV",
    domain: "Financial/ACO",
    financial_impact: "High ROI: ACO Shared Savings",
    title: "Annual Wellness Visit (AWV) Optimization",
    description: "Comprehensive workflow to maximize AWV completion rates and proper documentation/coding.",
    ehr_workflow_steps: [
      "Build AWV-specific visit template with all required elements",
      "Configure scheduling rules to prioritize AWV-eligible patients",
      "Create MA pre-visit questionnaire workflow",
      "Set up proper E&M coding guidance for AWV vs. problem-focused visits",
      "Implement AWV completion tracking dashboard",
    ],
    azara_cadence: "Weekly scheduling review, monthly completion rate analysis",
    pdsa_template: {
      title: "AWV Completion Rate Improvement",
      root_cause: "AWV visits not properly identified at scheduling. Documentation incomplete leading to coding errors.",
      target_goal: "Achieve 80% AWV completion for eligible Medicare patients",
      clinical_workflow_impact: "Scheduling workflow, visit template standardization, coding training",
      assigned_staff: ["Front Desk", "MA/RN", "Provider", "QI Manager"],
    },
  },
  {
    id: "pb-004",
    measure_id: "CMS165",
    domain: "Chronic Disease",
    financial_impact: "High ROI: HRSA Quality Tier",
    title: "CMS165: Controlling High Blood Pressure",
    description: "Evidence-based workflow for improving hypertension control rates across the patient population.",
    ehr_workflow_steps: [
      "Standardize BP measurement protocol (5-min rest, proper cuff size)",
      "Configure repeat measurement workflow for elevated readings",
      "Set up hypertension patient registry with Azara DRVS",
      "Create medication titration protocol in athenaOne",
      "Implement self-measured BP monitoring program",
    ],
    azara_cadence: "Monthly DRVS panel review with provider-level breakdown",
    pdsa_template: {
      title: "Hypertension Control Rate Improvement",
      root_cause: "Inconsistent BP measurement technique. Lack of medication titration protocol.",
      target_goal: "Improve CMS165 rate from 58% to 75%",
      clinical_workflow_impact: "MA measurement protocol, provider treatment algorithms, patient engagement",
      assigned_staff: ["MA/RN", "Provider", "Care Coordinator"],
    },
  },
  {
    id: "pb-005",
    measure_id: "CMS2v12",
    domain: "Behavioral Health" as PlaybookDomain,
    financial_impact: "High ROI: HRSA Quality Tier + ACO Bonus",
    title: "CMS2v12: Preventive Care & Screening for Depression (PHQ-9)",
    description: "Systematic workflow to ensure universal depression screening with PHQ-9, appropriate follow-up plans, and closed-loop referral tracking for behavioral health services.",
    ehr_workflow_steps: [
      "Add PHQ-2/PHQ-9 screening questionnaire to MA rooming workflow in athenaOne",
      "Configure auto-scoring and threshold alerts for PHQ-9 ≥ 10",
      "Create behavioral health referral order set with warm handoff protocol",
      "Set up follow-up task for positive screens requiring a documented plan",
      "Implement closed-loop tracking for behavioral health referrals and appointments",
    ],
    azara_cadence: "Monthly DRVS depression screening rate review, quarterly outcome tracking with BH team",
    pdsa_template: {
      title: "Depression Screening & Follow-Up Improvement",
      root_cause: "PHQ-9 not consistently administered during visits. Positive screens lack documented follow-up plans. No tracking of BH referral completion.",
      target_goal: "Achieve 85% PHQ-9 screening rate with documented follow-up for all positive screens within 6 months",
      clinical_workflow_impact: "MA screening protocol, provider follow-up documentation, BH warm handoff workflow, care coordinator referral tracking",
      assigned_staff: ["MA/RN", "Provider", "Care Coordinator"],
    },
  },
  {
    id: "pb-006",
    measure_id: "CMS138",
    domain: "Preventive Care" as PlaybookDomain,
    financial_impact: "Medium ROI: HRSA Quality Tier",
    title: "CMS138: Tobacco Use Screening & Cessation Intervention",
    description: "Workflow to ensure consistent tobacco use screening and evidence-based cessation interventions for all patients 18+.",
    ehr_workflow_steps: [
      "Add tobacco use status field to MA rooming workflow in athenaOne",
      "Configure cessation intervention order set (counseling + pharmacotherapy)",
      "Set up Quitline referral integration with auto-fax",
      "Create follow-up task workflow for patients who accept cessation support",
      "Implement 3-month and 6-month tobacco status re-screening alerts",
    ],
    azara_cadence: "Monthly DRVS tobacco screening rate review, quarterly intervention rate analysis",
    pdsa_template: {
      title: "Tobacco Cessation Intervention Improvement",
      root_cause: "Screening is done but cessation interventions are not consistently offered or documented. Quitline referrals are ad hoc.",
      target_goal: "Increase cessation intervention rate from 40% to 70% within 6 months",
      clinical_workflow_impact: "MA screening documentation, provider intervention orders, care coordinator referral follow-up",
      assigned_staff: ["MA/RN", "Provider", "Care Coordinator"],
    },
  },
  {
    id: "pb-007",
    measure_id: "CMS130",
    domain: "Preventive Care" as PlaybookDomain,
    financial_impact: "High ROI: HRSA Quality Tier + ACO Bonus",
    title: "CMS130: Colorectal Cancer Screening",
    description: "Systematic approach to improving colorectal cancer screening rates for patients aged 45-75 using FIT, colonoscopy, and stool DNA testing.",
    ehr_workflow_steps: [
      "Configure age-based screening eligibility alert in athenaOne patient chart",
      "Create FIT kit distribution workflow at front desk/check-out",
      "Set up colonoscopy referral order set with closed-loop tracking",
      "Implement FIT result follow-up and colonoscopy scheduling for positive results",
      "Add patient education and shared decision-making materials to portal",
    ],
    azara_cadence: "Monthly DRVS screening rate review, quarterly FIT return rate tracking",
    pdsa_template: {
      title: "Colorectal Cancer Screening Rate Improvement",
      root_cause: "Low FIT kit return rates. Incomplete colonoscopy referral tracking. Patients not offered screening at eligible visits.",
      target_goal: "Increase CMS130 rate by 20 percentage points in 6 months",
      clinical_workflow_impact: "Front desk FIT distribution, MA eligibility flagging, provider ordering, care coordinator referral tracking",
      assigned_staff: ["Front Desk", "MA/RN", "Provider", "Care Coordinator"],
    },
  },
  {
    id: "pb-008",
    measure_id: "CMS122",
    domain: "Chronic Disease" as PlaybookDomain,
    financial_impact: "High ROI: HRSA Quality Tier + Penalty Avoidance",
    title: "CMS122: Diabetes HbA1c Poor Control (>9%)",
    description: "Comprehensive workflow to reduce the proportion of diabetic patients with poorly controlled HbA1c (>9%) through proactive panel management.",
    ehr_workflow_steps: [
      "Build diabetic patient registry with last HbA1c value and date in Azara DRVS",
      "Configure standing lab orders for HbA1c every 3 months for poorly controlled patients",
      "Create care gap alert for patients overdue for HbA1c lab draw",
      "Set up medication titration protocol with pharmacist collaboration",
      "Implement group visit / diabetes self-management education (DSME) scheduling",
    ],
    azara_cadence: "Monthly DRVS poor control rate review with provider-level breakdown, quarterly pharmacy collaboration meeting",
    pdsa_template: {
      title: "Diabetes HbA1c Poor Control Reduction",
      root_cause: "Inconsistent follow-up scheduling. Lab orders not placed at visits. No standardized medication titration protocol.",
      target_goal: "Reduce CMS122 poor control rate from 38% to 25% within 6 months",
      clinical_workflow_impact: "Standing lab orders, provider medication protocols, care coordinator outreach, pharmacy collaboration",
      assigned_staff: ["Provider", "MA/RN", "Care Coordinator", "QI Manager"],
    },
  },
  {
    id: "pb-009",
    measure_id: "AWV",
    domain: "Financial/ACO" as PlaybookDomain,
    financial_impact: "High ROI: ACO Shared Savings + Revenue Generation",
    title: "ACO Quality Measure Alignment",
    description: "Strategic workflow to align FQHC quality improvement efforts with ACO quality measure requirements for maximum shared savings.",
    ehr_workflow_steps: [
      "Map ACO quality measures to existing UDS measures to identify overlap",
      "Configure ACO-specific quality dashboards in Azara DRVS",
      "Create care gap reports segmented by ACO-attributed patients",
      "Set up provider-level ACO performance scorecards",
      "Implement monthly ACO quality review meetings with leadership",
    ],
    azara_cadence: "Weekly ACO panel review, monthly quality scorecard distribution, quarterly ACO performance analysis",
    pdsa_template: {
      title: "ACO Quality Measure Performance Improvement",
      root_cause: "ACO-attributed patients not identified in workflows. No provider-level accountability for ACO measures. Reactive rather than proactive panel management.",
      target_goal: "Achieve top-quartile performance on 80% of ACO quality measures within 12 months",
      clinical_workflow_impact: "Patient attribution identification, provider scorecards, targeted outreach for ACO gaps",
      assigned_staff: ["QI Manager", "Provider", "Care Coordinator"],
    },
  },
];

export const dashboardMetrics = {
  activePDSA: 4,
  measuresAtRisk: 3,
  tasksDue: 6,
  financialImpact: {
    sharedSavings: 285000,
    revenueProtected: 142000,
    hrsaQualityAward: 98000,
    trend: 12.5,
    grantTrend: 8.2,
  },
  udsTrends: [
    { month: "Jul", CMS124: 48, CMS125: 55, CMS165: 58, CMS122: 38 },
    { month: "Aug", CMS124: 50, CMS125: 56, CMS165: 59, CMS122: 36 },
    { month: "Sep", CMS124: 52, CMS125: 58, CMS165: 61, CMS122: 34 },
    { month: "Oct", CMS124: 55, CMS125: 60, CMS165: 63, CMS122: 32 },
    { month: "Nov", CMS124: 58, CMS125: 62, CMS165: 66, CMS122: 30 },
    { month: "Dec", CMS124: 60, CMS125: 64, CMS165: 68, CMS122: 28 },
  ],
  recentActivity: [
    { id: "a1", text: "PDSA 'Depression Screening' moved to Completed", time: "2 hours ago", type: "success" as const },
    { id: "a2", text: "New task assigned: Train MAs on BP protocol", time: "4 hours ago", type: "info" as const },
    { id: "a3", text: "CMS124 rate improved to 60% (+2%)", time: "1 day ago", type: "success" as const },
    { id: "a4", text: "Task overdue: Establish quitline referral", time: "1 day ago", type: "warning" as const },
    { id: "a5", text: "HbA1c PDSA cycle created by Dr. Martinez", time: "2 days ago", type: "info" as const },
  ],
};
