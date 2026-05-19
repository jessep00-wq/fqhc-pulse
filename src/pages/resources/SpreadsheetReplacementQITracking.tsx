import { ResourcePage } from "@/components/ResourcePage";

export default function SpreadsheetReplacementQITracking() {
  return (
    <ResourcePage
      eyebrow="Spreadsheet replacement"
      path="/resources/spreadsheet-replacement-qi-tracking"
      title="The spreadsheet replacement for FQHC QI tracking"
      description="Most FQHC Quality Directors run their entire QI program out of an Excel workbook. It works — until it doesn't. Here's how to tell when the spreadsheet has become the bottleneck, and what a UDS-aligned replacement actually needs to do."
      body={[
        "The QI spreadsheet is a FQHC fixture. One workbook holds UDS measure tabs, a PDSA cycle log, a committee tracker, a HRSA gap list, and a year of monthly numbers pasted in from athena or Azara DRVS. It's portable, it's free, and it's already on every Quality Director's laptop.",
        "The spreadsheet starts breaking down at three predictable failure modes. First, version drift: every staff member has 'the latest' copy, and none of them agree. Second, evidence gaps: a cycle gets pasted in but the linked UDS measure never gets updated, so the cycle outcome lives in one tab and the measurement lives in another. Third, audit risk: when the OSV letter arrives, no single workbook contains the artifacts a reviewer asks for, so the team rebuilds the binder by hand.",
        "A real replacement isn't 'a nicer spreadsheet.' It's a system where every PDSA cycle names a specific UDS measure, every measure carries an SPC chart, every committee minute references a cycle ID, and every artifact has a timestamp and an owner. That structure is what makes binder exports a one-click operation instead of a two-week project.",
        "Migrating off the spreadsheet doesn't have to be a big-bang. Start with one quarter of UDS-aligned PDSA cycles in the new system, keep the spreadsheet for everything else, and let the workflow win on its own merits.",
      ]}
      checklist={[
        "Single source of truth for active PDSA cycles",
        "UDS measure history pulled from the same source you report on",
        "SPC analysis on every measure, not just the active ones",
        "Committee minutes linked to cycle IDs",
        "Timestamped, owner-attributed audit trail",
      ]}
      related={[
        { to: "/features/uds-tracking", label: "UDS measure tracking", blurb: "Live UDS data instead of monthly paste-ins." },
        { to: "/features/pdsa-cycle-manager", label: "PDSA Cycle Manager", blurb: "Structured cycles linked to UDS measures." },
        { to: "/resources/uds-aligned-pdsa", label: "UDS-aligned PDSA", blurb: "The cycle structure the spreadsheet can't carry." },
        { to: "/blog/uds-measure-tracking-spreadsheet-alternative", label: "Spreadsheet alternative — blog", blurb: "Detailed walkthrough of moving off Excel." },
      ]}
    />
  );
}
