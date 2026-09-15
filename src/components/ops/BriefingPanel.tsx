/**
 * The briefing — the first thing the Operations OS says when it opens.
 *
 * It answers one question: what does today actually look like across every
 * venture. The sentences come from buildBriefing(), which stays quiet when
 * there is genuinely nothing to report rather than inventing urgency.
 */

import { formatLong, greetingFor } from "@/lib/ops/date";
import { buildBriefing, formatMins, opsStats } from "@/lib/ops/selectors";
import type { OpsData } from "@/lib/ops/types";
import { SectionLabel, StatTile } from "@/components/ops/primitives";

export interface BriefingPanelProps {
  data: OpsData;
  today: string;
  /** Local hour, 0–23. Passed in so the greeting never renders on the server. */
  hour: number;
  name?: string;
}

export function BriefingPanel({
  data,
  today,
  hour,
  name = "Jessica",
}: BriefingPanelProps) {
  const lines = buildBriefing(data, today);
  const stats = opsStats(data, today);
  const ritualsDone = stats.ritualsDue - stats.ritualsRemaining;

  return (
    <section aria-labelledby="ops-briefing-heading" className="space-y-5">
      <div className="jj-card p-6 sm:p-8">
        <SectionLabel>{formatLong(today)}</SectionLabel>
        <h1
          id="ops-briefing-heading"
          className="jj-display mt-3 text-4xl leading-[0.95] text-primary sm:text-5xl"
        >
          {greetingFor(hour)}, {name}.
        </h1>
        <div className="mt-5 space-y-2">
          {lines.map((line) => (
            <p
              key={line}
              className="jj-read max-w-2xl text-[1.0625rem] leading-relaxed text-foreground"
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Daily run"
          value={`${ritualsDone}/${stats.ritualsDue}`}
          hint={
            stats.ritualsRemaining === 0
              ? "Everything recurring is done"
              : `${formatMins(stats.remainingMins)} of work left`
          }
          tone={
            stats.ritualsDue > 0 && stats.ritualsRemaining === 0
              ? "good"
              : "default"
          }
        />
        <StatTile
          label="Overdue"
          value={stats.overdue}
          hint={
            stats.overdue === 0
              ? "Nothing past due"
              : "Oldest first on the deck"
          }
          tone={stats.overdue > 0 ? "alert" : "good"}
        />
        <StatTile
          label="Due today"
          value={stats.dueToday}
          hint={stats.dueToday === 0 ? "Clear calendar" : "Dated for today"}
        />
        <StatTile
          label="In flight"
          value={stats.inFlight}
          hint={
            stats.inFlight === 0 ? "Nothing started yet" : "Already picked up"
          }
        />
      </div>
    </section>
  );
}
