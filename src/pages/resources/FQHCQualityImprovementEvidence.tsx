import { ResourcePage } from "@/components/ResourcePage";

export default function FQHCQualityImprovementEvidence() {
  return (
    <ResourcePage
      eyebrow="QI evidence"
      path="/resources/fqhc-quality-improvement-evidence"
      title="FQHC quality improvement evidence: what counts, what doesn't"
      description="FQHC quality improvement evidence is the documented proof that a clinical or operational change produced a measurable effect on a UDS measure, patient outcome, or compliance gap. Activity is not evidence — and HRSA, NCQA, and your board all know the difference."
      body={[
        "Quality improvement evidence is one of the most-misunderstood concepts in FQHC operations. Teams will assemble 'evidence' that consists entirely of meeting agendas, training rosters, and screenshots of dashboards. None of that is evidence in the regulatory sense — it's activity documentation.",
        "Real QI evidence has three properties: a baseline measurement, a defined intervention, and a post-intervention measurement that can be statistically distinguished from baseline. If any of those three is missing, you have a project log, not evidence.",
        "The good news is that an FQHC running UDS-aligned PDSA cycles is generating evidence by default. The baseline comes from the same EHR pull as the UDS report. The intervention is the cycle itself. The post-intervention measurement is the SPC chart with a clearly-marked intervention line. When those three line up on the same artifact, you have something a reviewer, a grant officer, or a board chair can read in 30 seconds.",
      ]}
      checklist={[
        "Baseline value, source, and date",
        "Intervention description with owner and date range",
        "Post-intervention measurement from the same data source",
        "SPC analysis showing whether the change exceeded normal variation",
        "Reviewed and signed off by the QI committee",
      ]}
      related={[
        { to: "/resources/uds-aligned-pdsa", label: "UDS-aligned PDSA", blurb: "The cycle structure that generates evidence by default." },
        { to: "/resources/quality-committee-proof", label: "Quality committee proof", blurb: "What the QI committee needs to see — and minute." },
        { to: "/features/spc-charts", label: "SPC charts for UDS measures", blurb: "Distinguish real change from random variation." },
        { to: "/case-studies", label: "FQHC case studies", blurb: "Three health centers, three evidence trails, three OSV outcomes." },
      ]}
    />
  );
}
