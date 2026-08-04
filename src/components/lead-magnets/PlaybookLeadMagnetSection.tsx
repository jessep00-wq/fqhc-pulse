import { CheckCircle } from "lucide-react";
import playbookCover from "@/assets/athenaone-playbook-cover.jpg";
import { PlaybookLeadForm } from "./PlaybookLeadForm";

const bullets = [
  "AthenaOne workflow optimizations for UDS measures",
  "Risk and audit-readiness checklists",
  "Templates aligned with HRSA Chapter 10",
];

export function PlaybookLeadMagnetSection() {
  return (
    <section id="athenaone-playbook" className="py-20 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Cover */}
        <div className="relative flex justify-center lg:justify-end">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.18),transparent_60%)] blur-2xl"
          />
          <img
            src={playbookCover}
            alt="AthenaOne Optimization Playbook by MeasureWise"
            loading="lazy"
            width={1024}
            height={1024}
            className="max-w-sm w-full drop-shadow-2xl rounded"
          />
        </div>

        {/* Copy + form */}
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Free Resource · 2025 Edition
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Master Your 2025 UDS Reporting
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Download the definitive technical guide to optimizing AthenaOne
              workflows for FQHC quality, risk, and audit readiness.
            </p>
          </div>

          <ul className="space-y-2">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <PlaybookLeadForm variant="section" surface="homepage" />
          </div>
        </div>
      </div>
    </section>
  );
}
