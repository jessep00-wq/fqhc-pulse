import { ResourcePage } from "@/components/ResourcePage";

export default function AuditBinderExports() {
  return (
    <ResourcePage
      eyebrow="OSV binder exports"
      path="/resources/audit-binder-exports"
      title="Audit binder exports for FQHC HRSA Operational Site Visits"
      description="An HRSA audit binder is the curated, printable evidence package an FQHC hands to OSV reviewers. The export should be a one-click operation — not a two-week scramble through shared drives, email threads, and committee minutes."
      body={[
        "FQHC Quality Directors typically build the OSV binder by hand: gather the last 12 months of QI committee minutes, screenshot a few UDS trends, attach the PDSA logs that still exist, and assemble it all into a tabbed PDF the night before the visit. The result usually defends the OSV, but the process burns one to two weeks of senior staff time and leaves obvious gaps a sharp reviewer will find.",
        "An audit binder export, by contrast, is a generated artifact built from the same data the QI work runs on. Cycles, SPC charts, committee references, and Chapter 10 evidence are pulled from a structured source and assembled into a single PDF — table of contents, page numbers, appendices, and all. The binder becomes a property of the system, not a one-off project.",
        "The right binder has six sections every time: (1) executive summary of QI program structure, (2) UDS performance with SPC analysis, (3) active and closed PDSA cycles with linked measures, (4) QI committee minutes referencing those cycles, (5) Chapter 10 compliance gap analysis, and (6) staff accountability and training records. If your current process can't generate those six sections on demand, you're carrying audit risk that's invisible until the OSV letter arrives.",
      ]}
      checklist={[
        "Executive summary of the QI program",
        "UDS performance with SPC analysis for each measure",
        "Active and closed PDSA cycles with linked UDS measures",
        "QI committee minutes referencing cycle outcomes",
        "Chapter 10 compliance gap analysis",
        "Staff accountability and training records",
      ]}
      related={[
        { to: "/features/hrsa-audit-binder", label: "HRSA audit binder generator", blurb: "One-click export of the binder described above." },
        { to: "/resources/hrsa-ready-qi-documentation", label: "HRSA-ready documentation", blurb: "Capture evidence as part of the workflow." },
        { to: "/blog/hrsa-site-visit-checklist", label: "HRSA site visit checklist", blurb: "Two-week prep guide for an OSV." },
        { to: "/store", label: "HRSA audit binder templates", blurb: "Ready-to-use templates for the six binder sections." },
      ]}
    />
  );
}
