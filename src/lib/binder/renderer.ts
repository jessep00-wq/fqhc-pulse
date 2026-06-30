import type {
  CategoryStatus,
  EvidenceCategory,
  EvidenceDocument,
  EvidenceExportType,
} from "@/types/evidenceBinder";
import { DOCUMENT_TYPE_LABELS } from "@/types/evidenceBinder";
import { BINDER_CSS } from "./styles";

export interface PdsaCycleLite {
  id: string;
  title: string;
  uds_measure: string | null;
  status: string | null;
  start_date: string | null;
  actual_outcome: string | null;
  next_cycle_decision: string | null;
  updated_at?: string | null;
}

export interface BinderRenderInput {
  orgName: string;
  hrsaGrantNumber: string;
  reportingPeriod: string;
  osvDate: string;
  preparedBy: string;
  exportType: EvidenceExportType;
  categories: EvidenceCategory[]; // canonical 12 in sort order
  documents: EvidenceDocument[];
  statuses: CategoryStatus[];
  pdsaCycles: PdsaCycleLite[];
  preparerNotes?: Record<string, string>; // categoryId -> note
}

const esc = (s: string | null | undefined): string => {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const fmtDate = (d: string | null | undefined): string => {
  if (!d) return '<span class="tag tag-pending">Pending</span>';
  try {
    return esc(
      new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    );
  } catch {
    return esc(d);
  }
};

const statusTag = (status: string): string => {
  if (status === "active")
    return '<span class="tag">Active</span>';
  if (status === "expired")
    return '<span class="tag tag-incomplete">Expired</span>';
  if (status === "archived")
    return '<span class="tag tag-pending">Archived</span>';
  return `<span class="tag">${esc(status)}</span>`;
};

const sectionStatusBadge = (s: CategoryStatus): string => {
  if (s.status === "complete")
    return '<span class="section-status">Complete</span>';
  if (s.status === "pending")
    return '<span class="section-status pending">In Progress</span>';
  return '<span class="section-status incomplete">Needs Attention</span>';
};

const num2 = (n: number) => String(n).padStart(2, "0");

const docsFor = (catId: string, documents: EvidenceDocument[]) =>
  documents.filter((d) => d.category_id === catId && d.status !== "archived");

const pendingCallout = (
  cat: EvidenceCategory,
  guidance: string,
): string => {
  const reqs = (cat.required_doc_types ?? []).map(
    (t) =>
      `<li>${esc(
        DOCUMENT_TYPE_LABELS[t as keyof typeof DOCUMENT_TYPE_LABELS] ?? t,
      )}</li>`,
  );
  return `
    <div class="pending-callout">
      <div class="pc-title">Pending Evidence — Needs Attention</div>
      <p style="font-size:var(--text-sm); color:var(--text-muted); line-height:1.6;">${esc(guidance)}</p>
      ${reqs.length ? `<ul>${reqs.join("")}</ul>` : ""}
    </div>
  `;
};

const evidenceTable = (
  documents: EvidenceDocument[],
  columns: ("type" | "effective" | "board_approval" | "review" | "expires" | "status")[] = [
    "type",
    "effective",
    "review",
    "status",
  ],
): string => {
  if (!documents.length) return "";
  const headers: Record<string, string> = {
    type: "Type",
    effective: "Effective Date",
    board_approval: "Board Approval",
    review: "Review Date",
    expires: "Expires",
    status: "Status",
  };
  const head = `<th>Document</th>${columns.map((c) => `<th>${headers[c]}</th>`).join("")}`;
  const rows = documents
    .map((d) => {
      const cells = columns
        .map((c) => {
          switch (c) {
            case "type":
              return `<td>${esc(DOCUMENT_TYPE_LABELS[d.document_type] ?? d.document_type)}</td>`;
            case "effective":
              return `<td>${fmtDate(d.doc_date)}</td>`;
            case "board_approval":
              // board approval not modeled separately; reuse doc_date for minutes
              return `<td>${fmtDate(d.doc_date)}</td>`;
            case "review":
              return `<td>${fmtDate(d.review_date)}</td>`;
            case "expires":
              return `<td>${fmtDate(d.expires_at)}</td>`;
            case "status":
              return `<td>${statusTag(d.status)}</td>`;
          }
          return "<td></td>";
        })
        .join("");
      return `<tr><td>${esc(d.title)}</td>${cells}</tr>`;
    })
    .join("");
  const columnCount = columns.length + 1;
  return `
    <div class="section-subhead">Evidence Included</div>
    <div class="table-wrap">
      <table class="evidence-table cols-${columnCount}">
        <thead><tr>${head}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
};

const preparerNotesBlock = (note: string | undefined): string => `
  <div class="section-subhead">Preparer Notes / Gaps</div>
  ${
    note && note.trim()
      ? `<div class="preparer-note">${esc(note)}</div>`
      : `<div class="notes-line"></div>`
  }
`;

// ─── Per-section renderers ──────────────────────────────────────────────

const SECTION_DEFS: Record<
  string,
  {
    expectations?: string;
    body?: string;
    emptyGuidance: string;
    columns?: ("type" | "effective" | "board_approval" | "review" | "expires" | "status")[];
    warning?: string;
  }
> = {
  "qi-plan-policy": {
    expectations:
      "A written QI/QA plan describing scope, structure, process, and key responsibilities — board-approved and current within the active performance period. The board must also approve and regularly receive quality reports.",
    body:
      "A plan that exists but has not been board-approved or recently reviewed is a common OSV finding. Board approval must be documented in meeting minutes with an approval vote or formal resolution. Confirm the review date falls within the current performance period.",
    emptyGuidance:
      "Upload your current QI/QA Plan and governing Policy signed and approved by the Board within the last 12 months.",
    columns: ["type", "effective", "board_approval", "review", "status"],
  },
  "operating-procedures": {
    expectations:
      "Operating procedures that address quarterly QI/QA assessments, clinical guidelines, patient safety, patient satisfaction, grievances, and report generation. A written plan that mentions assessments without corresponding operational procedures is insufficient.",
    emptyGuidance:
      "Upload your operating procedures covering quarterly QI assessments, grievances, patient safety incident reporting, and referral/diagnostic tracking.",
    columns: ["type", "effective", "review", "status"],
  },
  "committee-structure": {
    expectations:
      "A functioning committee structure with designated responsible individuals, meeting at minimum six times per year for FTCA deeming. The board must receive regular quality reports.",
    emptyGuidance:
      "Upload your QI/QA Committee Charter, current committee roster, and organizational chart showing reporting lines.",
    columns: ["type", "effective", "status"],
  },
  "job-descriptions": {
    warning:
      'Oral representation that a person "is responsible for quality" is not sufficient. HRSA will review actual job descriptions. The QI accountability language must be written into the document.',
    emptyGuidance:
      "Upload job descriptions for the Quality Director, Medical Director/CMO, and other clinical leaders — each must include explicit QI accountability language.",
    columns: ["type", "review", "status"],
  },
  "qi-schedule": {
    body:
      "A written schedule is a named document required for the OSV. Absence of a written schedule — even if assessments were conducted — is a documentation gap. The schedule must show planned assessments across all four quarters with named responsible parties and committee review dates.",
    emptyGuidance:
      "Upload your written QI/QA Assessment Schedule covering all four quarters with named responsible parties and committee review dates.",
    columns: ["type", "effective", "status"],
  },
  "assessment-samples": {
    warning:
      "HRSA expects at least two completed assessment reports from the past 12 months. Submitting meeting agendas or dashboards in place of actual assessment reports with documented findings, root cause analysis, and corrective action is a common failure mode.",
    body:
      "Each assessment report must include: scope, measures reviewed, period covered, findings, identified gaps or risks, corrective action or improvement plan with owners and due dates, and evidence of QI committee review. Significant findings must show evidence of escalation to the board.",
    emptyGuidance:
      "Upload at least two completed assessment reports from the past 12 months, each with findings, root cause analysis, and corrective action plan.",
    columns: ["type", "effective", "review", "status"],
  },
  "meeting-minutes": {
    body:
      "QI committee and board meeting minutes are the primary evidence that governance and oversight are real rather than nominal. HRSA reviewers will look for evidence that specific measures, assessments, and improvement actions were actually discussed — not just listed on an agenda.",
    emptyGuidance:
      "Upload at least six QI/QA Committee meeting minutes and recent Board of Directors meeting minutes that document QI report review.",
    columns: ["type", "effective", "status"],
  },
  "patient-satisfaction": {
    body:
      "HRSA does not mandate a specific survey instrument or minimum response rate but does expect a systematic process. Reviewers look for trend data, a process for reviewing results, and documentation that results informed an action or improvement.",
    emptyGuidance:
      "Upload your patient satisfaction survey instrument, latest results summary, and the action plan documented in response.",
    columns: ["type", "effective", "review", "status"],
  },
  "dashboards-reports": {
    body:
      "UDS clinical performance measures are the primary data artifact HRSA reviewers will assess. Present current-period data, benchmark or trend comparisons, identification of gaps, and linkage to improvement activities such as PDSA cycles.",
    emptyGuidance:
      "Upload your most recent UDS dashboards and performance reports showing current values, prior-year comparison, targets, and identified gaps.",
    columns: ["type", "effective", "status"],
  },
  "pdsa-packets": {
    warning:
      "Submitting a blank PDSA template or a single incomplete cycle is a common deficiency. Reviewers expect completed cycles with documented predictions, test results, and a clear adopt/adapt/abandon decision linked to UDS measure gaps.",
    emptyGuidance:
      "Complete at least two to three PDSA cycles in the platform linked to UDS measure gaps, with predictions, test results, and an adopt/adapt/abandon decision.",
    columns: ["type", "effective", "status"],
  },
  "board-oversight": {
    body:
      "Quality oversight by the board is both a Chapter 10 and Chapter 19 compliance issue. HRSA expects to see board minutes showing quality dashboards or reports were presented, that the board engaged meaningfully with the data, and that significant quality concerns were addressed at the board level.",
    emptyGuidance:
      "Upload Board of Directors meeting minutes that document QI report presentation, board discussion, and any follow-up actions.",
    columns: ["type", "effective", "status"],
  },
  "credentialing-peer-review": {
    body:
      "Peer review is a required component of the QI/QA program and is separately examined under FTCA deeming. Reviewers look for documented evidence that peer review occurred, findings were reviewed by appropriate leadership, and any corrective action was followed through.",
    emptyGuidance:
      "Upload your peer review policy and a blinded summary of peer review activity for the past 12 months.",
    columns: ["type", "effective", "status"],
  },
};

function renderStandardSection(
  index: number,
  cat: EvidenceCategory,
  status: CategoryStatus,
  documents: EvidenceDocument[],
  notes: Record<string, string>,
): string {
  const def = SECTION_DEFS[cat.slug] ?? { emptyGuidance: "Upload supporting evidence for this section." };
  const docs = docsFor(cat.id, documents);
  const expectationsHtml = def.expectations
    ? `<div class="alert alert-teal"><div><div class="alert-title">What HRSA Expects</div><p>${esc(def.expectations)}</p></div></div>`
    : "";
  const warningHtml = def.warning
    ? `<div class="alert alert-warning"><div><div class="alert-title">Common OSV Gap</div><p>${esc(def.warning)}</p></div></div>`
    : "";
  const bodyHtml = def.body
    ? `<p class="body-text">${esc(def.body)}</p>`
    : "";
  const evidence = docs.length
    ? evidenceTable(docs, def.columns)
    : pendingCallout(cat, def.emptyGuidance);
  return `
    <article class="section-card" id="s${index}">
      <header class="section-header">
        <div class="section-num-badge">${num2(index)}</div>
        <div class="section-heading-group">
          <span class="section-svp">${esc(cat.chapter8_reference ?? "")}</span>
          <h2 class="section-title">${esc(cat.name)}</h2>
        </div>
        ${sectionStatusBadge(status)}
      </header>
      <div class="section-body">
        ${expectationsHtml}
        ${warningHtml}
        ${bodyHtml}
        ${evidence}
        ${preparerNotesBlock(notes[cat.id])}
      </div>
    </article>
  `;
}

// PDSA section gets enriched with live cycle data alongside any uploaded packets.
function renderPdsaSection(
  index: number,
  cat: EvidenceCategory,
  status: CategoryStatus,
  documents: EvidenceDocument[],
  cycles: PdsaCycleLite[],
  notes: Record<string, string>,
): string {
  const def = SECTION_DEFS[cat.slug]!;
  const docs = docsFor(cat.id, documents);
  const cycleRows = cycles.map((c) => {
    const decision = c.next_cycle_decision
      ? `<span class="tag">${esc(c.next_cycle_decision)}</span>`
      : `<span class="tag tag-pending">In Progress</span>`;
    const st =
      c.status === "completed"
        ? '<span class="tag">Complete</span>'
        : `<span class="tag tag-pending">${esc(c.status ?? "Active")}</span>`;
    return `<tr>
      <td>${esc(c.title)}</td>
      <td>${esc(c.uds_measure ?? "—")}</td>
      <td>${fmtDate(c.start_date)}</td>
      <td>${decision}</td>
      <td>${esc(c.actual_outcome ?? "")}</td>
      <td>${st}</td>
    </tr>`;
  }).join("");

  const cycleBlock = cycles.length
    ? `
      <div class="section-subhead">PDSA Cycle Tracker</div>
      <div class="table-wrap">
        <table class="evidence-table cols-6">
          <thead><tr><th>PDSA Title</th><th>UDS Measure</th><th>Start Date</th><th>Decision</th><th>Outcome</th><th>Status</th></tr></thead>
          <tbody>${cycleRows}</tbody>
        </table>
      </div>
    `
    : "";

  const docsBlock = docs.length
    ? evidenceTable(docs, ["type", "effective", "status"])
    : !cycles.length
      ? pendingCallout(cat, def.emptyGuidance)
      : "";

  return `
    <article class="section-card" id="s${index}">
      <header class="section-header">
        <div class="section-num-badge">${num2(index)}</div>
        <div class="section-heading-group">
          <span class="section-svp">${esc(cat.chapter8_reference ?? "")}</span>
          <h2 class="section-title">${esc(cat.name)}</h2>
        </div>
        ${sectionStatusBadge(status)}
      </header>
      <div class="section-body">
        <div class="alert alert-warning"><div><div class="alert-title">Common Gap</div><p>${esc(def.warning!)}</p></div></div>
        ${cycleBlock}
        ${docsBlock}
        ${preparerNotesBlock(notes[cat.id])}
      </div>
    </article>
  `;
}

const GAPS_REF: { gap: string; risk: "high" | "med"; mitigation: string }[] = [
  { gap: "QI/QA Plan not board-approved or outdated", risk: "high", mitigation: "Confirm board approval is documented in minutes; update annually" },
  { gap: "QI assessments scheduled but not completed", risk: "high", mitigation: "Submit completed assessment reports with findings and corrective action" },
  { gap: "Meeting minutes show agenda items without substantive discussion", risk: "med", mitigation: "Train recorder; use action-item and discussion log format" },
  { gap: "PDSA packets blank or not linked to a performance gap", risk: "high", mitigation: "Complete at minimum 2 cycles tied to UDS gaps; include data" },
  { gap: "Patient satisfaction results not linked to action plan", risk: "med", mitigation: "Document corrective action or continuous monitoring plan" },
  { gap: "Job descriptions do not reference QI accountability", risk: "med", mitigation: "Update JDs for Quality Director and CMO before OSV" },
  { gap: "Board minutes do not reflect QI report discussion", risk: "high", mitigation: "Brief board chair; ensure minutes capture QI discussion content" },
  { gap: "UDS data presented without trend or benchmark comparison", risk: "med", mitigation: "Add prior-year column and national or state comparison benchmark" },
  { gap: "No peer review documentation", risk: "high", mitigation: "Prepare blinded summary of peer review activity for past 12 months" },
];

function renderGapsSection(): string {
  const rows = GAPS_REF.map(
    (g) => `<tr>
      <td>${esc(g.gap)}</td>
      <td><span class="risk-${g.risk}">${g.risk === "high" ? "HIGH" : "MEDIUM"}</span></td>
      <td>${esc(g.mitigation)}</td>
    </tr>`,
  ).join("");
  return `
    <article class="section-card" id="gaps">
      <header class="section-header">
        <div class="section-num-badge" style="background:rgba(180,75,26,0.15); color:#7A3D0F;">!</div>
        <div class="section-heading-group">
          <span class="section-svp">Reference Guide</span>
          <h2 class="section-title">Common OSV Gaps &amp; Mitigations</h2>
        </div>
      </header>
      <div class="section-body">
        <div class="table-wrap">
          <table class="evidence-table gaps-table cols-3">
            <thead><tr><th>Common Gap</th><th>Risk Level</th><th>Mitigation</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </article>
  `;
}

const PREP_ITEMS: { label: string; isDone: (s: CategoryStatus[]) => boolean }[] = [
  { label: "All binder sections complete and reviewed by QI Lead", isDone: (s) => s.every((x) => x.status === "complete") },
  { label: "Documents labeled per HRSA file naming convention", isDone: () => false },
  { label: "Board approval of QI/QA Plan confirmed in minutes", isDone: (s) => s.find((x) => x.category.slug === "qi-plan-policy")?.status === "complete" },
  { label: "At least two completed QI/QA assessment reports included", isDone: (s) => (s.find((x) => x.category.slug === "assessment-samples")?.documentCount ?? 0) >= 2 },
  { label: "At least six QI committee meeting minutes included", isDone: (s) => (s.find((x) => x.category.slug === "meeting-minutes")?.documentCount ?? 0) >= 6 },
  { label: "At least two to three completed PDSA packets included", isDone: (s) => (s.find((x) => x.category.slug === "pdsa-packets")?.documentCount ?? 0) >= 2 },
  { label: "UDS data current with trend comparison", isDone: (s) => s.find((x) => x.category.slug === "dashboards-reports")?.status === "complete" },
  { label: "Board minutes with QI report review included", isDone: (s) => s.find((x) => x.category.slug === "board-oversight")?.status === "complete" },
  { label: "Job descriptions with QI language confirmed", isDone: (s) => s.find((x) => x.category.slug === "job-descriptions")?.status === "complete" },
  { label: "Peer review documentation included or accessible", isDone: (s) => s.find((x) => x.category.slug === "credentialing-peer-review")?.status === "complete" },
  { label: "Binder reviewed by CEO, CMO, and Compliance", isDone: () => false },
  { label: "Binder submitted per HRSA file naming convention", isDone: () => false },
];

function renderPrepSection(statuses: CategoryStatus[]): string {
  const items = PREP_ITEMS.map((p) => {
    const done = p.isDone(statuses);
    return `<div class="prep-item"><div class="prep-check ${done ? "checked" : ""}">${done ? "✓" : ""}</div><span>${esc(p.label)}</span></div>`;
  }).join("");
  return `
    <article class="section-card" id="prep">
      <header class="section-header">
        <div class="section-num-badge" style="background: var(--teal);">✓</div>
        <div class="section-heading-group">
          <span class="section-svp">Pre-OSV Preparation</span>
          <h2 class="section-title">Two-Week Pre-Submission Checklist</h2>
        </div>
      </header>
      <div class="section-body">
        <div class="prep-grid">${items}</div>
        <div class="section-subhead">Sign-Off</div>
        <div class="signoff-grid">
          <div class="signoff-item"><div class="signoff-label">QI Team Lead</div><div class="signoff-date">Date: ____________________</div></div>
          <div class="signoff-item"><div class="signoff-label">Quality Director</div><div class="signoff-date">Date: ____________________</div></div>
          <div class="signoff-item"><div class="signoff-label">Medical Director / CMO</div><div class="signoff-date">Date: ____________________</div></div>
          <div class="signoff-item"><div class="signoff-label">CEO / Executive Director</div><div class="signoff-date">Date: ____________________</div></div>
        </div>
      </div>
    </article>
  `;
}

const LOGO_SVG = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
  <rect x="2" y="10" width="3" height="6" rx="1" fill="white" opacity="0.6"/>
  <rect x="7.5" y="6" width="3" height="10" rx="1" fill="white" opacity="0.85"/>
  <rect x="13" y="2" width="3" height="14" rx="1" fill="white"/>
</svg>`;

const EXPORT_LABEL: Record<EvidenceExportType, string> = {
  full_osv: "Full HRSA OSV Binder",
  quarterly_qi: "Quarterly QI Report Packet",
  board_packet: "Board Meeting Packet",
};

export function renderBinderHtml(input: BinderRenderInput): string {
  const {
    orgName,
    hrsaGrantNumber,
    reportingPeriod,
    osvDate,
    preparedBy,
    exportType,
    categories,
    documents,
    statuses,
    pdsaCycles,
    preparerNotes = {},
  } = input;

  const overallScore =
    statuses.length === 0
      ? 0
      : Math.round(
          statuses.reduce((a, s) => a + s.score, 0) / statuses.length,
        );

  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Cover ring math
  const radius = 32;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - overallScore / 100);

  const completenessItems = statuses
    .map(
      (s) =>
        `<li class="${s.status === "complete" ? "" : "missing"}">${esc(s.category.name)}</li>`,
    )
    .join("");

  const tocItems = categories
    .map(
      (c, i) =>
        `<a href="#s${i + 1}" class="toc-item"><div class="toc-num">${i + 1}</div><span class="toc-text">${esc(c.name)}</span></a>`,
    )
    .join("");

  const sectionsHtml = categories
    .map((cat, i) => {
      const idx = i + 1;
      const status =
        statuses.find((s) => s.category.id === cat.id) ?? {
          category: cat,
          documentCount: 0,
          expiredCount: 0,
          expiringSoonCount: 0,
          status: "missing" as const,
          score: 0,
        };
      if (cat.slug === "pdsa-packets") {
        return renderPdsaSection(idx, cat, status, documents, pdsaCycles, preparerNotes);
      }
      return renderStandardSection(idx, cat, status, documents, preparerNotes);
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MeasureWise — HRSA OSV Evidence Binder — ${esc(orgName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>${BINDER_CSS}</style>
</head>
<body>

<section class="cover" aria-label="Binder cover page">
  <div class="cover-grid">
    <div class="cover-left">
      <div class="cover-eyebrow">${esc(EXPORT_LABEL[exportType])} · ${new Date().getFullYear()}</div>
      <h1 class="cover-title">HRSA Operational<br>Site Visit<br><span>Evidence Binder</span></h1>
      <p class="cover-subtitle">A complete, compliance-mapped audit binder for Federally Qualified Health Centers. Aligned to the HRSA Health Center Program Site Visit Protocol and Compliance Manual.</p>
      <div class="cover-meta-grid">
        <div class="cover-meta-item"><div class="cover-meta-label">Organization</div><div class="cover-meta-value">${esc(orgName) || "—"}</div></div>
        <div class="cover-meta-item"><div class="cover-meta-label">HRSA Grant #</div><div class="cover-meta-value">${esc(hrsaGrantNumber) || "—"}</div></div>
        <div class="cover-meta-item"><div class="cover-meta-label">Reporting Period</div><div class="cover-meta-value">${esc(reportingPeriod) || "—"}</div></div>
        <div class="cover-meta-item"><div class="cover-meta-label">OSV Date</div><div class="cover-meta-value">${esc(osvDate) || "—"}</div></div>
        <div class="cover-meta-item"><div class="cover-meta-label">Prepared By</div><div class="cover-meta-value">${esc(preparedBy) || "—"}</div></div>
        <div class="cover-meta-item"><div class="cover-meta-label">Date Generated</div><div class="cover-meta-value">${esc(generatedDate)}</div></div>
      </div>
    </div>
    <div class="cover-completeness">
      <div class="completeness-label">Binder Completeness</div>
      <div class="completeness-ring">
        <svg viewBox="0 0 80 80">
          <circle class="ring-bg" cx="40" cy="40" r="${radius}"/>
          <circle class="ring-fill" cx="40" cy="40" r="${radius}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="completeness-pct">${overallScore}%</div>
      </div>
      <ul class="completeness-items">${completenessItems}</ul>
    </div>
  </div>
</section>

<nav class="toc-section" aria-label="Table of contents">
  <div class="toc-inner">
    <div class="toc-heading">Table of Contents</div>
    <div class="toc-grid">
      ${tocItems}
      <a href="#gaps" class="toc-item"><div class="toc-num" style="background:rgba(180,75,26,0.12); color:#7A3D0F;">!</div><span class="toc-text">Common OSV Gaps Reference</span></a>
      <a href="#prep" class="toc-item"><div class="toc-num">✓</div><span class="toc-text">Pre-OSV Preparation Checklist</span></a>
    </div>
  </div>
</nav>

<main class="main-content">
  ${sectionsHtml}
  ${renderGapsSection()}
  ${renderPrepSection(statuses)}
</main>

<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <div class="footer-logo-mark">${LOGO_SVG}</div>
      <span class="footer-name">Measure<span>Wise</span></span>
    </div>
    <p class="footer-meta">The only quality improvement platform built exclusively for FQHCs · measurewise.org</p>
    <p class="footer-meta">Generated ${esc(generatedDate)}</p>
  </div>
</footer>

</body>
</html>`;
}

/**
 * Open the rendered binder in a hidden iframe, wait for fonts, then trigger
 * the browser's native print dialog (Save as PDF).
 * Falls back to a popup window if iframe printing is blocked.
 */
export async function printBinder(input: BinderRenderInput): Promise<void> {
  const html = renderBinderHtml(input);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  await new Promise<void>((resolve, reject) => {
    const doc = iframe.contentDocument;
    if (!doc) {
      reject(new Error("Could not access iframe document"));
      return;
    }
    iframe.onload = () => resolve();
    doc.open();
    doc.write(html);
    doc.close();
  });

  const win = iframe.contentWindow;
  if (!win) throw new Error("Could not access iframe window");

  // Wait for fonts and layout
  try {
    const fonts = (win.document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
    if (fonts?.ready) await fonts.ready;
  } catch {
    /* ignore */
  }
  await new Promise((r) => setTimeout(r, 250));

  try {
    win.focus();
    win.print();
  } catch (e) {
    // Fallback: open in new tab
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => {
        w.focus();
        w.print();
      }, 500);
    } else {
      throw e;
    }
  }

  // Clean up after the print dialog closes
  setTimeout(() => {
    iframe.remove();
  }, 60_000);
}
