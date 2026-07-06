import { ResourcePage } from "@/components/ResourcePage";

export default function AzaraDRVSIntegrationGuide() {
  return (
    <ResourcePage
      eyebrow="Azara DRVS + MeasureWise"
      path="/resources/azara-drvs-integration-guide"
      title="Azara DRVS integration guide: turn dashboards into UDS-aligned PDSA action"
      description="A practical guide for FQHC quality teams already using Azara DRVS: how to take a clinical measure straight from a DRVS report and launch a UDS-aligned PDSA cycle in MeasureWise — closing the gap between reporting and improvement."
      body={[
        "Azara DRVS is one of the most widely deployed reporting platforms in the FQHC world. It's excellent at surfacing where a health center stands on UDS clinical quality measures, PCMH indicators, and care-gap lists. What Azara doesn't do — by design — is run the improvement work. That's where teams get stuck: the dashboard shows the problem, but the next step is still a spreadsheet, a shared drive, and a QI committee agenda item that quietly slips.",
        "MeasureWise is built to sit next to Azara, not replace it. DRVS remains the source of truth for the measure numerator, denominator, and trend. MeasureWise is the action layer: every underperforming measure in Azara becomes a UDS-aligned PDSA cycle with a named owner, a numeric aim, an intervention, and an SPC chart that proves whether the change worked. The two together are the reporting-plus-improvement stack HRSA reviewers expect to see.",
        "The workflow is deliberately short. In DRVS, identify one clinical quality measure that's below your goal — say, cervical cancer screening at 48% against a 60% target. Pull the current rate and the 12-month trend. In MeasureWise, create a new PDSA cycle, select the matching UDS measure (CMS124 for cervical), paste the baseline, and set a numeric aim ('move cervical screening from 48% to 55% by end of Q3'). Assign the operational owner, log the intervention, and let the SPC chart split at the intervention point tell you whether the shift is signal or noise.",
        "Doing this against your three slowest-moving DRVS measures gives you three defensible improvement stories per quarter — each one backed by the same numerator/denominator the UDS report will use, and each one closed out with an SPC chart that goes straight into the QI committee minutes and the HRSA OSV binder. It's the version of QI that DRVS users have always been able to see coming but rarely had the connective tissue to run.",
        "One nuance worth naming: MeasureWise does not read directly from Azara today. Baselines and post-intervention values are entered by the quality lead when they open and close the cycle — the same numbers they'd read off the DRVS dashboard anyway. This keeps the integration light and avoids adding another vendor into your BAA chain, while still producing HRSA-defensible documentation.",
      ]}
      checklist={[
        "Every underperforming DRVS measure has a matching PDSA cycle in MeasureWise",
        "Baseline in MeasureWise matches the numerator/denominator in DRVS",
        "Numeric aim is set against the measure's UDS target",
        "Intervention has a named clinical or operational owner",
        "Post-intervention SPC chart is exported into the QI committee packet",
      ]}
      related={[
        { to: "/resources/uds-aligned-pdsa", label: "UDS-aligned PDSA", blurb: "The cycle structure DRVS measures plug into." },
        { to: "/features/pdsa-cycle-manager", label: "PDSA Cycle Manager", blurb: "Run cycles with structured guidance and SPC analysis." },
        { to: "/features/spc-charts", label: "SPC charts for UDS measures", blurb: "Prove the change moved the measure, not the noise." },
        { to: "/resources/hrsa-ready-qi-documentation", label: "HRSA-ready QI documentation", blurb: "Turn cycles into the binder HRSA expects." },
      ]}
    />
  );
}
