// Patient-identifier screening for free-text sent to the AI functions.
// This is a warning aid only — it cannot guarantee that text is free of
// protected health information. Shared by the browser and the server.

export interface PhiMatch {
  kind: string;
  label: string;
  sample: string;
}

const PATTERNS: { kind: string; label: string; re: RegExp }[] = [
  { kind: "ssn", label: "Social Security number", re: /\b\d{3}-\d{2}-\d{4}\b/g },
  {
    kind: "mrn",
    label: "Medical record number",
    re: /\b(?:mrn|medical record(?: number)?|chart #?)\s*[:#]?\s*[A-Za-z0-9-]{4,}/gi,
  },
  { kind: "dob", label: "Date of birth", re: /\b(?:dob|date of birth)\b\s*[:#]?\s*\S+/gi },
  {
    kind: "date",
    label: "Full calendar date (possible date of birth)",
    re: /\b(?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12]\d|3[01])[/-](?:19|20)\d{2}\b/g,
  },
  { kind: "phone", label: "Phone number", re: /\b\d{3}[.\-\s]\d{3}[.\-\s]\d{4}\b/g },
  { kind: "email", label: "Email address", re: /\b[\w.+-]+@[\w-]+\.[A-Za-z]{2,}\b/g },
  {
    kind: "patient_name",
    label: "Possible patient name",
    re: /\b(?:patient|pt\.?|member)\s+(?:name\s*[:#]?\s*)?[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
  },
];

export function screenForPhi(text: string): PhiMatch[] {
  if (!text) return [];
  const out: PhiMatch[] = [];
  for (const p of PATTERNS) {
    const matches = text.match(p.re);
    if (matches && matches.length > 0) {
      out.push({ kind: p.kind, label: p.label, sample: matches[0].slice(0, 40) });
    }
  }
  return out;
}

export const PHI_INPUT_NOTICE =
  "Do not enter patient names, dates of birth, medical-record numbers, contact information, or other patient-identifying information.";

export const AI_DISCLAIMER =
  "MeasureWise provides quality-operations and documentation support. Results require review by authorized health-center personnel and do not constitute legal advice, regulatory certification, clinical guidance, or a guarantee of HRSA compliance.";
