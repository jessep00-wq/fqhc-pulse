import { ResourcePage } from "@/components/ResourcePage";

export default function UDSAlignedPDSA() {
  return (
    <ResourcePage
      eyebrow="UDS-aligned PDSA"
      path="/resources/uds-aligned-pdsa"
      title="UDS-aligned PDSA: how to run cycles that actually move the measure"
      description="A UDS-aligned PDSA cycle is a Plan-Do-Study-Act improvement cycle that names the specific UDS clinical quality measure it intends to move, sets a numeric aim against that measure, and proves the change with SPC analysis. It's the difference between QI activity and HRSA-defensible improvement."
      body={[
        "Most FQHC quality teams run PDSA cycles. Few of those cycles are wired to a specific UDS line item — so even when the cycle 'succeeds,' the UDS report tells a different story. UDS-aligned PDSA closes that gap. Every cycle in the system points at one of the 20+ UDS clinical quality measures, carries a numeric aim ('move A1c >9 control from 28% to 22% by Q3'), and ends with an SPC chart showing whether the change was real or random.",
        "This matters because HRSA reviewers, QI committees, and grant funders all read the same numbers — the UDS report. If your improvement narrative isn't structured around those numbers, you're translating between two languages every time someone asks 'what's working?' UDS-aligned PDSA removes the translation step: the cycle, the measure, and the chart are one artifact.",
        "Structurally, a UDS-aligned PDSA cycle has four moving parts: (1) the UDS measure being targeted, (2) a baseline pulled from the same data source you'll use to verify the change, (3) the intervention with a specific operational owner and a date range, and (4) the post-intervention SPC analysis split at the intervention point. Anything less and you've just done 'a project.'",
        "The fastest place to start is your three slowest-moving UDS measures from last year's report. Build one UDS-aligned PDSA cycle against each, run it for a single quarter, and bring the SPC chart to your next QI committee. That's the documentation HRSA wants to see and the proof your board has been asking for.",
      ]}
      checklist={[
        "Every active PDSA cycle names a specific UDS measure",
        "Baseline pulled from the same EHR/registry source as the UDS report",
        "Numeric aim with a target value and target date",
        "SPC chart split at the intervention point",
        "Cycle outcome reviewed in a QI committee with minutes",
      ]}
      related={[
        { to: "/features/pdsa-cycle-manager", label: "PDSA Cycle Manager", blurb: "Run UDS-aligned cycles with structured guidance and SPC analysis." },
        { to: "/features/spc-charts", label: "SPC charts for UDS measures", blurb: "See whether the intervention moved the number or just the noise." },
        { to: "/resources/hrsa-ready-qi-documentation", label: "HRSA-ready QI documentation", blurb: "Turn cycles into the binder HRSA expects." },
        { to: "/store", label: "FQHC PDSA cycle templates", blurb: "Ready-to-use templates built for UDS measures." },
      ]}
    />
  );
}
