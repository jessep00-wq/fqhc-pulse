/**
 * NIST AI RMF–aligned governance policy template for FQHCs.
 * Pre-loaded when a health center starts a new policy draft.
 */
export const AI_GOVERNANCE_POLICY_TEMPLATE = `# AI Governance Policy

**Health Center:** {{ORG_NAME}}
**Version:** 1.0
**Effective Date:** {{EFFECTIVE_DATE}}

## 1. Purpose

This policy governs the responsible adoption, deployment, monitoring, and retirement
of Artificial Intelligence (AI) tools used by {{ORG_NAME}}, in alignment with the
NIST AI Risk Management Framework (AI RMF) and HRSA expectations for FQHC quality
and safety.

## 2. Scope

This policy applies to every AI tool — clinical, operational, or administrative —
used in any workflow that touches patients, staff, data, or finances, including
employee-disclosed use of consumer AI tools ("shadow AI").

## 3. NIST AI RMF Trustworthy Characteristics

The health center commits to ensuring every AI tool in use is:

- **Valid and Reliable** — tools are evaluated against the use cases they support and
  monitored for drift.
- **Safe** — tools must not cause patient harm; clinical recommendations require
  human review before action.
- **Secure and Resilient** — vendors must demonstrate appropriate technical
  safeguards and incident response.
- **Accountable and Transparent** — every tool has a named internal owner and an
  auditable trail of how outputs are reviewed and acted upon.
- **Privacy-Enhanced** — any tool that accesses PHI must operate under a signed
  Business Associate Agreement (BAA) and minimum-necessary data access.

## 4. AI Model Inventory

All AI tools must be entered into the AI Model Inventory before production use.
Each entry captures vendor, purpose, user role, data accessed, PHI handling,
risk tier (1–3), date adopted, vendor agreement status, and the accountable
internal owner.

## 5. Vendor Due Diligence

Before adoption and at minimum annually thereafter, the assigned owner completes a
Vendor Review covering: BAA status, data retention terms, model update
notification process, audit rights, indemnification, and documented limitations.
Signed agreements and BAAs are stored in the evidence binder.

## 6. Human Review and Approval

The following AI outputs require documented human review before action:

- Clinical recommendations and decision support
- Documentation and chart sign-off
- Billing and coding suggestions

Every review event is logged with reviewer, timestamp, output category, and
action taken (accepted, modified, rejected, escalated).

## 7. Incident and Risk Reporting

Staff are required to report AI-related incidents — unexpected outputs,
near-misses, patient safety concerns, and observed bias — through the AI Incident
Log. The Quality Improvement Committee reviews open incidents at each meeting
and includes AI incident summaries in QI committee reporting.

## 8. Shadow AI Disclosure

Employees who use consumer AI tools in a work context (for example, drafting
content, summarizing notes, or answering patient questions) must disclose that
use through the Shadow AI report form. Disclosed tools enter the inventory in
a paused state pending review.

## 9. Policy Governance

This policy is approved by the Chief Medical Officer, Chief Executive Officer,
and the Board Chair before activation. The policy is reviewed at least every
twelve months and whenever new regulatory guidance is published.

## 10. Definitions

- **AI Tool** — any software using machine learning, large language models, or
  rule-based automated decision-making, whether vendor-supplied, open-source, or
  developed in-house.
- **Risk Tier 1** — low risk; no PHI, no patient-facing decisions.
- **Risk Tier 2** — moderate risk; operational decisions, limited PHI, or
  documentation support.
- **Risk Tier 3** — high risk; clinical decision support, direct patient impact,
  or PHI handling without strong safeguards.

---

*Approved by:*
- Chief Medical Officer: ____________________
- Chief Executive Officer: ____________________
- Board Chair: ____________________
`;
