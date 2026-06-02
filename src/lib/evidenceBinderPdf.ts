import jsPDF from "jspdf";
import type {
  CategoryStatus,
  EvidenceCategory,
  EvidenceDocument,
  EvidenceExportType,
} from "@/types/evidenceBinder";
import { DOCUMENT_TYPE_LABELS } from "@/types/evidenceBinder";
import { computeOverallScore } from "./evidenceCompleteness";

export interface BinderExportInput {
  orgName: string;
  exportType: EvidenceExportType;
  periodLabel: string;
  generatedBy: string;
  categories: EvidenceCategory[];
  documents: EvidenceDocument[];
  statuses: CategoryStatus[];
}

const EXPORT_LABEL: Record<EvidenceExportType, string> = {
  full_osv: "Full HRSA OSV Binder",
  quarterly_qi: "Quarterly QI Report Packet",
  board_packet: "Board Meeting Packet",
};

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function generateBinderPdf(input: BinderExportInput): jsPDF {
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

  // ── Cover page ─────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("MEASUREWISE EVIDENCE BINDER", MARGIN, y);
  y += 30;

  doc.setFontSize(24);
  doc.setTextColor(20);
  doc.text(EXPORT_LABEL[input.exportType], MARGIN, y);
  y += 30;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(input.orgName, MARGIN, y);
  y += 22;
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text(`Reporting period: ${input.periodLabel}`, MARGIN, y);
  y += 16;
  doc.text(`Generated: ${new Date().toLocaleString()}`, MARGIN, y);
  y += 16;
  doc.text(`Prepared by: ${input.generatedBy}`, MARGIN, y);
  y += 36;

  doc.setDrawColor(180);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 24;

  // Completeness snapshot
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text("Binder Completeness", MARGIN, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40);
  doc.text(`Overall: ${computeOverallScore(input.statuses)}%`, MARGIN, y);
  y += 18;
  for (const s of input.statuses) {
    newPageIfNeeded(14);
    const badge =
      s.status === "complete" ? "✓" : s.status === "pending" ? "•" : "!";
    doc.text(
      `${badge}  ${s.category.name} — ${s.score}%  (${s.documentCount} docs${
        s.expiredCount ? `, ${s.expiredCount} expired` : ""
      })`,
      MARGIN,
      y,
    );
    y += 14;
  }

  // ── Table of contents ──────────────────────────────────────
  doc.addPage();
  y = MARGIN;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Table of Contents", MARGIN, y);
  y += 28;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const grouped = new Map<string, EvidenceDocument[]>();
  for (const cat of input.categories) {
    grouped.set(
      cat.id,
      input.documents.filter((d) => d.category_id === cat.id),
    );
  }

  let sectionNum = 1;
  for (const cat of input.categories) {
    const list = grouped.get(cat.id) ?? [];
    if (!list.length && input.exportType !== "full_osv") continue;
    newPageIfNeeded(20);
    doc.setFont("helvetica", "bold");
    doc.text(`${sectionNum}. ${cat.name}`, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${list.length} doc${list.length === 1 ? "" : "s"}`, PAGE_W - MARGIN - 60, y);
    y += 16;
    for (const d of list.slice(0, 8)) {
      newPageIfNeeded(13);
      doc.setTextColor(80);
      doc.text(`    • ${d.title}`, MARGIN, y);
      y += 12;
    }
    if (list.length > 8) {
      doc.text(`    … and ${list.length - 8} more`, MARGIN, y);
      y += 12;
    }
    doc.setTextColor(20);
    y += 6;
    sectionNum += 1;
  }

  // ── Sections ───────────────────────────────────────────────
  sectionNum = 1;
  for (const cat of input.categories) {
    const list = grouped.get(cat.id) ?? [];
    if (!list.length && input.exportType !== "full_osv") continue;

    doc.addPage();
    y = MARGIN;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(10, 92, 107);
    doc.text(`${sectionNum}. ${cat.name}`, MARGIN, y);
    y += 22;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    if (cat.chapter8_reference) {
      doc.text(cat.chapter8_reference, MARGIN, y);
      y += 14;
    }
    if (cat.description) {
      const lines = doc.splitTextToSize(cat.description, PAGE_W - MARGIN * 2);
      doc.text(lines, MARGIN, y);
      y += lines.length * 12 + 8;
    }
    doc.setTextColor(20);

    if (!list.length) {
      doc.setFont("helvetica", "italic");
      doc.setTextColor(140);
      doc.text("No documents on file for this category.", MARGIN, y);
      doc.setTextColor(20);
      doc.setFont("helvetica", "normal");
      y += 20;
    }

    for (const d of list) {
      newPageIfNeeded(80);
      doc.setDrawColor(220);
      doc.setFillColor(250, 250, 248);
      doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 70, 4, 4, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(d.title, MARGIN + 10, y + 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90);
      doc.text(
        `${DOCUMENT_TYPE_LABELS[d.document_type]}  •  ${fmtDate(d.doc_date)}  •  ${d.status}`,
        MARGIN + 10,
        y + 33,
      );
      const meta: string[] = [];
      if (d.associated_measure) meta.push(`Measure: ${d.associated_measure}`);
      if (d.associated_requirement) meta.push(`Req: ${d.associated_requirement}`);
      if (d.expires_at) meta.push(`Expires: ${fmtDate(d.expires_at)}`);
      if (d.review_date) meta.push(`Review: ${fmtDate(d.review_date)}`);
      if (meta.length) {
        const metaLines = doc.splitTextToSize(meta.join("   "), PAGE_W - MARGIN * 2 - 20);
        doc.text(metaLines, MARGIN + 10, y + 48);
      }
      doc.setTextColor(20);
      y += 80;
    }

    sectionNum += 1;
  }

  // Page numbers
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text(`Page ${i} of ${total}`, PAGE_W - MARGIN, PAGE_H - 24, { align: "right" });
    doc.text("MeasureWise Evidence Binder", MARGIN, PAGE_H - 24);
  }

  return doc;
}
