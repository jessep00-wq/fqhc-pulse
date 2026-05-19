import { ResourcePage } from "@/components/ResourcePage";

export default function AthenaOneDocumentationWorkflows() {
  return (
    <ResourcePage
      eyebrow="AthenaOne workflows"
      path="/resources/athenaone-documentation-workflows"
      title="AthenaOne documentation workflows for FQHC UDS reporting"
      description="AthenaOne is the dominant EHR for FQHCs, but UDS measure documentation inside AthenaOne is its own discipline. Getting clean Table 6B and Table 7 data requires standing workflows on top of athena's standard quality module — not against it."
      body={[
        "AthenaOne ships with quality reporting that covers a lot of the UDS measure set out of the box, but FQHC teams quickly hit two problems. First, denominators in athena often don't match the HRSA UDS definitions exactly, which means the number you see in athena isn't the number that ends up on your UDS report. Second, the documentation a HRSA reviewer asks for during an OSV doesn't live in athena's quality module — it lives in the PDSA cycle, the QI committee minutes, and the SPC chart.",
        "The teams that get clean UDS data out of athena tend to share three habits. They reconcile athena's quality numerator/denominator against the UDS definition for every measure before each UDS submission. They use athena's chart abstraction queue as the operational lever for closing care gaps inside an active PDSA cycle, not as a separate compliance task. And they keep cycle documentation outside athena — in a system designed for UDS-aligned PDSA — so the OSV binder isn't a chart-pull project.",
        "MeasureWise sits alongside athena: athena owns the encounter, the chart, and the gap queue; MeasureWise owns the cycle structure, the SPC analysis, and the binder. The two together give an FQHC the operational coverage athena's QI module wasn't designed to provide on its own.",
      ]}
      checklist={[
        "athena quality definitions reconciled against UDS each cycle",
        "Chart abstraction queue mapped to active PDSA cycles",
        "Cycle documentation kept in a UDS-aligned QI system",
        "SPC charts run on the source-of-truth data, not athena's roll-up",
        "Committee minutes reference the same measure ID athena uses",
      ]}
      related={[
        { to: "/features/uds-tracking", label: "UDS measure tracking", blurb: "Track every UDS measure alongside athena's quality module." },
        { to: "/resources/uds-aligned-pdsa", label: "UDS-aligned PDSA", blurb: "Where the cycle structure should actually live." },
        { to: "/resources/spc-charts-for-uds-measures", label: "SPC charts for UDS measures", blurb: "Run SPC on the same data you submit to HRSA." },
        { to: "/blog/uds-clinical-quality-measures-2026", label: "UDS measures 2026", blurb: "What's changing in the next UDS submission." },
      ]}
    />
  );
}
