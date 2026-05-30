import { ResourcePage } from "@/components/ResourcePage";

export default function HRSAReadyQIDocumentation() {
  return (
    <ResourcePage
      eyebrow="HRSA-ready documentation"
      path="/resources/hrsa-ready-qi-documentation"
      title="HRSA-ready QI documentation for FQHCs"
      description="HRSA-ready QI documentation means your quality improvement work can be handed to an Operational Site Visit reviewer without an editing pass. It's a property of how the work is captured day-to-day, not a binder you build the week before."
      body={[
        "HRSA's Health Center Compliance Manual — Chapter 10 in particular — expects a documented quality improvement program with measurable goals, active improvement cycles, and evidence that leadership reviews performance. Most FQHC Quality Directors can describe their program in conversation; far fewer can hand a reviewer a binder that proves it on the spot.",
        "The gap is almost never effort. It's structure. Cycles live in one place, UDS data in another, committee minutes in a third, and 'evidence' has to be assembled from email threads when the OSV letter arrives. HRSA-ready documentation closes that gap by capturing the artifact as part of the workflow: when a PDSA cycle is run in the right system, the documentation is the byproduct, not a separate task.",
        "The artifacts a reviewer actually asks for are predictable: an active list of PDSA cycles with linked UDS measures, SPC charts showing trend over the review period, QI committee minutes referencing those cycles, and a clear chain from cycle outcome to operational change. Build the workflow so those four artifacts auto-generate, and the binder is a print job.",
      ]}
      checklist={[
        "List of active PDSA cycles with the UDS measure each targets",
        "SPC charts on every measure in the review period",
        "QI committee minutes referencing cycle outcomes",
        "Documented chain from cycle → committee decision → operational change",
        "Timestamps and accountable owner on every artifact",
      ]}
      related={[
        { to: "/features/hrsa-audit-binder", label: "HRSA audit binder generator", blurb: "Export an OSV-ready PDF binder in one click." },
        { to: "/resources/audit-binder-exports", label: "Audit binder exports", blurb: "What goes into a binder that actually defends an OSV." },
        { to: "/resources/uds-aligned-pdsa", label: "UDS-aligned PDSA", blurb: "The cycle structure HRSA reviewers expect." },
        { to: "/blog/hrsa-site-visit-checklist", label: "HRSA site visit checklist", blurb: "Two-week prep guide for an OSV." },
      ]}
    />
  );
}
