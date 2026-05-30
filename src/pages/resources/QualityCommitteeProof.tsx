import { ResourcePage } from "@/components/ResourcePage";

export default function QualityCommitteeProof() {
  return (
    <ResourcePage
      eyebrow="QI committee"
      path="/resources/quality-committee-proof"
      title="Quality committee proof: minutes that defend HRSA findings"
      description="HRSA reviewers expect to see a functioning Quality Improvement committee that reviews UDS performance, signs off on PDSA cycle outcomes, and drives operational change. The proof is in the minutes — and most FQHC minutes don't pass the test."
      body={[
        "A quality committee meets monthly or quarterly, reviews UDS performance, looks at active PDSA cycles, and decides what to spread, stop, or adapt. That's the textbook description. The OSV-defensible version is narrower: minutes must reference specific UDS measures by name, link to specific cycle IDs, capture decisions with named owners and due dates, and show the same measures and cycles being revisited at the next meeting.",
        "Most FQHC QI committee minutes fail at least two of those four tests. They reference 'the diabetes work' instead of A1c >9 control. They mention 'recent cycles' instead of cycle IDs. They capture discussion but not decisions. And they treat each meeting as a standalone event instead of a continuing thread.",
        "The fix isn't a longer minute template — it's a minute structure that mirrors the cycle structure. If your PDSA cycles are UDS-aligned (specific measure, numeric aim, SPC chart), then minutes can reference each cycle by ID and pull the same UDS measure name into the agenda automatically. The committee record becomes another byproduct of the workflow, not a separate document.",
      ]}
      checklist={[
        "Each agenda item names a specific UDS measure",
        "Each cycle reviewed has a stable cycle ID referenced in minutes",
        "Each decision has a named owner and a due date",
        "Same measures and cycles appear in the next meeting's agenda",
        "Minutes signed by the committee chair and stored with cycle records",
      ]}
      related={[
        { to: "/resources/hrsa-ready-qi-documentation", label: "HRSA-ready documentation", blurb: "Where committee minutes fit in the OSV binder." },
        { to: "/resources/uds-aligned-pdsa", label: "UDS-aligned PDSA", blurb: "The cycle structure minutes should reference." },
        { to: "/store", label: "QI committee packet templates", blurb: "Agenda and minute templates aligned to UDS measures." },
        { to: "/resources/fqhc-quality-improvement-evidence", label: "What counts as QI evidence", blurb: "The three properties real evidence must have." },
      ]}
    />
  );
}
