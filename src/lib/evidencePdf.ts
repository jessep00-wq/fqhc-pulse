import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ExportOptions {
  /** Diagonal watermark text stamped on every page (free tier / draft). */
  watermark?: string;
}

/**
 * Renders an off-screen DOM node to a paginated US-Letter PDF.
 * Shared by the org-wide HRSA Audit Binder and the per-cycle PDSA evidence document
 * so pagination and margins stay identical between the two.
 * Returns the number of pages written.
 */
export async function exportNodeToPdf(
  node: HTMLElement,
  fileName: string,
  options: ExportOptions = {},
): Promise<number> {
  const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
  const pdf = new jsPDF("p", "in", "letter");
  const pdfWidth = 8.5;
  const pdfHeight = 11;
  const margin = 0.5;
  const imgWidth = pdfWidth - margin * 2;
  const pageContentHeight = pdfHeight - margin * 2;
  const scale = imgWidth / canvas.width;
  const pageHeightInPx = pageContentHeight / scale;

  let yOffset = 0;
  let pageIndex = 0;

  while (yOffset < canvas.height) {
    if (pageIndex > 0) pdf.addPage("letter", "p");
    const sliceHeight = Math.min(pageHeightInPx, canvas.height - yOffset);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;
    const ctx = pageCanvas.getContext("2d");
    if (ctx) ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
    const pageImg = pageCanvas.toDataURL("image/png");
    const drawHeight = sliceHeight * scale;
    pdf.addImage(pageImg, "PNG", margin, margin, imgWidth, drawHeight, undefined, "FAST");

    if (options.watermark) {
      pdf.setFontSize(50);
      pdf.setTextColor(200, 200, 200);
      pdf.saveGraphicsState();
      pdf.text(options.watermark, pdfWidth / 2, pdfHeight / 2, { align: "center", angle: 45 });
      pdf.restoreGraphicsState();
      pdf.setTextColor(0, 0, 0);
    }

    yOffset += sliceHeight;
    pageIndex++;
  }

  pdf.save(fileName);
  return pageIndex;
}

/** Opens the browser print dialog for a cloned copy of the given node. */
export function printNode(node: HTMLElement, title: string) {
  const win = window.open("", "_blank", "width=900,height=1100");
  if (!win) return false;
  win.document.write(
    `<html><head><title>${title}</title><style>
      @page { size: letter portrait; margin: 0.5in; }
      body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    </style></head><body>${node.innerHTML}</body></html>`,
  );
  win.document.close();
  win.focus();
  // Give the cloned markup a tick to lay out before printing.
  setTimeout(() => {
    win.print();
  }, 400);
  return true;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "cycle";
}
