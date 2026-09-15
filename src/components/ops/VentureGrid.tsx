/**
 * Ventures — one card per thing Jessica runs, with the numbers that say
 * whether it is being kept up with.
 */

import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { dueLabel } from "@/lib/ops/date";
import { ventureSummaries } from "@/lib/ops/selectors";
import type { VentureSummary } from "@/lib/ops/selectors";
import type { OpsData } from "@/lib/ops/types";
import { SectionLabel } from "@/components/ops/primitives";

const KIND_LABEL: Record<string, string> = {
  product: "Product",
  brand: "Brand",
  employer: "Day job",
};

export interface VentureGridProps {
  data: OpsData;
  today: string;
  /** Called when a card is opened, to jump the board to that venture. */
  onOpen: (ventureId: string) => void;
}

export function VentureGrid({ data, today, onOpen }: VentureGridProps) {
  const summaries = ventureSummaries(data, today);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {summaries.map((summary) => (
        <VentureCard
          key={summary.venture.id}
          summary={summary}
          today={today}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

function VentureCard({
  summary,
  today,
  onOpen,
}: {
  summary: VentureSummary;
  today: string;
  onOpen: (ventureId: string) => void;
}) {
  const { venture } = summary;
  const ritualsLeft = summary.ritualsDue - summary.ritualsDone;

  return (
    <article data-accent={venture.accent} className="jj-card overflow-hidden">
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: "var(--venture-accent)" }}
      />
      <div className="p-5">
        <SectionLabel>{KIND_LABEL[venture.kind] ?? venture.kind}</SectionLabel>
        <h3 className="jj-serif mt-1 text-2xl font-semibold text-foreground">
          {venture.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{venture.tagline}</p>

        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
          <Metric label="Open" value={summary.open} />
          <Metric
            label="Overdue"
            value={summary.overdue}
            tone={summary.overdue > 0 ? "alert" : undefined}
          />
          <Metric
            label="Run left"
            value={
              summary.ritualsDue === 0
                ? "—"
                : `${ritualsLeft}/${summary.ritualsDue}`
            }
            tone={
              summary.ritualsDue > 0 && ritualsLeft === 0 ? "good" : undefined
            }
          />
        </dl>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {summary.nextDue
              ? dueLabel(summary.nextDue, today)
              : "Nothing dated"}
          </p>
          <button
            type="button"
            onClick={() => onOpen(venture.id)}
            className="inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-primary hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            Open board
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "alert" | "good";
}) {
  return (
    <div>
      <dt className="jj-label">{label}</dt>
      <dd
        className={cn(
          "jj-display mt-1 text-2xl leading-none text-foreground",
          tone === "alert" && "text-destructive",
          tone === "good" && "text-[color:var(--success)]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
