// Shared visual primitives for MeasureWise evidence documents.
// Used by the org-wide OSV/Audit packet and the per-cycle PDSA evidence doc so
// both render with one identical design language.

export const TEAL = "#0e7490";
export const TEAL_LIGHT = "#eaf6f5";
export const GRAY_BORDER = "#e5e7eb";
export const GRAY_TEXT = "#6b7280";
export const COVER_BG = "#1a2e3b";

export const headerBarStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "12px 0", borderBottom: `3px solid ${TEAL}`, marginBottom: "40px",
};

export const sectionLabelStyle: React.CSSProperties = {
  fontSize: "12px", fontWeight: 700, color: TEAL, letterSpacing: "0.05em", marginBottom: "12px",
};

export const sectionTitleStyle: React.CSSProperties = {
  fontSize: "28px", fontWeight: 700, color: "#1a1a1a", marginBottom: "4px",
};

export const tealUnderline: React.CSSProperties = {
  width: "60px", height: "4px", backgroundColor: TEAL, marginBottom: "28px", marginTop: "8px",
};

export const footerStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", fontSize: "11px", color: GRAY_TEXT,
  borderTop: `2px solid ${GRAY_BORDER}`, paddingTop: "8px", marginTop: "auto",
};

export const thStyle: React.CSSProperties = {
  textAlign: "left", padding: "10px 12px", fontWeight: 600, fontSize: "13px",
  backgroundColor: TEAL, color: "#fff",
};

export const tdStyle: React.CSSProperties = {
  padding: "10px 12px", fontSize: "13px", borderBottom: `1px solid ${GRAY_BORDER}`,
};

export const tableStyle: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", border: `1px solid ${GRAY_BORDER}`, borderRadius: "6px",
};

export const pageStyle: React.CSSProperties = {
  width: "800px", minHeight: "1050px", padding: "40px 48px", background: "#fff", color: "#1a1a1a",
  fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", flexDirection: "column",
  pageBreakAfter: "always" as const,
};

export const bodyTextStyle: React.CSSProperties = {
  fontSize: "14px", lineHeight: "1.7", marginBottom: "16px", whiteSpace: "pre-wrap",
};

export function PageHeader({ orgName, docLabel = "HRSA Audit Binder" }: { orgName: string; docLabel?: string }) {
  return (
    <div style={headerBarStyle}>
      <span style={{ fontWeight: 700, fontSize: "14px" }}>MeasureWise</span>
      <span style={{ fontSize: "12px", color: GRAY_TEXT }}>{docLabel} — {orgName}</span>
    </div>
  );
}

export function PageFooter({ pageNum, note = "Confidential — For demonstration purposes only" }: { pageNum: number; note?: string }) {
  return (
    <div style={footerStyle}>
      <span>{note}</span>
      <span>Page {pageNum}</span>
    </div>
  );
}

export function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <>
      <p style={sectionLabelStyle}>{label}</p>
      <h1 style={sectionTitleStyle}>{title}</h1>
      <div style={tealUnderline} />
    </>
  );
}

/** Small "as of" stamp shown under a section heading. */
export function AsOf({ date }: { date?: string | null }) {
  return (
    <p style={{ fontSize: "11px", color: GRAY_TEXT, marginTop: "-20px", marginBottom: "24px" }}>
      {date ? `Last updated ${date}` : "No entries recorded yet"}
    </p>
  );
}

/** Big KPI row used on the document dashboard page. */
export function MetricRow({
  metrics,
}: {
  metrics: { val: string | number; label: string; tone?: "default" | "warning" }[];
}) {
  return (
    <div style={{ display: "flex", gap: "1px", border: `1px solid ${GRAY_BORDER}`, borderRadius: "6px", overflow: "hidden" }}>
      {metrics.map((m) => (
        <div key={m.label} style={{ flex: 1, textAlign: "center", padding: "18px 12px", backgroundColor: TEAL_LIGHT }}>
          <p style={{ fontSize: "26px", fontWeight: 700, color: m.tone === "warning" ? "#b45309" : TEAL }}>{m.val}</p>
          <p style={{ fontSize: "11px", color: GRAY_TEXT, marginTop: "4px" }}>{m.label}</p>
        </div>
      ))}
    </div>
  );
}

export interface TimelineStage {
  label: string;
  date: string | null;
  reached: boolean;
  current: boolean;
}

/** Horizontal Plan → Do → Study → Act → Complete progression strip. */
export function TimelineStrip({ stages }: { stages: TimelineStage[] }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "28px" }}>
      {stages.map((s, i) => (
        <div key={s.label} style={{ flex: 1, textAlign: "center", position: "relative" }}>
          {i > 0 && (
            <div
              style={{
                position: "absolute", top: "13px", left: "-50%", width: "100%", height: "3px",
                backgroundColor: s.reached ? TEAL : GRAY_BORDER,
              }}
            />
          )}
          <div
            style={{
              position: "relative", width: "28px", height: "28px", borderRadius: "50%", margin: "0 auto",
              backgroundColor: s.reached ? TEAL : "#fff",
              border: `3px solid ${s.reached ? TEAL : GRAY_BORDER}`,
              boxShadow: s.current ? `0 0 0 4px ${TEAL_LIGHT}` : "none",
            }}
          />
          <p style={{ fontSize: "12px", fontWeight: 700, marginTop: "8px", color: s.reached ? "#1a1a1a" : GRAY_TEXT }}>
            {s.label}
          </p>
          <p style={{ fontSize: "10px", color: GRAY_TEXT, marginTop: "2px" }}>{s.date ?? "Pending"}</p>
        </div>
      ))}
    </div>
  );
}

/** Greyed-out panel for a stage the cycle has not reached yet. */
export function PendingPanel({ stage, note }: { stage: string; note?: string }) {
  return (
    <div
      style={{
        border: `2px dashed ${GRAY_BORDER}`, borderRadius: "8px", padding: "32px",
        textAlign: "center", backgroundColor: "#fafafa", color: GRAY_TEXT,
      }}
    >
      <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em" }}>PENDING</p>
      <p style={{ fontSize: "13px", marginTop: "8px" }}>
        {note ?? `The ${stage} phase has not started. This section will populate as the cycle progresses.`}
      </p>
    </div>
  );
}

/** Renders a labeled block; shows an honest placeholder when the field is empty. */
export function Field({ label, value, emptyNote, editedOn }: { label: string; value?: string | null; emptyNote: string; editedOn?: string | null }) {
  const filled = typeof value === "string" && value.trim() !== "";
  return (
    <div style={{ marginBottom: "20px" }}>
      <p style={{ fontSize: "12px", fontWeight: 700, color: TEAL, letterSpacing: "0.04em", marginBottom: "6px" }}>
        {label.toUpperCase()}
      </p>
      <p style={{ ...bodyTextStyle, marginBottom: 0, color: filled ? "#1a1a1a" : GRAY_TEXT, fontStyle: filled ? "normal" : "italic" }}>
        {filled ? value : emptyNote}
      </p>
    </div>
  );
}
