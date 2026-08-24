// Source of truth for the Resource Library. Adding a new article = adding one
// entry here; the hub, the article routes, and the sitemap all read this file.
//
// Content rule: no HRSA / UDS / CMS / regulatory requirement is stated here
// unless it came from a verified source supplied by the MeasureWise team.
// Anywhere that guidance is still needed, use a { type: "pending" } block and
// keep `contentInReview: true` on the entry (which ships the page noindex and
// keeps it out of the sitemap).

import type { Resource } from "./types";

const pending = (text: string) => ({ type: "pending" as const, text });
const p = (text: string) => ({ type: "p" as const, text });
const h3 = (text: string) => ({ type: "h3" as const, text });
const list = (items: string[]) => ({ type: "list" as const, items });

export const RESOURCES: Resource[] = [
  {
    slug: "hrsa-qi-qa-requirements-fqhc",
    title: "HRSA QI/QA Requirements for FQHCs: Chapter 10 Explained",
    seoTitle: "HRSA QI/QA Requirements for FQHCs (Chapter 10)",
    description:
      "A plain-language orientation to the Health Center Program Compliance Manual's quality improvement and assurance chapter, and how quality teams organize evidence around it.",
    category: "HRSA & Operational Site Visits",
    published: "2026-08-24",
    updated: "2026-08-24",
    readingMinutes: 8,
    featured: true,
    contentInReview: true,
    sections: [
      {
        heading: "Why Chapter 10 sits at the center of quality work",
        id: "why-chapter-10",
        blocks: [
          p(
            "Most quality directors do not struggle with doing improvement work. They struggle with proving it happened in the form a reviewer expects: dated, attributable, and traceable from a measure to a decision.",
          ),
          p(
            "This resource is written for that gap. It walks through how quality teams organize their program documentation so that the story of the year is legible without a scavenger hunt through shared drives and meeting invites.",
          ),
          pending(
            "The clause-by-clause summary of the Health Center Program Compliance Manual Chapter 10 requirements is awaiting review against the current published manual text. It will be added with a direct citation rather than paraphrased from memory.",
          ),
        ],
      },
      {
        heading: "What a defensible QI/QA program looks like operationally",
        id: "operational-shape",
        blocks: [
          p(
            "Independent of any specific citation, the operational shape reviewers tend to encounter is consistent: a written plan, a governing body that receives and acts on quality information, measures that are actually tracked over time, and improvement activity that closes the loop back to those measures.",
          ),
          list([
            "A current, board-approved quality plan with named accountability",
            "Measure performance tracked across periods, not a single snapshot",
            "Improvement activity tied to a specific measure and a specific decision",
            "Minutes or reports showing the governing body saw the results",
          ]),
          p(
            "If any one of those four is missing, the others become harder to defend, because the chain from data to decision breaks.",
          ),
        ],
      },
      {
        heading: "Where teams most often lose the thread",
        id: "common-gaps",
        blocks: [
          h3("Improvement work that never gets written down"),
          p(
            "Work happens in huddles and hallway conversations and never becomes a dated artifact. Six months later there is nothing to hand a reviewer.",
          ),
          h3("Measures without a period-over-period view"),
          p(
            "A single number cannot show whether anything improved. See the companion guidance on assembling a quarterly view.",
          ),
        ],
      },
    ],
    related: [
      "hrsa-qi-qa-documentation-checklist",
      "hrsa-quarterly-qi-assessment",
      "hrsa-osv-qi-qa-documents",
    ],
    cta: {
      label: "See the HRSA Audit Binder",
      href: "/features#audit-binder",
      blurb:
        "MeasureWise assembles dated QI/QA evidence — cycles, measures, and decisions — into one exportable binder.",
    },
    sources: [
      {
        label: "HRSA Health Center Program Compliance Manual, Chapter 10: Quality Improvement/Assurance",
        href: "https://bphc.hrsa.gov/compliance/compliance-manual",
        note: "Primary source to cite when the clause summary is finalized.",
      },
    ],
  },

  {
    slug: "hrsa-qi-qa-documentation-checklist",
    title: "HRSA QI/QA Documentation Checklist for FQHCs",
    description:
      "A working checklist for organizing quality improvement and assurance documentation so it can be produced quickly and read in order.",
    category: "HRSA & Operational Site Visits",
    published: "2026-08-24",
    updated: "2026-08-24",
    readingMinutes: 6,
    featured: true,
    contentInReview: true,
    sections: [
      {
        heading: "How to use this checklist",
        id: "how-to-use",
        blocks: [
          p(
            "Treat this as an organizing tool for material your health center already produces, not as a list of new artifacts to create. The value is in one predictable location and a consistent naming pattern.",
          ),
          pending(
            "The checklist rows that map to specific HRSA requirements are awaiting verification against the current compliance manual and site visit protocol. Only verified items will be published as requirements.",
          ),
        ],
      },
      {
        heading: "Organizing principles that hold regardless of the list",
        id: "principles",
        blocks: [
          list([
            "Every artifact carries a date and an author",
            "Documents are stored by period, so a reviewer can walk a timeline",
            "Each measure has an owner named in the document itself",
            "Improvement activity references the measure it was meant to move",
          ]),
          p(
            "For the period-level view of this material, see the guidance on quarterly QI/QA assessments.",
          ),
        ],
      },
    ],
    related: [
      "hrsa-qi-qa-requirements-fqhc",
      "hrsa-quarterly-qi-assessment",
      "hrsa-osv-qi-qa-documents",
    ],
    cta: {
      label: "Explore QI/QA reporting",
      href: "/features",
      blurb:
        "Quarterly QI/QA reports in MeasureWise are generated from the cycles and measures your team already maintains.",
    },
    sources: [
      {
        label: "HRSA Health Center Program Compliance Manual",
        href: "https://bphc.hrsa.gov/compliance/compliance-manual",
      },
    ],
  },

  {
    slug: "hrsa-quarterly-qi-assessment",
    title: "What Counts as a Quarterly QI/QA Assessment for HRSA?",
    description:
      "How quality teams structure a recurring quarterly assessment so each period stands on its own and the year reads as a continuous record.",
    category: "HRSA & Operational Site Visits",
    published: "2026-08-24",
    updated: "2026-08-24",
    readingMinutes: 7,
    contentInReview: true,
    sections: [
      {
        heading: "The question behind the question",
        id: "the-question",
        blocks: [
          p(
            "Teams usually ask this because they have activity but are unsure whether it adds up to an assessment. The practical test is whether someone outside the quality department could read the quarter and say what was measured, what changed, and what was decided.",
          ),
          pending(
            "Any statement about a required cadence or required contents of a quarterly assessment is awaiting verification against current HRSA guidance and will be published with a citation.",
          ),
        ],
      },
      {
        heading: "A repeatable quarterly structure",
        id: "structure",
        blocks: [
          list([
            "Measure performance for the period, with the prior periods visible",
            "Narrative on what moved and what did not",
            "Improvement activity opened, continued, or closed during the period",
            "Decisions made and who made them",
          ]),
          p(
            "Improvement activity is easiest to defend when it is structured as a cycle. See the practical PDSA guide for how that maps to quarterly reporting.",
          ),
        ],
      },
    ],
    related: [
      "hrsa-qi-qa-requirements-fqhc",
      "hrsa-qi-qa-documentation-checklist",
      "fqhc-pdsa-guide",
    ],
    cta: {
      label: "See quarterly QI/QA reports",
      href: "/features",
      blurb: "MeasureWise builds each quarter's report from live measure and cycle data.",
    },
    sources: [
      {
        label: "HRSA Health Center Program Compliance Manual",
        href: "https://bphc.hrsa.gov/compliance/compliance-manual",
      },
    ],
  },

  {
    slug: "hrsa-osv-qi-qa-documents",
    title: "What QI/QA Documents Does HRSA Review During an Operational Site Visit?",
    description:
      "How to prepare the quality portion of an Operational Site Visit so requested material can be produced in order and on time.",
    category: "HRSA & Operational Site Visits",
    published: "2026-08-24",
    updated: "2026-08-24",
    readingMinutes: 7,
    featured: true,
    contentInReview: true,
    sections: [
      {
        heading: "Preparation is an assembly problem",
        id: "assembly",
        blocks: [
          p(
            "In most health centers the material already exists. The scramble comes from it living in a dozen places with inconsistent dates and owners. Preparation is mostly assembly, versioning, and labeling.",
          ),
          pending(
            "The list of documents reviewed during the quality portion of an Operational Site Visit is awaiting verification against the current site visit protocol. It will be published only with a direct citation.",
          ),
        ],
      },
      {
        heading: "A staging pattern that works",
        id: "staging",
        blocks: [
          list([
            "One folder per period, named consistently",
            "A cover index that names each artifact and its date",
            "Measure trends exported as of a stated date",
            "Improvement cycles exported individually, including in-progress ones",
          ]),
        ],
      },
    ],
    related: [
      "hrsa-qi-qa-requirements-fqhc",
      "hrsa-qi-qa-documentation-checklist",
      "hrsa-quarterly-qi-assessment",
    ],
    cta: {
      label: "See the OSV export packet",
      href: "/features#audit-binder",
      blurb: "Export a dated, indexed evidence packet instead of assembling folders by hand.",
    },
    sources: [
      {
        label: "HRSA Health Center Program site visit protocol",
        href: "https://bphc.hrsa.gov/compliance/site-visits",
      },
    ],
  },

  {
    slug: "uds-hypertension-denominator",
    title: "Why Is My UDS Hypertension Denominator Wrong?",
    description:
      "A troubleshooting approach for hypertension denominators that do not match expectations, working from encounter capture through exclusion logic.",
    category: "UDS Reporting",
    published: "2026-08-24",
    updated: "2026-08-24",
    readingMinutes: 9,
    featured: true,
    contentInReview: true,
    sections: [
      {
        heading: "Start with the population, not the report",
        id: "start-with-population",
        blocks: [
          p(
            "A denominator that looks wrong is usually a population definition problem rather than a reporting bug. The productive sequence is: who was included, why, and which of those inclusions your EHR logic actually evaluated.",
          ),
          pending(
            "The specific UDS hypertension measure denominator criteria for the current reporting year are awaiting verification against the published UDS manual and will be cited directly.",
          ),
        ],
      },
      {
        heading: "A troubleshooting order that saves time",
        id: "troubleshooting-order",
        blocks: [
          h3("1. Qualifying encounters"),
          p(
            "If encounter capture is off, everything downstream is off. See what counts as a qualifying encounter for UDS clinical measures.",
          ),
          h3("2. Diagnosis capture and problem list hygiene"),
          p(
            "Diagnoses recorded only in narrative text, or never carried onto the problem list, silently shrink a denominator.",
          ),
          h3("3. Exclusion and exception logic"),
          p(
            "These are frequently conflated in EHR builds. The distinction is covered in UDS exclusions vs. exceptions.",
          ),
        ],
      },
    ],
    related: ["uds-exclusions-vs-exceptions", "uds-qualifying-encounter", "2026-uds-proposed-changes"],
    cta: {
      label: "See UDS measure tracking",
      href: "/features#uds-tracking",
      blurb: "Track UDS measure performance across periods so a shifting denominator is visible early.",
    },
    sources: [
      {
        label: "HRSA Uniform Data System (UDS) reporting resources",
        href: "https://bphc.hrsa.gov/data-reporting/uds-training-and-technical-assistance",
      },
    ],
  },

  {
    slug: "uds-exclusions-vs-exceptions",
    title: "UDS Exclusions vs. Exceptions Explained",
    description:
      "Why the two concepts are not interchangeable, and how conflating them in EHR logic distorts measure performance.",
    category: "UDS Reporting",
    published: "2026-08-24",
    updated: "2026-08-24",
    readingMinutes: 6,
    contentInReview: true,
    sections: [
      {
        heading: "Two different questions",
        id: "two-questions",
        blocks: [
          p(
            "One asks whether a patient belonged in the measure population at all. The other asks whether a patient who did belong had a documented clinical reason for not receiving the action. Handling both with a single flag is a common source of unexplained rate movement.",
          ),
          pending(
            "The formal definitions and the current-year application of exclusions and exceptions within UDS clinical measures are awaiting verification against the published UDS manual.",
          ),
        ],
      },
      {
        heading: "What to check in your build",
        id: "check-your-build",
        blocks: [
          list([
            "Whether the two concepts map to separate fields or one shared flag",
            "Whether the applied reason is retrievable for chart review",
            "Whether the rate is recalculated consistently across periods",
          ]),
          p("If a denominator is drifting, the hypertension troubleshooting sequence is a useful starting point."),
        ],
      },
    ],
    related: ["uds-hypertension-denominator", "uds-qualifying-encounter"],
    cta: {
      label: "See measure tracking",
      href: "/features#uds-tracking",
      blurb: "Period-over-period views make an exclusion logic change visible instead of invisible.",
    },
    sources: [
      {
        label: "HRSA Uniform Data System (UDS) manual",
        href: "https://bphc.hrsa.gov/data-reporting/uds-training-and-technical-assistance",
      },
    ],
  },

  {
    slug: "uds-qualifying-encounter",
    title: "What Counts as a Qualifying Encounter for UDS Clinical Measures?",
    description:
      "How encounter capture drives clinical measure populations, and where health centers commonly lose or over-count visits.",
    category: "UDS Reporting",
    published: "2026-08-24",
    updated: "2026-08-24",
    readingMinutes: 7,
    contentInReview: true,
    sections: [
      {
        heading: "Encounter capture is the upstream control",
        id: "upstream-control",
        blocks: [
          p(
            "Clinical measure populations are built from encounters. When visit types, providers, or service locations are mapped inconsistently, the effect shows up as denominators that move without a clinical explanation.",
          ),
          pending(
            "The qualifying encounter criteria for UDS clinical measures are awaiting verification against the current UDS manual and will be published with a citation.",
          ),
        ],
      },
      {
        heading: "Mapping questions worth asking your EHR team",
        id: "mapping-questions",
        blocks: [
          list([
            "Which visit types are mapped as qualifying, and who approved that mapping",
            "How telehealth and nurse-only visits are treated",
            "Whether any location or provider type is silently excluded",
          ]),
        ],
      },
    ],
    related: ["uds-hypertension-denominator", "uds-exclusions-vs-exceptions"],
    cta: {
      label: "See UDS measure tracking",
      href: "/features#uds-tracking",
      blurb: "Watch measure populations across periods to catch a mapping change the month it happens.",
    },
    sources: [
      {
        label: "HRSA Uniform Data System (UDS) manual",
        href: "https://bphc.hrsa.gov/data-reporting/uds-training-and-technical-assistance",
      },
    ],
  },

  {
    slug: "2026-uds-proposed-changes",
    title: "2026 UDS Proposed Changes: What FQHCs Should Prepare for Now",
    description:
      "How to track proposed UDS changes without rebuilding workflows around guidance that is not final.",
    category: "UDS Reporting",
    published: "2026-08-24",
    updated: "2026-08-24",
    readingMinutes: 6,
    contentInReview: true,
    sections: [
      {
        heading: "Prepare for change without chasing drafts",
        id: "prepare-not-chase",
        blocks: [
          p(
            "Proposed changes are worth monitoring and rarely worth rebuilding around before they are final. The stable preparation is making your current measure logic documented and easy to change.",
          ),
          pending(
            "The substance of any proposed 2026 UDS changes is awaiting verification against official HRSA notices. Nothing about proposed measure specifications will be published here until it is confirmed and cited.",
          ),
        ],
      },
      {
        heading: "What is safe to do today",
        id: "safe-today",
        blocks: [
          list([
            "Document how each measure is currently built in your EHR, including who owns it",
            "Keep historical measure results so a specification change can be interpreted, not just absorbed",
            "Assign one person to monitor official HRSA notices",
          ]),
        ],
      },
    ],
    related: ["uds-hypertension-denominator", "uds-qualifying-encounter", "uds-exclusions-vs-exceptions"],
    cta: {
      label: "See measure tracking",
      href: "/features#uds-tracking",
      blurb: "Retained history makes a specification change interpretable instead of disruptive.",
    },
    sources: [
      {
        label: "HRSA Bureau of Primary Health Care official notices",
        href: "https://bphc.hrsa.gov/data-reporting/uds-training-and-technical-assistance",
      },
    ],
  },

  {
    slug: "fqhc-pdsa-guide",
    title: "PDSA for FQHC Quality Improvement: A Practical Guide",
    description:
      "How to run Plan-Do-Study-Act cycles in a health center so the work is small enough to finish and documented enough to defend.",
    category: "PDSA & Quality Improvement",
    published: "2026-08-24",
    updated: "2026-08-24",
    readingMinutes: 10,
    featured: true,
    sections: [
      {
        heading: "Why PDSA stalls in health centers",
        id: "why-pdsa-stalls",
        blocks: [
          p(
            "PDSA rarely fails because the model is wrong. It fails because cycles are scoped too large, ownership is diffuse, and the record of what happened lives in a slide deck that is never updated after the meeting.",
          ),
          p(
            "The fix is unglamorous: a smaller aim, a named owner, a date, and a written decision at the end of each cycle.",
          ),
        ],
      },
      {
        heading: "Scoping an aim you can actually finish",
        id: "scoping-an-aim",
        blocks: [
          p(
            "A good aim names the population, the measure, the direction of change, and the period. It should be small enough that one person can describe the test in two sentences.",
          ),
          list([
            "Name the measure the cycle is meant to move",
            "Name one owner, not a committee",
            "Set a period short enough to learn something within a quarter",
            "Decide in advance what result would cause you to adopt, adapt, or abandon",
          ]),
        ],
      },
      {
        heading: "Studying results without overclaiming",
        id: "studying-results",
        blocks: [
          p(
            "Two data points are not a trend. Looking at performance across enough periods to distinguish normal variation from a real shift keeps a team from celebrating noise or abandoning a change too early.",
          ),
          h3("Write the decision down"),
          p(
            "The decision is the artifact that makes the cycle defensible later. Adopt, adapt, or abandon, with a sentence of reasoning and a date.",
          ),
        ],
      },
      {
        heading: "Connecting cycles to reporting",
        id: "connecting-to-reporting",
        blocks: [
          p(
            "Cycles that reference a measure roll up cleanly into a quarterly assessment. Cycles that do not reference anything become orphan documents.",
          ),
        ],
      },
    ],
    related: ["fqhc-pdsa-hypertension-example", "hrsa-quarterly-qi-assessment", "hrsa-qi-qa-requirements-fqhc"],
    cta: {
      label: "See the PDSA Cycle Manager",
      href: "/features#pdsa",
      blurb:
        "MeasureWise keeps each cycle's aim, owner, results, and decision together and exportable at any stage.",
    },
    sources: [
      {
        label: "Institute for Healthcare Improvement — Plan-Do-Study-Act (PDSA) worksheet",
        href: "https://www.ihi.org/resources/tools/plan-do-study-act-pdsa-worksheet",
      },
    ],
  },

  {
    slug: "fqhc-pdsa-hypertension-example",
    title: "FQHC PDSA Example: Improving Hypertension Control",
    description:
      "A worked structure for a hypertension control improvement cycle, from aim statement through the documented decision.",
    category: "PDSA & Quality Improvement",
    published: "2026-08-24",
    updated: "2026-08-24",
    readingMinutes: 8,
    sections: [
      {
        heading: "An illustrative cycle, not a benchmark",
        id: "illustrative",
        blocks: [
          p(
            "The structure below is an example of how a hypertension control cycle can be written. The numbers a health center uses should be its own; nothing here is a performance claim or a target set by any external body.",
          ),
        ],
      },
      {
        heading: "Plan: the aim and the test",
        id: "plan",
        blocks: [
          p(
            "Name the population, the measure, the change being tested, and who is running it. A common shape: adult patients with a hypertension diagnosis seen in the last period, tested against a repeat-BP workflow at rooming.",
          ),
          list([
            "Measure: hypertension control rate as your health center defines it for reporting",
            "Owner: one named clinical or nursing lead",
            "Test period: a defined number of weeks at one site or one pod",
            "Decision rule: written before the test begins",
          ]),
        ],
      },
      {
        heading: "Do: run it small and record what actually happened",
        id: "do",
        blocks: [
          p(
            "Record deviations as they occur. The reasons a workflow did not happen as designed are usually the most useful part of the cycle.",
          ),
        ],
      },
      {
        heading: "Study and Act: the part that gets skipped",
        id: "study-act",
        blocks: [
          p(
            "Compare performance to the periods before the test, note confounders honestly, then write the adopt, adapt, or abandon decision with a date and an owner.",
          ),
          p(
            "If the measure itself looks unreliable, the denominator troubleshooting sequence is usually the right detour before drawing conclusions.",
          ),
        ],
      },
    ],
    related: ["fqhc-pdsa-guide", "uds-hypertension-denominator", "hrsa-quarterly-qi-assessment"],
    cta: {
      label: "Run a cycle in MeasureWise",
      href: "/features#pdsa",
      blurb: "Start from a hypertension template and keep the evidence trail as you go.",
    },
    sources: [
      {
        label: "Institute for Healthcare Improvement — Plan-Do-Study-Act (PDSA) worksheet",
        href: "https://www.ihi.org/resources/tools/plan-do-study-act-pdsa-worksheet",
      },
    ],
  },
];

export const getResource = (slug: string) => RESOURCES.find((r) => r.slug === slug);

/** Resources safe to index and list in the sitemap. */
export const indexableResources = () => RESOURCES.filter((r) => !r.contentInReview);

export const resourcesByCategory = (category: string) =>
  RESOURCES.filter((r) => r.category === category);

export const featuredResources = () => RESOURCES.filter((r) => r.featured);
