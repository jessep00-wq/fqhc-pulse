import { BadgeCheck, ExternalLink } from "lucide-react";
import { externalValidation } from "@/lib/siteContent";

/**
 * Independent validation section. Renders nothing at all until a real,
 * approved outside quote exists — no placeholder, no "coming soon" block.
 */
export function IndependentValidation() {
  const v = externalValidation;
  if (!v.enabled || !v.quote.trim()) return null;

  return (
    <section className="py-16 px-6 border-y border-border bg-card/40">
      <div className="max-w-3xl mx-auto space-y-5 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          Independent validation
        </p>

        <blockquote className="text-lg md:text-xl leading-relaxed text-foreground">
          {v.quote}
        </blockquote>

        <div className="space-y-1 text-sm">
          {v.name && <p className="font-semibold text-foreground">{v.name}</p>}
          {(v.title || v.organization) && (
            <p className="text-muted-foreground">
              {[v.title, v.organization].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {v.verificationLabel && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {v.verificationLabel}
            </span>
          )}
          {v.caseStudyUrl && (
            <a
              href={v.caseStudyUrl}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
            >
              Read the case study
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
