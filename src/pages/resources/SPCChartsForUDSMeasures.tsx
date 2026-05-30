import { ResourcePage } from "@/components/ResourcePage";

export default function SPCChartsForUDSMeasures() {
  return (
    <ResourcePage
      eyebrow="SPC analysis"
      path="/resources/spc-charts-for-uds-measures"
      title="SPC charts for UDS measures: a practical guide for FQHCs"
      description="A Statistical Process Control (SPC) chart turns a noisy month-to-month UDS measure into a clear answer: did the intervention actually change the process, or are you watching normal variation? For FQHCs, SPC is the bridge between QI activity and defensible evidence."
      body={[
        "Most FQHC dashboards show UDS measures as a line chart with a target line. That's enough to spot a trend but not enough to defend a claim. A month-over-month bump might be a real change in the underlying process — or it might be one of the regular ±2σ swings that any healthcare measure shows.",
        "An SPC chart adds three things the standard line chart doesn't: a center line representing the average of the stable period, control limits (typically ±3σ) representing the expected range of normal variation, and a clearly-marked intervention point. With those three elements in place, eight published rules (Western Electric / Nelson rules) tell you whether the post-intervention period is statistically different from baseline.",
        "For UDS measures specifically, the most useful SPC view is the split-limits chart: pre-intervention control limits on the left, post-intervention control limits on the right, and a vertical line marking the PDSA cycle's go-live date. If the post-intervention center line shifts and the chart shows one of the special-cause patterns, you have a defensible improvement story — not just a hopeful trend.",
        "Run SPC on every active UDS measure, not just the ones in active cycles. The 'silent' measures are where regression hides — and where the next HRSA finding comes from.",
      ]}
      checklist={[
        "Pre-intervention center line and ±3σ control limits",
        "Vertical line marking the PDSA intervention date",
        "Post-intervention center line and refreshed control limits",
        "Special-cause flags (runs of 8, 2-of-3 beyond 2σ, trends of 6)",
        "Chart reviewed by the QI committee, not just the QI Director",
      ]}
      related={[
        { to: "/features/spc-charts", label: "SPC charts feature", blurb: "Auto-generated SPC analysis on every UDS measure." },
        { to: "/resources/uds-aligned-pdsa", label: "UDS-aligned PDSA", blurb: "The cycle structure SPC analysis depends on." },
        { to: "/resources/spreadsheet-replacement-qi-tracking", label: "Spreadsheet replacement", blurb: "Why spreadsheets can't carry SPC analysis." },
        { to: "/features/uds-tracking", label: "UDS measure tracking", blurb: "Live trends across all 20+ UDS measures." },
      ]}
    />
  );
}
