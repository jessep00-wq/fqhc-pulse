import jsPDF from "jspdf";

export interface AuditBinderPdfPdsaCycle {
  id: string;
  title: string;
  aim_statement: string | null;
  root_cause: string | null;
  test_description: string | null;
  prediction: string | null;
  study_results: string | null;
  what_worked: string | null;
  what_didnt_work: string | null;
  act_next_steps: string | null;
  decision: string | null;
  status: string;
  uds_measure: string | null;
  assigned_staff: string[] | null;
  population: string | null;
  data_source: string | null;
  review_cadence: string | null;
  created_at: string;
}

export interface AuditBinderPdfMeeting {
  meeting_date: string;
  chair_name: string | null;
  attendees: string[];
  agenda_summary: string[];
  key_decisions: string[];
}

export interface AuditBinderPdfOversightRow {
  area: string;
  owner: string;
  review_frequency: string | null;
  documentation_location: string | null;
}

export interface AuditBinderPdfMeasureRow {
  measure_id: string;
  baseline: number | null;
  current: number | null;
  target: number | null;
  status: "Improving" | "Declining" | "At target" | "Flat";
}

export interface AuditBinderPdfEvidenceRow {
  title: string;
  related: string | null;
  owner: string | null;
  status: string;
}

export interface AuditBinderPdfTaskRow {
  title: string;
  assigned_role: string | null;
  due_date: string | null;
  priority: string | null;
  status: string;
}

export interface AuditBinderPdfChecklistRow {
  requirement: string;
  evidence: "Yes" | "No" | "Partial";
  notes: string;
}

export interface AuditBinderPdfInput {
  orgName: string;
  periodStart: string;
  periodEnd: string;
  generatedBy: string;
  executiveSummary: string | null;
  oversight: AuditBinderPdfOversightRow[];
  pdsaCycles: AuditBinderPdfPdsaCycle[];
  measures: AuditBinderPdfMeasureRow[];
  evidenceRows: AuditBinderPdfEvidenceRow[];
  openTasks: AuditBinderPdfTaskRow[];
  meetings: AuditBinderPdfMeeting[];
  checklist: AuditBinderPdfChecklistRow[];
  stats: {
    activePdsaCount: number;
    measuresMonitored: number;
    evidenceItemsTracked: number;
  };
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncate(s: string | null | undefined, n: number): string {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

const STANDARD_WORKFLOW = [
  "Identify priority gap or audit risk.",
  "Open or update a PDSA project.",
  "Assign interventions and owners.",
  "Review data trend and implementation status.",
  "Document decision to adopt, adapt, or abandon.",
  "Export binder-ready evidence packet for leadership or survey review.",
];

const FOLDER_STRUCTURE = [
  "Audit Binder",
  "  01 Quality Infrastructure",
  "  02 Measure Monitoring",
  "  03 PDSA Cycle Summaries",
  "  04 Detailed PDSA Logs",
  "  05 Evidence Register",
  "  06 Committee Minutes",
  "  07 Audit Readiness Checklist",
];

export function generateAuditBinderPdf(input: AuditBinderPdfInput): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const MARGIN = 54;
  let y = MARGIN;

  const newPageIfNeeded = (needed = 60) => {
    if (y + needed > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const sectionHeader = (label: string) => {
    doc.addPage();
    y = MARGIN;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(10, 92, 107);
    doc.text(label, MARGIN, y);
    y += 24;
    doc.setTextColor(20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
  };

  const paragraph = (text: string, opts?: { italic?: boolean; muted?: boolean; size?: number }) => {
    const size = opts?.size ?? 11;
    doc.setFont("helvetica", opts?.italic ? "italic" : "normal");
    doc.setFontSize(size);
    if (opts?.muted) doc.setTextColor(110);
    const lines = doc.splitTextToSize(text, PAGE_W - MARGIN * 2);
    for (const line of lines) {
      newPageIfNeeded(size + 4);
      doc.text(line, MARGIN, y);
      y += size + 3;
    }
    doc.setTextColor(20);
    doc.setFont("helvetica", "normal");
  };

  const drawTable = (
    headers: string[],
    rows: string[][],
    colWidths: number[],
  ) => {
    const rowH = 18;
    const startX = MARGIN;

    const renderHeader = () => {
      doc.setFillColor(10, 92, 107);
      doc.setTextColor(255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      let x = startX;
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowH, "F");
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], x + 6, y + 12);
        x += colWidths[i];
      }
      y += rowH;
      doc.setTextColor(20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    };

    renderHeader();

    let zebra = false;
    for (const row of rows) {
      // Compute wrapped lines per cell
      const wrapped = row.map((cell, i) =>
        doc.splitTextToSize(cell ?? "—", colWidths[i] - 12),
      );
      const cellH = Math.max(rowH, wrapped.reduce((m, w) => Math.max(m, w.length), 1) * 12 + 8);
      if (y + cellH > PAGE_H - MARGIN) {
        doc.addPage();
        y = MARGIN;
        renderHeader();
      }
      if (zebra) {
        doc.setFillColor(247, 248, 247);
        doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), cellH, "F");
      }
      doc.setDrawColor(225);
      doc.line(startX, y + cellH, startX + colWidths.reduce((a, b) => a + b, 0), y + cellH);
      let x = startX;
      for (let i = 0; i < row.length; i++) {
        doc.text(wrapped[i], x + 6, y + 12);
        x += colWidths[i];
      }
      y += cellH;
      zebra = !zebra;
    }
    y += 10;
  };

  // ── Cover ───────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("MEASUREWISE AUDIT BINDER", MARGIN, y);
  y += 30;

  doc.setFontSize(26);
  doc.setTextColor(20);
  doc.text("MeasureWise Audit Binder", MARGIN, y);
  y += 32;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(input.orgName, MARGIN, y);
  y += 22;
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text(`Reporting period: ${fmtDate(input.periodStart)} – ${fmtDate(input.periodEnd)}`, MARGIN, y);
  y += 16;
  doc.text(`Generated: ${new Date().toLocaleString()}`, MARGIN, y);
  y += 16;
  doc.text(`Prepared by: ${input.generatedBy}`, MARGIN, y);
  y += 30;

  doc.setDrawColor(180);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 24;

  // Badge stats
  const badges: { label: string; value: number }[] = [
    { label: "Active PDSA Projects", value: input.stats.activePdsaCount },
    { label: "Measures Monitored", value: input.stats.measuresMonitored },
    { label: "Evidence Items Tracked", value: input.stats.evidenceItemsTracked },
  ];
  const badgeW = (PAGE_W - MARGIN * 2 - 24) / 3;
  const badgeH = 70;
  for (let i = 0; i < badges.length; i++) {
    const bx = MARGIN + i * (badgeW + 12);
    doc.setFillColor(240, 248, 250);
    doc.setDrawColor(10, 92, 107);
    doc.roundedRect(bx, y, badgeW, badgeH, 6, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(10, 92, 107);
    doc.text(String(badges[i].value), bx + 12, y + 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80);
    const lbl = doc.splitTextToSize(badges[i].label, badgeW - 24);
    doc.text(lbl, bx + 12, y + 50);
  }
  y += badgeH + 20;
  doc.setTextColor(20);

  if (input.executiveSummary && input.executiveSummary.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Executive Summary", MARGIN, y);
    y += 16;
    paragraph(input.executiveSummary.trim());
  }

  // ── Section 1 — Quality Infrastructure ─────────────
  sectionHeader("1. Quality Infrastructure Summary");
  if (input.oversight.length === 0) {
    paragraph("No oversight roles documented yet. Add entries on the Audit Binder page.", { italic: true, muted: true });
  } else {
    drawTable(
      ["Area", "Owner", "Review Frequency", "Documentation Location"],
      input.oversight.map((r) => [
        r.area,
        r.owner || "—",
        r.review_frequency || "—",
        r.documentation_location || "—",
      ]),
      [140, 130, 100, 133],
    );
  }
  newPageIfNeeded(120);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Standard Workflow", MARGIN, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  STANDARD_WORKFLOW.forEach((step, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${step}`, PAGE_W - MARGIN * 2);
    newPageIfNeeded(lines.length * 14 + 4);
    doc.text(lines, MARGIN, y);
    y += lines.length * 14 + 2;
  });

  // ── Section 2 — Measure Monitoring ─────────────
  sectionHeader("2. Measure Monitoring Snapshot");
  if (input.measures.length === 0) {
    paragraph("No measure trend data logged for this period.", { italic: true, muted: true });
  } else {
    drawTable(
      ["Measure", "Baseline", "Current", "Target", "Status"],
      input.measures.map((m) => [
        m.measure_id,
        m.baseline != null ? String(m.baseline) : "—",
        m.current != null ? String(m.current) : "—",
        m.target != null ? String(m.target) : "—",
        m.status,
      ]),
      [170, 70, 70, 70, 123],
    );
  }

  // ── Section 3 — Active PDSA Cycle Summaries ────
  sectionHeader("3. Active PDSA Cycle Summaries");
  if (input.pdsaCycles.length === 0) {
    paragraph("No PDSA cycles created within this period.", { italic: true, muted: true });
  } else {
    drawTable(
      ["Project", "Aim", "Owner", "Start", "Stage", "Decision"],
      input.pdsaCycles.map((p) => [
        truncate(p.title, 60),
        truncate(p.aim_statement, 80),
        (p.assigned_staff ?? []).join(", ") || "—",
        fmtDate(p.created_at),
        p.status,
        p.decision || "—",
      ]),
      [90, 130, 80, 70, 60, 73],
    );
  }

  // ── Section 4 — Detailed PDSA Documentation ────
  sectionHeader("4. Detailed PDSA Documentation");
  if (input.pdsaCycles.length === 0) {
    paragraph("No PDSA cycles to document for this period.", { italic: true, muted: true });
  } else {
    for (const p of input.pdsaCycles) {
      newPageIfNeeded(120);
      const blockStartY = y;
      doc.setDrawColor(220);
      doc.setFillColor(250, 250, 248);

      // Title bar
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(10, 92, 107);
      const titleLines = doc.splitTextToSize(p.title, PAGE_W - MARGIN * 2 - 20);
      newPageIfNeeded(titleLines.length * 16 + 10);
      doc.text(titleLines, MARGIN, y + 4);
      y += titleLines.length * 16 + 6;
      doc.setTextColor(20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(110);
      doc.text(
        `Status: ${p.status}  •  Started: ${fmtDate(p.created_at)}  •  Measure: ${p.uds_measure || "—"}`,
        MARGIN,
        y,
      );
      y += 14;
      doc.setTextColor(20);

      const labeledBlock = (label: string, value: string | null | undefined) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        newPageIfNeeded(20);
        doc.text(label, MARGIN, y);
        y += 12;
        paragraph(value && value.trim() ? value : "—", { size: 10 });
        y += 2;
      };

      labeledBlock("Aim", p.aim_statement);
      labeledBlock("Problem Statement", p.root_cause);

      const phaseHeader = (label: string) => {
        newPageIfNeeded(22);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(10, 92, 107);
        doc.text(label, MARGIN, y);
        doc.setTextColor(20);
        y += 14;
      };

      // Plan
      phaseHeader("Plan");
      labeledBlock("Change Idea", p.test_description);
      labeledBlock("Prediction", p.prediction);
      labeledBlock("Population", p.population);
      labeledBlock("Data Source", p.data_source);
      labeledBlock("Review Cadence", p.review_cadence);

      // Do
      phaseHeader("Do");
      labeledBlock("Implementation Narrative", p.test_description);

      // Study
      phaseHeader("Study");
      labeledBlock("Results", p.study_results);
      if (p.what_worked) labeledBlock("What Worked", p.what_worked);
      if (p.what_didnt_work) labeledBlock("What Didn't Work", p.what_didnt_work);

      // Act
      phaseHeader("Act");
      labeledBlock("Next Steps", p.act_next_steps);
      labeledBlock("Decision", p.decision);

      // Divider
      newPageIfNeeded(20);
      doc.setDrawColor(220);
      doc.line(MARGIN, y, PAGE_W - MARGIN, y);
      y += 16;
      void blockStartY;
    }
  }

  // ── Section 5 — Evidence & Task Tracking ───────
  sectionHeader("5. Evidence & Task Tracking");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Evidence Register", MARGIN, y);
  y += 16;
  if (input.evidenceRows.length === 0) {
    paragraph("No evidence documents recorded for this period.", { italic: true, muted: true });
  } else {
    drawTable(
      ["Evidence Item", "Related Standard/Use", "Owner", "Status"],
      input.evidenceRows.map((e) => [
        truncate(e.title, 60),
        e.related || "—",
        e.owner || "—",
        e.status,
      ]),
      [180, 150, 90, 83],
    );
  }
  newPageIfNeeded(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Open Tasks", MARGIN, y);
  y += 16;
  if (input.openTasks.length === 0) {
    paragraph("No open tasks. All improvement actions tracked to closure.", { italic: true, muted: true });
  } else {
    drawTable(
      ["Task", "Owner", "Due Date", "Priority", "Status"],
      input.openTasks.map((t) => [
        truncate(t.title, 60),
        t.assigned_role || "—",
        fmtDate(t.due_date),
        t.priority || "—",
        t.status,
      ]),
      [180, 100, 80, 70, 73],
    );
  }

  // ── Section 6 — Meeting Documentation ─────────
  sectionHeader("6. Meeting Documentation");
  if (input.meetings.length === 0) {
    paragraph("No QI committee meetings logged for this period.", { italic: true, muted: true });
  } else {
    for (const m of input.meetings) {
      newPageIfNeeded(80);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(10, 92, 107);
      doc.text(`${fmtDate(m.meeting_date)} — Chair: ${m.chair_name || "—"}`, MARGIN, y);
      doc.setTextColor(20);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      paragraph(`Attendees: ${(m.attendees ?? []).join(", ") || "—"}`, { size: 10 });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      newPageIfNeeded(16);
      doc.text("Agenda Summary", MARGIN, y);
      y += 12;
      doc.setFont("helvetica", "normal");
      if (!m.agenda_summary?.length) {
        paragraph("—", { size: 10, muted: true });
      } else {
        for (const item of m.agenda_summary) {
          const lines = doc.splitTextToSize(`• ${item}`, PAGE_W - MARGIN * 2 - 10);
          newPageIfNeeded(lines.length * 12 + 4);
          doc.text(lines, MARGIN + 8, y);
          y += lines.length * 12 + 2;
        }
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      newPageIfNeeded(16);
      doc.text("Key Decisions", MARGIN, y);
      y += 12;
      doc.setFont("helvetica", "normal");
      if (!m.key_decisions?.length) {
        paragraph("—", { size: 10, muted: true });
      } else {
        for (const item of m.key_decisions) {
          const lines = doc.splitTextToSize(`• ${item}`, PAGE_W - MARGIN * 2 - 10);
          newPageIfNeeded(lines.length * 12 + 4);
          doc.text(lines, MARGIN + 8, y);
          y += lines.length * 12 + 2;
        }
      }
      y += 8;
      doc.setDrawColor(220);
      doc.line(MARGIN, y, PAGE_W - MARGIN, y);
      y += 14;
    }
  }

  // ── Section 7 — Audit Readiness Checklist ─────
  sectionHeader("7. Audit Readiness Checklist");
  drawTable(
    ["Requirement Area", "Evidence Present", "Notes"],
    input.checklist.map((c) => [c.requirement, c.evidence, c.notes]),
    [200, 90, 213],
  );

  // ── Appendix A — Folder Structure ────────────
  sectionHeader("Appendix A — Folder Structure");
  doc.setFont("courier", "normal");
  doc.setFontSize(11);
  for (const line of FOLDER_STRUCTURE) {
    newPageIfNeeded(14);
    doc.text(line, MARGIN, y);
    y += 14;
  }
  doc.setFont("helvetica", "normal");

  // ── Appendix B — Disclaimer ──────────────────
  sectionHeader("Appendix B — Disclaimer");
  paragraph(
    `This Audit Binder reflects data entered into MeasureWise by ${input.orgName} as of ${new Date().toLocaleString()}. Completeness depends on what has been logged for this reporting period. Review the Audit Readiness Checklist (Section 7) for any gaps before relying on this binder for an HRSA operational site visit or other external review.`,
  );

  // Page numbers
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text(`Page ${i} of ${total}`, PAGE_W - MARGIN, PAGE_H - 24, { align: "right" });
    doc.text("MeasureWise Audit Binder", MARGIN, PAGE_H - 24);
  }

  return doc;
}
