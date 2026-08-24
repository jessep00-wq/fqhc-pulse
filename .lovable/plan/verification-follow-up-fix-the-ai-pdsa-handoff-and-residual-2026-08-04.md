# Verification follow-up: fix the AI → PDSA handoff and residual naming drift

Verification found one broken item and two cosmetic leftovers. Everything else passes.

## 1. AI Assistant → PDSA handoff (broken)

`src/pages/AIAssistant.tsx` saves the seed then calls `navigate("/dashboard/pdsa-lab")`, but `src/pages/PDSALab.tsx` only reads the seed when the URL carries `?from=ai` (`searchParams.get("from") !== "ai"` → early return). The seed is written to storage and never consumed, so the wizard opens empty (or does not open at all).

Fix: navigate to `/dashboard/pdsa-lab?from=ai`.

Then verify end to end in the browser: open the assistant, send a prompt, click "Start a PDSA cycle from this", and confirm the wizard opens on the Aim step with title / aim / root cause pre-filled and the stored seed cleared.

## 2. Naming variants left over

- `src/pages/PDSALab.tsx:298,304` still say "HRSA OSV Audit Binder" — drop "OSV" to match the canonical "HRSA Audit Binder".
- `src/lib/auditBinderPdf.ts:214,219,537` print "MEASUREWISE AUDIT BINDER" / "MeasureWise Audit Binder" in PDF headers and footers — change to "MeasureWise HRSA Audit Binder" for the first mention per document, leaving the short form "Audit Binder" in body copy.

## 3. Static sample PDF (decision needed)

`public/MeasureWise_Sample_Export.pdf` has the embedded title "HRSA / PCMH Audit Binder". It is a pre-rendered binary shown in the homepage preview dialog and downloadable from marketing pages. Regenerating it is out of scope for a copy fix; flagging it so the PCMH reference is a conscious choice rather than an oversight.

## Not changing

PCMH matches that stay on purpose: the `/for/pcmh-coordinators` and `/features/pcmh-evidence` redirect routes in `src/App.tsx` (inbound-link preservation), the "No PCMH recertification module" disclaimer on `src/pages/Features.tsx`, the "PCMH Coordinator" role option in the lead form, the email footer audience line, outbound markdown drafts, and historical SQL migrations.

## Verification

Typecheck, then a Playwright pass on the AI Assistant → PDSA Lab flow and the PDSA Lab binder dialog to confirm the seed carries over and labels read correctly.
