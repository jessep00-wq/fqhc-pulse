import { Shield, Lock, Quote } from "lucide-react";

// NOTE: Placeholder partner descriptors and quote. Replace with real partner logos
// and named attribution before public launch — see plan B4.
const PARTNER_PLACEHOLDERS = [
  "12-site Midwest FQHC",
  "6-site Southeast CHC",
  "4-site Pacific NW FQHC",
  "18-site Mid-Atlantic FQHC",
  "3-site Mountain West FQHC",
  "9-site Texas FQHC",
];

const TRUST_BADGES = [
  { icon: Shield, label: "HIPAA-ready architecture · BAA available" },
  { icon: Lock, label: "AES-256 at rest · TLS 1.3 in transit" },
  { icon: Shield, label: "SOC 2 Type II certified infrastructure" },
];

export function TrustStrip() {
  return (
    <section className="py-12 md:py-16 px-6 border-y border-border bg-muted/20">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Partner row */}
        <div className="space-y-4 text-center">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Trusted by FQHC quality teams across the country
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {PARTNER_PLACEHOLDERS.map((p) => (
              <span
                key={p}
                className="inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Testimonial + trust badges */}
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <blockquote className="relative rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <Quote className="absolute -top-3 -left-3 h-8 w-8 text-primary/70 bg-background rounded-full p-1.5" aria-hidden="true" />
            <p className="text-base md:text-lg text-foreground leading-relaxed">
              "We cut audit prep from two weeks to an afternoon and finally have a clear
              line from every PDSA cycle to the UDS measure it moved. The SPC charts
              alone made our last HRSA reviewer's day."
            </p>
            <footer className="mt-4 text-sm text-muted-foreground">
              — Quality Director, 12-site FQHC (Pacific Northwest)
            </footer>
          </blockquote>

          <ul className="space-y-3">
            {TRUST_BADGES.map((b) => (
              <li
                key={b.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <b.icon className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">{b.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
