import { Shield, Lock, BadgeCheck, Stethoscope } from "lucide-react";

const TRUST_BADGES = [
  { icon: Shield, label: "HIPAA-ready architecture · BAA available" },
  { icon: Lock, label: "AES-256 at rest · TLS 1.3 in transit" },
  { icon: BadgeCheck, label: "SOC 2 Type II certified infrastructure" },
];

const PROOF_POINTS = [
  {
    stat: "Built by an FQHC quality leader",
    detail:
      "Designed by Jessica R. Smith, BSN — from years of running QI programs and preparing HRSA Operational Site Visits inside community health centers.",
  },
  {
    stat: "7 core UDS clinical measures",
    detail:
      "Every PDSA cycle can be tied to the exact UDS measure it should move, so your reporting and your improvement work share one record.",
  },
  {
    stat: "Audit binder in one click",
    detail:
      "Cycle logs, task evidence, and baseline-to-result deltas export as a print-ready HRSA Audit Binder — no reconstruction before a site visit.",
  },
];

export function TrustStrip() {
  return (
    <section className="py-12 md:py-16 px-6 border-y border-border bg-muted/20">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="space-y-2 text-center">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Why FQHC quality teams trust MeasureWise
          </p>
          <p className="text-sm text-muted-foreground">
            We're early and we say so — here's what's verifiable today, not borrowed logos.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PROOF_POINTS.map((p) => (
            <div
              key={p.stat}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-2"
            >
              <div className="flex items-center gap-2 text-primary">
                <Stethoscope className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="text-sm font-semibold text-foreground">{p.stat}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.detail}</p>
            </div>
          ))}
        </div>

        <ul className="grid gap-3 sm:grid-cols-3">
          {TRUST_BADGES.map((b) => (
            <li
              key={b.label}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <b.icon className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
              <span className="text-sm font-medium text-foreground">{b.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
