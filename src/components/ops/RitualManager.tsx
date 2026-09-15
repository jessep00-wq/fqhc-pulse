/**
 * Rituals — the recurring shape of a week, and where it gets edited.
 *
 * Rituals are what make this an operations OS rather than a to-do list: the
 * Athena inbox, the care-gap worklist and the weekly UDS snapshot never stop
 * being due, so they are modelled as cadence rather than as dated tasks.
 */

import { useState } from "react";
import { Flame, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMins, ritualStreak } from "@/lib/ops/selectors";
import { isRitualDueOn } from "@/lib/ops/date";
import { CADENCE_LABELS, CADENCES, WEEKDAY_LABELS } from "@/lib/ops/types";
import type { Cadence, OpsData, Ritual } from "@/lib/ops/types";
import type { RitualDraft } from "@/lib/ops/store";
import {
  EmptyState,
  SectionLabel,
  VentureDot,
} from "@/components/ops/primitives";

export interface RitualManagerProps {
  data: OpsData;
  today: string;
  onAdd: (draft: RitualDraft) => void;
  onDelete: (id: string) => void;
}

export function RitualManager({
  data,
  today,
  onAdd,
  onDelete,
}: RitualManagerProps) {
  const groups = data.ventures
    .filter((v) => !v.archived)
    .map((venture) => ({
      venture,
      rituals: data.rituals.filter(
        (r) => r.ventureId === venture.id && !r.archived,
      ),
    }));

  return (
    <div className="space-y-5">
      <RitualComposer ventures={data.ventures} onAdd={onAdd} />

      {groups.every((g) => g.rituals.length === 0) ? (
        <EmptyState
          title="No rituals yet"
          hint="Add the work that repeats — the daily run is built out of these."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups
            .filter((g) => g.rituals.length > 0)
            .map(({ venture, rituals }) => (
              <section key={venture.id} className="jj-card p-5">
                <div className="flex items-center gap-2">
                  <VentureDot venture={venture} />
                  <h3 className="jj-serif text-xl font-semibold text-foreground">
                    {venture.name}
                  </h3>
                </div>
                <ul className="mt-3 divide-y divide-border">
                  {rituals.map((rit) => (
                    <RitualManagerRow
                      key={rit.id}
                      ritual={rit}
                      streak={ritualStreak(rit, data.completions, today)}
                      dueToday={isRitualDueOn(rit, today)}
                      onDelete={() => onDelete(rit.id)}
                    />
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}

function cadenceDescription(rit: Ritual): string {
  if (rit.cadence === "weekly")
    return `Weekly on ${WEEKDAY_LABELS[rit.weekday ?? 1]}`;
  if (rit.cadence === "monthly") return `Monthly on day ${rit.dayOfMonth ?? 1}`;
  return CADENCE_LABELS[rit.cadence];
}

function RitualManagerRow({
  ritual,
  streak,
  dueToday,
  onDelete,
}: {
  ritual: Ritual;
  streak: number;
  dueToday: boolean;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-start gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{ritual.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {cadenceDescription(ritual)}
          {ritual.estimateMins ? ` · ${formatMins(ritual.estimateMins)}` : ""}
          {dueToday ? " · due today" : ""}
        </p>
        {ritual.notes ? (
          <p className="mt-1 text-xs text-muted-foreground">{ritual.notes}</p>
        ) : null}
      </div>
      {streak > 1 ? (
        <span
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[color:var(--jj-coral)]"
          title={`${streak} in a row`}
        >
          <Flame className="size-3.5" aria-hidden="true" />
          {streak}
        </span>
      ) : null}
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Delete ritual: ${ritual.title}`}
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}

function RitualComposer({
  ventures,
  onAdd,
}: {
  ventures: OpsData["ventures"];
  onAdd: (draft: RitualDraft) => void;
}) {
  const [title, setTitle] = useState("");
  const [ventureId, setVentureId] = useState(ventures[0]?.id ?? "");
  const [cadence, setCadence] = useState<Cadence>("weekdays");
  const [weekday, setWeekday] = useState("1");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [estimate, setEstimate] = useState("");

  const canAdd = title.trim().length > 0 && ventureId.length > 0;
  // Weekly and monthly add a fifth control, so the title gives up a column to
  // keep the composer on one row.
  const needsDayField = cadence === "weekly" || cadence === "monthly";

  const submit = () => {
    if (!canAdd) return;
    onAdd({
      ventureId,
      title,
      cadence,
      weekday: cadence === "weekly" ? Number(weekday) : undefined,
      dayOfMonth: cadence === "monthly" ? Number(dayOfMonth) : undefined,
      estimateMins: estimate ? Number(estimate) : undefined,
    });
    setTitle("");
    setEstimate("");
  };

  return (
    <section className="jj-card p-5">
      <SectionLabel>Add a ritual</SectionLabel>
      <div className="mt-3 grid gap-3 lg:grid-cols-12">
        <div
          className={cn(
            "space-y-1.5",
            needsDayField ? "lg:col-span-3" : "lg:col-span-4",
          )}
        >
          <Label htmlFor="ritual-title">What repeats</Label>
          <Input
            id="ritual-title"
            value={title}
            placeholder="Clear the Athena clinical inbox"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canAdd) {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>

        <div
          className={cn(
            "space-y-1.5",
            needsDayField ? "lg:col-span-2" : "lg:col-span-3",
          )}
        >
          <Label htmlFor="ritual-venture">Venture</Label>
          <Select value={ventureId} onValueChange={setVentureId}>
            <SelectTrigger id="ritual-venture">
              <SelectValue placeholder="Pick a venture" />
            </SelectTrigger>
            <SelectContent>
              {ventures.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 lg:col-span-2">
          <Label htmlFor="ritual-cadence">Cadence</Label>
          <Select
            value={cadence}
            onValueChange={(v) => setCadence(v as Cadence)}
          >
            <SelectTrigger id="ritual-cadence">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CADENCES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CADENCE_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {cadence === "weekly" ? (
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="ritual-weekday">Day</Label>
            <Select value={weekday} onValueChange={setWeekday}>
              <SelectTrigger id="ritual-weekday">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAY_LABELS.map((label, i) => (
                  <SelectItem key={label} value={String(i)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {cadence === "monthly" ? (
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="ritual-dom">Day of month</Label>
            <Input
              id="ritual-dom"
              type="number"
              min={1}
              max={31}
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
            />
          </div>
        ) : null}

        <div className="space-y-1.5 lg:col-span-2">
          <Label htmlFor="ritual-estimate">Minutes</Label>
          <Input
            id="ritual-estimate"
            type="number"
            min={0}
            step={5}
            value={estimate}
            placeholder="20"
            onChange={(e) => setEstimate(e.target.value)}
          />
        </div>

        <div className="flex items-end lg:col-span-1">
          <Button onClick={submit} disabled={!canAdd} className="w-full">
            <Plus className="size-4" />
            <span className="sr-only">Add ritual</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
