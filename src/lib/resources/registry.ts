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
      "What Chapter 10 of the HRSA Health Center Program Compliance Manual actually requires for quality improvement and assurance, how site visit reviewers assess it, and where health centers have discretion.",
    category: "HRSA & Operational Site Visits",
    published: "2026-08-24",
    updated: "2026-08-24",
    readingMinutes: 9,
    featured: true,
    sections: [
      {
        heading: "What Chapter 10 covers",
        id: "what-chapter-10-covers",
        blocks: [
          p(
            "Chapter 10 of the Health Center Program Compliance Manual is the quality improvement/quality assurance (QI/QA) chapter. Its authority is Section 330(k)(3)(C) of the Public Health Service Act and the implementing regulations at 42 CFR Parts 51c and 56.",
          ),
          p(
            "The underlying requirement is short: the health center must have an ongoing QI/QA system that covers clinical services and clinical management and maintains the confidentiality of patient records. That system must provide organizational arrangements with a focus of responsibility, and periodic assessment of the appropriateness of utilization and the quality of services.",
          ),
          p(
            "The Manual states that those periodic assessments must be conducted by physicians or by other licensed health professionals under physician supervision, be based on the systematic collection and evaluation of patient records, assess patient satisfaction and achievement of project objectives, include a process for hearing and resolving grievances, and identify and document the necessity for change — and result in that change where indicated.",
          ),
          p(
            "Everything else in this article distinguishes between what the Manual requires, how a site visit team checks it, and what is left to the health center's judgment.",
          ),
        ],
      },
      {
        heading: "The six things HRSA says demonstrate compliance",
        id: "six-elements",
        blocks: [
          p(
            "Chapter 10 lists six items a health center would fulfill to demonstrate compliance. These are the requirements — paraphrased for readability, not reworded to change meaning:",
          ),
          list([
            "1. A board-approved policy (or policies) establishing a QI/QA program that addresses the quality and utilization of services, patient satisfaction and grievance processes, and patient safety including adverse events.",
            "2. A designated individual (or individuals) to oversee that program, responsible for implementing QI/QA operating procedures and assessments, monitoring outcomes, and updating procedures.",
            "3. Operating procedures or processes covering: evidence-based clinical guidelines and standards of care; identifying, analyzing and addressing patient safety and adverse events with follow-up actions; assessing patient satisfaction; hearing and resolving grievances; completing periodic QI/QA assessments at least quarterly; and producing and sharing QI/QA reports that support decision-making and oversight by key management staff and the governing board.",
            "4. Quarterly (or more frequent) QI/QA assessments conducted by physicians or other licensed health care professionals, using data systematically collected from patient records, covering provider adherence to guidelines and the identification of patient safety and adverse events with related follow-up.",
            "5. A retrievable health record for each patient — for example, a certified EHR — with format and content consistent with federal and state law.",
            "6. Implemented systems for protecting the confidentiality of patient information and safeguarding it against loss, destruction, or unauthorized use, consistent with federal and state requirements.",
          ]),
          p(
            "Note the split between items 3 and 4. Item 3 is about having procedures. Item 4 is about clinicians actually performing chart-based assessments at least quarterly. A health center can pass the first and fail the second.",
          ),
        ],
      },
      {
        heading: "Where health centers have discretion",
        id: "discretion",
        blocks: [
          p(
            "Chapter 10 explicitly lists areas of health center discretion. This matters because a great deal of consultant guidance is presented to health centers as if it were federal requirement. According to the Manual, the health center determines:",
          ),
          list([
            "Whether the QI/QA oversight position is full-time, part-time, or combined with another role, and whether it is an employee or filled via contract.",
            "Whether that position is filled by a physician, another licensed health care professional (for example, an RN or NP), or another qualified individual (for example, someone with an MPH or MHA).",
            "Which QI/QA methodology(ies) to use.",
            "The type of patient health record system it will use.",
            "The format, content, and focus of QI/QA reports.",
          ]),
          p(
            "The Site Visit Protocol reinforces this. In its notes on periodic assessments, it states the health center determines how often to do assessments as long as they occur at least quarterly, and determines how to do them — giving peer review and Plan-Do-Study-Act as examples of acceptable approaches, not as a mandated method.",
          ),
          p(
            "So: quarterly frequency, clinician involvement, and a patient-record basis are requirements. The improvement methodology, the reporting template, and the staffing structure are yours to choose.",
          ),
        ],
      },
      {
        heading: "How the Site Visit Protocol assesses this (Chapter 8)",
        id: "site-visit-protocol",
        blocks: [
          p(
            "The Compliance Manual states the requirement; the Health Center Program Site Visit Protocol (SVP) states how a reviewer checks it. QI/QA is SVP Chapter 8, reviewed by a Clinical Expert, and it maps element-for-element to Manual Chapter 10 elements a through f.",
          ),
          h3("Documents the health center provides"),
          p(
            "The SVP checklist for Chapter 8 asks the health center to make the following available:",
          ),
          list([
            "Policies that establish the QI/QA program.",
            "QI/QA operating procedures or processes addressing clinical guidelines and standards; patient safety and adverse events including follow-up; patient satisfaction; patient grievances; periodic assessments; and report generation and oversight.",
            "Job or position descriptions of the individuals who oversee the QI/QA program.",
            "A sample of patient satisfaction results.",
            "Documentation of related supporting systems (for example, event reporting, grievance tracking, dashboards).",
            "The QI/QA assessment schedule or calendar.",
            "A sample of two QI/QA assessments from the past 12 months, plus any resulting reports.",
            "A sample of 5–10 patient records that include clinic visit notes or a summary of care.",
            "Systems and record-keeping procedures for confidentiality, privacy, and security of patient information, including PHI.",
          ]),
          h3("The patient record sample is 5 to 10, and it is a review methodology"),
          p(
            "Health centers are often told they must produce \"five charts.\" The SVP asks for a sample of 5–10 patient records for the QI/QA review, and notes that the same record sample used for other program requirement areas may be reused, and that records may be provided before or during the visit using live EHR navigation, screenshots, or other formats. This is a site visit review methodology for Chapter 8 — it is not a standing requirement in Manual Chapter 10 about how you must conduct your own internal assessments.",
          ),
          h3("What reviewers ask beyond documents"),
          p(
            "The SVP findings include two questions that documentation alone rarely answers: whether QI/QA reports — including patient satisfaction and patient safety data — are shared with key management staff and the governing board, and whether the health center can share at least one concrete example of how those reports supported a decision. Reviewers also ask whether the assessments demonstrate that the center is tracking and, where necessary, addressing quality and safety issues.",
          ),
        ],
      },
      {
        heading: "What changed in the 2025 Site Visit Protocol",
        id: "svp-2025-updates",
        blocks: [
          p(
            "HRSA publishes a summary of annual SVP updates. For Chapter 8, the 2025 summary lists two changes:",
          ),
          list([
            "Element c: clarified the flexibilities the health center has in conducting periodic QI/QA assessments.",
            "Element f: updated the reference from \"protected health information\" to \"patient information, including protected health information,\" and made the same change in the documents checklist.",
          ]),
          p(
            "Neither change adds a new obligation. The Element c clarification is the source of the current language confirming that frequency above quarterly and choice of method are the health center's call.",
          ),
        ],
      },
      {
        heading: "FTCA deeming is a separate track",
        id: "ftca",
        blocks: [
          p(
            "Chapter 10 compliance and FTCA deeming are frequently discussed together, and they are not the same thing. Chapter 10 is a Health Center Program requirement assessed through the compliance and site visit process. FTCA medical malpractice coverage is applied for separately and has its own risk management and credentialing expectations set out in HRSA's FTCA policy guidance.",
          ),
          p(
            "Quality documentation often supports both, but do not assume an FTCA checklist item is a Chapter 10 requirement, or the reverse. Verify each against its own primary source before treating it as binding.",
          ),
        ],
      },
      {
        heading: "Requirement vs. common practice: a short separation",
        id: "requirement-vs-practice",
        blocks: [
          h3("Requirements, stated by HRSA"),
          list([
            "Board-approved QI/QA policy covering quality/utilization, satisfaction and grievances, and patient safety.",
            "A designated individual overseeing the program.",
            "Operating procedures across the six areas in element c.",
            "Clinician-conducted assessments at least quarterly, based on data systematically collected from patient records.",
            "Retrievable per-patient health record consistent with federal and state law.",
            "Implemented confidentiality and information-safeguarding systems, with staff trained on them.",
          ]),
          h3("Common practice, not federal requirement"),
          list([
            "Using PDSA specifically — HRSA names it only as one example among acceptable methods.",
            "A monthly QI committee cadence, a particular dashboard format, or a specific report template.",
            "\"Five charts per provider per quarter\" as a universal rule — the 5–10 record sample is an SVP review sample, and internal audit design is left to the health center.",
            "Accreditation or PCMH recognition — valuable, but not what Chapter 10 asks for.",
          ]),
          p(
            "The practical takeaway: the requirements are about a documented, clinician-led, chart-based, at-least-quarterly loop that reaches the board and produces change when change is indicated. How you run that loop is your design decision — and the thing reviewers most often find missing is the dated evidence that the loop closed.",
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
        href: "https://bphc.hrsa.gov/compliance/compliance-manual/chapter10",
        note: "Requirements, demonstrating compliance, and areas of health center discretion.",
      },
      {
        label: "HRSA Health Center Program Site Visit Protocol, Chapter 8: Quality Improvement/Assurance",
        href: "https://bphc.hrsa.gov/compliance/site-visits/site-visit-protocol/quality-improvement-assurance",
        note: "Documents the health center provides, site visit team methodology, and findings questions.",
      },
      {
        label: "HRSA Site Visit Protocol: Summary of 2025 Updates",
        href: "https://bphc.hrsa.gov/compliance/site-visits/site-visit-protocol/summary-updates",
        note: "Chapter 8 changes to elements c and f.",
      },
      {
        label: "HRSA Federal Tort Claims Act (FTCA) Program",
        href: "https://bphc.hrsa.gov/initiatives/ftca",
        note: "Separate deeming track with its own risk management requirements.",
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
    seoTitle: "HRSA OSV QI/QA Documents | FQHC Chapter 8 Guide",
    description:
      "See the QI/QA documents HRSA reviews during an FQHC Operational Site Visit, including quarterly assessments, reports, patient records, and board oversight evidence.",
    category: "HRSA & Operational Site Visits",
    published: "2026-08-24",
    updated: "2026-08-24",
    readingMinutes: 8,
    featured: true,
    sections: [
      {
        heading: "Where the OSV quality review comes from",
        id: "where-it-comes-from",
        blocks: [
          p(
            "During an Operational Site Visit (OSV), the quality portion of the review is governed by Chapter 8: Quality Improvement/Assurance of the HRSA Health Center Program Site Visit Protocol. Chapter 8 is the review instrument that corresponds to Chapter 10: Quality Improvement/Assurance of the Health Center Program Compliance Manual, which is where the underlying requirements live.",
          ),
          p(
            "That pairing matters when you prepare. Chapter 10 tells you what your health center must have in place. Chapter 8 tells you what the site visit team will ask for, who they will interview, and the specific questions they will answer about your program.",
          ),
          p(
            "Chapter 8 is built around two things: the written QI/QA infrastructure — policies, procedures, position descriptions, schedules — and evidence that the program is actually operating. Reviewers request documents in advance, then use interviews and record review to confirm that what is written on paper matches how the health center runs.",
          ),
        ],
      },
      {
        heading: "QI/QA documents HRSA requests for a standard OSV",
        id: "osv-documents",
        blocks: [
          p(
            "The current Chapter 8 \"Documents the Health Center Provides\" checklist asks for the following:",
          ),
          list([
            "Policies that establish the QI/QA program",
            "QI/QA-related operating procedures or processes addressing clinical guidelines, standards of care and practice; patient safety and adverse events including follow-up actions; patient satisfaction; patient grievances; periodic QI/QA assessments; and QI/QA report generation and oversight",
            "Job or position descriptions of individuals who oversee the QI/QA program",
            "Sample of patient satisfaction results",
            "Documentation of any related systems that support QI/QA — for example, an event reporting system, tracking of resolutions and grievances, or dashboards",
            "QI/QA assessment schedule or calendar",
            "Sample of two QI/QA assessments from the past 12 months, and any related reports resulting from those assessments",
            "Sample of 5–10 health center patient records that include clinic visit notes or summary of care",
            "Systems (for example, certified EHRs) and record-keeping procedures for maintaining and monitoring the confidentiality, privacy, and security of patient information, including protected health information",
          ]),
          p(
            "Chapter 8 notes that the same sample of patient records used for other program requirement areas may also be used here, and that records may be shown through live EHR navigation, screenshots, or other formats. Health centers may provide record samples before or during the visit; if during, the protocol asks that the site visit team be told in advance so the visit is not delayed.",
          ),
        ],
      },
      {
        heading: "What reviewers verify during the visit",
        id: "what-reviewers-verify",
        blocks: [
          p(
            "The Chapter 8 methodology pairs each document request with interviews. Reviewers interview the individuals designated to oversee the QI/QA program, along with related clinical and management staff, and review position descriptions for background on those responsibilities. The purpose is to confirm that written policy describes actual operations.",
          ),
          p("Across the Chapter 8 elements, the site visit team assesses whether the QI/QA program includes:"),
          list([
            "Adherence to current evidence-based clinical guidelines, standards of care, and standards of practice",
            "Identification of patient safety issues and adverse events, and implementation of follow-up actions",
            "A process to assess patient satisfaction — for example, surveys or periodic patient focus groups",
            "A process for hearing and resolving patient grievances",
            "Completion of periodic QI/QA assessments on at least a quarterly basis, used to inform modification of health center services as appropriate",
            "Production and sharing of QI/QA reports, including patient satisfaction and patient safety data, with key management staff and the governing board",
            "Assessments conducted by physicians or other licensed health care professionals using data systematically collected from patient records",
          ]),
          p(
            "Chapter 8 is explicit that the health center decides how often to conduct assessments — monthly, bimonthly, or another cadence — as long as they occur at least quarterly.",
          ),
        ],
      },
      {
        heading: "What does the governing board need to show?",
        id: "governing-board",
        blocks: [
          p(
            "Chapter 8 asks whether the health center shares QI/QA reports, including data on patient satisfaction and patient safety, with key management staff and the governing board. Reports that stay inside the quality department do not satisfy this element.",
          ),
          p(
            "The protocol then asks a second, narrower question: did the health center share at least one example of how those reports support decision-making and oversight by key management staff and the governing board regarding the provision of health center services and responses to patient satisfaction and patient safety issues? One documented example is what the current protocol asks for.",
          ),
          p(
            "In practice this means being able to point to a specific report, the forum where it was presented, and something that followed from it — a change in a workflow, a resource decision, a follow-up assignment, a directed re-measurement.",
          ),
        ],
      },
      {
        heading: "OSV vs. FTCA site visit: don't mix up the document lists",
        id: "osv-vs-ftca",
        blocks: [
          p(
            "A common source of over-preparation is treating the FTCA document list as if it were the OSV list. They are separate protocols with separate purposes. The FTCA Site Visit Protocol applies to FTCA deeming and requests an expanded set of QI/QA documents beyond what Chapter 8 of the Health Center Program Site Visit Protocol asks for.",
          ),
          {
            type: "callout" as const,
            label: "These items come from the FTCA Site Visit Protocol, not the Chapter 8 OSV list",
            text: "The FTCA Site Visit Protocol's QI/QA pre-site-visit request includes the following in addition to a QI/QA plan or policies, a QI/QA calendar, and QI/QA leadership job descriptions:",
            items: [
              "QI/QA Committee meeting minutes from within the last 12 months",
              "Board minutes — the six most current governing board minutes",
              "Health center bylaws",
              "Governing board roster",
              "Clinical guidelines and the references used to develop guidelines and protocols",
              "A listing of written clinical protocols",
              "Sample quarterly clinical performance reports presented to the QI/QA Committee(s) and board, most recent, including peer review",
              "Minutes of provider staff meetings from within the past 6 months",
            ],
          },
          p(
            "If your health center is FTCA-deemed you will need both sets. Keep them labeled by protocol so an OSV request is answered from the Chapter 8 list and an FTCA visit is answered from the FTCA list. Presenting the FTCA list as the standard OSV requirement creates work that HRSA did not ask for in an OSV, and blurs which document belongs to which review.",
          ),
        ],
      },
      {
        heading: "What reviewers are really testing",
        id: "what-is-tested",
        blocks: [
          p(
            "Chapter 8 is not a document-existence check. The findings questions are written to determine whether the program functions. Reading the methodology, the review tests whether:",
          ),
          list([
            "The required processes are operational rather than described",
            "Assessments actually happen on the schedule the health center set, and at least quarterly",
            "Findings lead to action where action is warranted",
            "Reports reach key management staff and the governing board",
            "The organization can produce evidence from the prior 12 months on request",
            "Written policies match what staff describe and what the records show",
          ]),
          p(
            "This is why the interview step carries so much weight. A well-written QI/QA plan that no one on the floor can describe is the failure mode Chapter 8 is designed to surface.",
          ),
        ],
      },
      {
        heading: "Practical readiness check",
        id: "readiness-check",
        blocks: [
          p(
            "The questions below are readiness guidance from our experience with quality teams, not additional HRSA requirements. They are a fast way to find out whether the Chapter 8 request would be answerable today.",
          ),
          list([
            "Can we produce our QI/QA assessment calendar?",
            "Can we produce two completed assessments from the past 12 months?",
            "Can we show what happened after each assessment?",
            "Can we show QI/QA reports provided to leadership and the board?",
            "Can we show an example of a decision or action resulting from those reports?",
            "Can designated QI/QA staff explain the process consistently?",
            "Do our supporting systems match what our policies say?",
          ]),
          p(
            "Any question you cannot answer within a day is the gap to close first — not because the document is missing, but because the connection between assessment, action, and oversight is where the review concentrates.",
          ),
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
      blurb:
        "MeasureWise helps FQHC quality teams maintain a continuous evidence trail connecting assessments, findings, actions, reports, and oversight, so OSV preparation starts long before the site visit notice arrives.",
    },
    sources: [
      {
        label:
          "HRSA Health Center Program Site Visit Protocol, Chapter 8: Quality Improvement/Assurance",
        href: "https://bphc.hrsa.gov/compliance/site-visits/site-visit-protocol/quality-improvement-assurance",
        note: "Documents the health center provides, site visit team methodology, and site visit finding questions.",
      },
      {
        label:
          "HRSA Health Center Program Compliance Manual, Chapter 10: Quality Improvement/Assurance",
        href: "https://bphc.hrsa.gov/compliance/compliance-manual/chapter10",
        note: "The underlying QI/QA requirements that Chapter 8 assesses.",
      },
      {
        label: "HRSA FTCA Site Visit Protocol",
        href: "https://bphc.hrsa.gov/compliance/ftca/site-visit-protocol",
        note: "Separate protocol with its own expanded QI/QA requested-document list.",
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
