/**
 * The daily run — every ritual that comes due today, grouped by venture.
 *
 * This is the part that carries Access Family Health: the recurring work that
 * has no due date because it is due every single day, and that an ordinary
 * task list quietly loses.
 */

import { Flame } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  completedOn,
  formatMins,
  ritualDayStatus,
  ritualStreak,
} from "@/lib/ops/selectors";
import { CADENCE_LABELS } from "@/lib/ops/types";
import type { OpsData, Ritual } from "@/lib/ops/types";
import {
  EmptyState,
  SectionLabel,
  VentureDot,
} from "@/components/ops/primitives";

export interface DailyRunProps {
  data: OpsData;
  today: string;
  onToggle: (ritualId: string) => void;
}

export function DailyRun({ data, today, onToggle }: DailyRunProps) {
  const status = ritualDayStatus(data.rituals, data.completions, today);
  const doneIds = completedOn(data.completions, today);
  const total = status.due.length;
  const done = status.done.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const groups = data.ventures
    .filter((v) => !v.archived)
    .map((venture) => ({
      venture,
      rituals: status.due.filter((r) => r.ventureId === venture.id),
    }))
    .filter((g) => g.rituals.length > 0);

  return (
    <section
      aria-labelledby="ops-daily-run-heading"
      className="jj-card p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionLabel>Today&rsquo;s run</SectionLabel>
          <h2
            id="ops-daily-run-heading"
            className="jj-serif mt-1 text-2xl font-semibold text-foreground"
          >
            Recurring work
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {done} of {total} done
          {status.remainingMins > 0
            ? ` · ${formatMins(status.remainingMins)} left`
            : ""}
        </p>
      </div>

      {total > 0 ? (
        <Progress
          value={pct}
          className="mt-4 h-1.5"
          aria-label={`Daily run ${pct}% complete`}
        />
      ) : null}

      {groups.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="Nothing recurring is scheduled today"
            hint="Add rituals on the Rituals tab to build out the daily run."
          />
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {groups.map(({ venture, rituals }) => (
            <div key={venture.id}>
              <div className="flex items-center gap-2">
                <VentureDot venture={venture} />
                <p className="text-sm font-semibold text-foreground">
                  {venture.name}
                </p>
              </div>
              <ul className="mt-2 space-y-1">
                {rituals.map((rit) => (
                  <RitualRow
                    key={rit.id}
                    ritual={rit}
                    done={doneIds.has(rit.id)}
                    streak={ritualStreak(rit, data.completions, today)}
                    onToggle={() => onToggle(rit.id)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RitualRow({
  ritual,
  done,
  streak,
  onToggle,
}: {
  ritual: Ritual;
  done: boolean;
  streak: number;
  onToggle: () => void;
}) {
  const id = `ritual-${ritual.id}`;
  return (
    <li className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60">
      <Checkbox
        id={id}
        checked={done}
        onCheckedChange={onToggle}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <label
          htmlFor={id}
          className={cn(
            "cursor-pointer text-sm font-medium",
            done ? "text-muted-foreground line-through" : "text-foreground",
          )}
        >
          {ritual.title}
        </label>
        {ritual.notes ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{ritual.notes}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
        {ritual.estimateMins ? (
          <span>{formatMins(ritual.estimateMins)}</span>
        ) : null}
        <span className="hidden sm:inline">
          {CADENCE_LABELS[ritual.cadence]}
        </span>
        {streak > 1 ? (
          <span
            className="inline-flex items-center gap-1 font-semibold text-[color:var(--jj-coral)]"
            title={`${streak} in a row`}
          >
            <Flame className="size-3.5" aria-hidden="true" />
            {streak}
          </span>
        ) : null}
      </div>
    </li>
  );
}
