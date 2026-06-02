import jsPDF from "jspdf";
import type {
  ApprovalRole,
  BoardSections,
  CommitteeSections,
  QIReport,
  QIReportApproval,
  QIReportBoardAction,
} from "@/types/qiReport";
import { APPROVAL_ROLE_LABEL, APPROVAL_ROLE_ORDER } from "@/types/qiReport";
import { COMMITTEE_SECTIONS } from "@/data/qiReportTemplate";

export interface QIReportPdfInput {
  orgName: string;
  flavor: "committee" | "board";
  report: QIReport;
  approvals: QIReportApproval[];
  boardActions: QIReportBoardAction[];
}

export function generateQIReportPdf(input: QIReportPdfInput): jsPDF {
  const { orgName, flavor, report, approvals, boardActions } = input;
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

  const writeWrapped = (text: string, opts: { size?: number; bold?: boolean; color?: number } = {}) => {
    if (!text) return;
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? 11);
    doc.setTextColor(opts.color ?? 30);
    const lines = doc.splitTextToSize(text, PAGE_W - MARGIN * 2);
    for (const line of lines) {
      newPageIfNeeded(14);
      doc.text(line, MARGIN, y);
      y += (opts.size ?? 11) + 3;
    }
  };

  // Cover
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    flavor === "committee" ? "QI/QA COMMITTEE REPORT" : "BOARD QI/QA REPORT",
    MARGIN,
    y,
  );
  y += 30;
  doc.setFontSize(24);
  doc.setTextColor(20);
  doc.text(`${report.period_label} Quarterly Report`, MARGIN, y);
  y += 28;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text(orgName, MARGIN, y);
  y += 20;
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(
    `Period: ${report.period_start ?? ""} – ${report.period_end ?? ""}`,
    MARGIN,
    y,
  );
  y += 14;
  doc.text(`Generated: ${new Date().toLocaleString()}`, MARGIN, y);
  y += 14;
  doc.text(`Status: ${report.status}`, MARGIN, y);
  y += 30;

  // Signatures block
  doc.setDrawColor(180);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text("Approval Chain", MARGIN, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const role of APPROVAL_ROLE_ORDER) {
    const approval = latestApproval(approvals, role);
    newPageIfNeeded(20);
    const status =
      approval?.decision === "approved"
        ? `Approved ${new Date(approval.decided_at).toLocaleDateString()}`
        : approval?.decision === "changes_requested"
        ? "Changes requested"
        : "Pending";
    const name = approval?.approver_name_snapshot ?? "—";
    doc.setTextColor(20);
    doc.text(`${APPROVAL_ROLE_LABEL[role]}:`, MARGIN, y);
    doc.setTextColor(80);
    doc.text(`${name}  ·  ${status}`, MARGIN + 160, y);
    y += 16;
  }

  // Body
  doc.addPage();
  y = MARGIN;

  if (flavor === "committee") {
    renderCommittee(doc, report.committee_sections, () => newPageIfNeeded, writeWrapped, {
      MARGIN,
      PAGE_W,
      PAGE_H,
    });
  } else {
    renderBoard(doc, report.board_sections, writeWrapped, () => newPageIfNeeded(20));
  }

  // Board actions appendix
  if (boardActions.length) {
    doc.addPage();
    y = MARGIN;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(10, 92, 107);
    doc.text("Board Action Register", MARGIN, y);
    y += 22;
    for (const action of boardActions) {
      newPageIfNeeded(60);
      doc.setFillColor(250, 250, 248);
      doc.setDrawColor(220);
      doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 56, 4, 4, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20);
      doc.text(`[${action.kind}] ${action.title}`, MARGIN + 10, y + 18);
      if (action.detail) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(90);
        const lines = doc.splitTextToSize(action.detail, PAGE_W - MARGIN * 2 - 20);
        doc.text(lines.slice(0, 2), MARGIN + 10, y + 34);
      }
      y += 64;
    }
  }

  // Page numbers + footer
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text(`Page ${i} of ${total}`, PAGE_W - MARGIN, PAGE_H - 24, { align: "right" });
    doc.text(`MeasureWise QI/QA ${flavor === "committee" ? "Committee" : "Board"} Report`, MARGIN, PAGE_H - 24);
  }

  // store y back (linter noop)
  void y;
  return doc;
}

function latestApproval(rows: QIReportApproval[], role: ApprovalRole) {
  return rows
    .filter((r) => r.role === role)
    .sort((a, b) => b.decided_at.localeCompare(a.decided_at))[0];
}

function renderCommittee(
  doc: jsPDF,
  sections: CommitteeSections,
  _newPageIfNeededFactory: () => (n?: number) => void,
  writeWrapped: (text: string, opts?: { size?: number; bold?: boolean; color?: number }) => void,
  layout: { MARGIN: number; PAGE_W: number; PAGE_H: number },
) {
  for (const def of COMMITTEE_SECTIONS) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(10, 92, 107);
    doc.text(def.title, layout.MARGIN, getY(doc));
    setY(doc, getY(doc) + 18);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(def.hrsa_anchor, layout.MARGIN, getY(doc));
    setY(doc, getY(doc) + 14);
    const content = (sections as any)[def.key] as string | undefined;
    writeWrapped(content ?? "—");
    setY(doc, getY(doc) + 10);
  }

  // Measure snapshot table
  if (sections.measures?.length) {
    setY(doc, getY(doc) + 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text("Measure Snapshot", layout.MARGIN, getY(doc));
    setY(doc, getY(doc) + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const m of sections.measures) {
      doc.text(
        `${m.measure_id}  ·  current ${m.current ?? "—"}  ·  baseline ${m.baseline ?? "—"}  ·  goal ${m.goal ?? "—"}  ·  trend ${m.trend}`,
        layout.MARGIN,
        getY(doc),
      );
      setY(doc, getY(doc) + 14);
    }
  }
}

function renderBoard(
  doc: jsPDF,
  sections: BoardSections,
  writeWrapped: (text: string, opts?: { size?: number; bold?: boolean; color?: number }) => void,
  _bumpIfNeeded: () => void,
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(10, 92, 107);
  doc.text("Executive Summary", 54, getY(doc));
  setY(doc, getY(doc) + 22);
  writeWrapped(sections.exec_summary ?? "—");
  setY(doc, getY(doc) + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20);
  doc.text("Performance", 54, getY(doc));
  setY(doc, getY(doc) + 16);
  writeWrapped(sections.performance_summary ?? "—");
  setY(doc, getY(doc) + 8);
  writeWrapped(sections.pdsa_summary ?? "");
  setY(doc, getY(doc) + 10);

  if (sections.top_wins?.length) {
    doc.setFont("helvetica", "bold");
    doc.text("Top Wins", 54, getY(doc));
    setY(doc, getY(doc) + 14);
    for (const w of sections.top_wins) writeWrapped(`• ${w}`);
    setY(doc, getY(doc) + 6);
  }
  if (sections.top_risks?.length) {
    doc.setFont("helvetica", "bold");
    doc.text("Top Risks", 54, getY(doc));
    setY(doc, getY(doc) + 14);
    for (const r of sections.top_risks) writeWrapped(`• ${r}`);
    setY(doc, getY(doc) + 6);
  }
  if (sections.recommendations) {
    doc.setFont("helvetica", "bold");
    doc.text("Recommendations to Board", 54, getY(doc));
    setY(doc, getY(doc) + 14);
    writeWrapped(sections.recommendations);
  }
}

// Tiny jsPDF y-cursor helpers (jsPDF doesn't expose one)
const Y_KEY = Symbol.for("qi-pdf-y");
function getY(doc: jsPDF): number {
  // @ts-expect-error stash on doc
  return doc[Y_KEY] ?? 54;
}
function setY(doc: jsPDF, v: number) {
  // @ts-expect-error stash on doc
  doc[Y_KEY] = v;
  if (v > doc.internal.pageSize.getHeight() - 54) {
    doc.addPage();
    // @ts-expect-error stash on doc
    doc[Y_KEY] = 54;
  }
}
