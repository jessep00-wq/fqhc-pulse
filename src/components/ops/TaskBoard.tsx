/**
 * Tasks — the one-off work, as a row, as an "on deck" shortlist, and as a
 * four-column board.
 */

import { useMemo } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { dueLabel, isOverdue } from "@/lib/ops/date";
import { onDeck } from "@/lib/ops/selectors";
import { STATUS_LABELS, TASK_STATUSES } from "@/lib/ops/types";
import type { OpsData, Task, TaskStatus, Venture } from "@/lib/ops/types";
import {
  EmptyState,
  PriorityChip,
  SectionLabel,
  VentureDot,
} from "@/components/ops/primitives";

export interface TaskRowProps {
  task: Task;
  venture?: Venture;
  today: string;
  onToggleDone: (id: string) => void;
  onEdit: (task: Task) => void;
  /** Hide the venture dot when the surrounding list is already one venture. */
  hideVenture?: boolean;
}

export function TaskRow({
  task,
  venture,
  today,
  onToggleDone,
  onEdit,
  hideVenture,
}: TaskRowProps) {
  const done = task.status === "done";
  const overdue = !done && !!task.due && isOverdue(task.due, today);

  return (
    <li className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60">
      <Checkbox
        checked={done}
        className="mt-0.5"
        aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        onCheckedChange={() => onToggleDone(task.id)}
      />
      <button
        type="button"
        onClick={() => onEdit(task)}
        className="min-w-0 flex-1 text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
      >
        <span
          className={cn(
            "block text-sm font-medium",
            done ? "text-muted-foreground line-through" : "text-foreground",
          )}
        >
          {task.title}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {!hideVenture && venture ? (
            <span className="inline-flex items-center gap-1.5">
              <VentureDot venture={venture} className="size-2" />
              {venture.name}
            </span>
          ) : null}
          {task.due ? (
            <span className={cn(overdue && "font-semibold text-destructive")}>
              {dueLabel(task.due, today)}
            </span>
          ) : null}
          {task.status === "blocked" ? (
            <span className="font-semibold text-destructive">Blocked</span>
          ) : null}
        </span>
      </button>
      <PriorityChip priority={task.priority} />
    </li>
  );
}

export interface OnDeckListProps {
  data: OpsData;
  today: string;
  onToggleDone: (id: string) => void;
  onEdit: (task: Task) => void;
}

/** The shortlist: what the briefing points at, overdue first. */
export function OnDeckList({
  data,
  today,
  onToggleDone,
  onEdit,
}: OnDeckListProps) {
  const tasks = useMemo(() => onDeck(data.tasks, today), [data.tasks, today]);
  const ventureById = useMemo(
    () => new Map(data.ventures.map((v) => [v.id, v])),
    [data.ventures],
  );

  return (
    <section
      aria-labelledby="ops-on-deck-heading"
      className="jj-card p-5 sm:p-6"
    >
      <SectionLabel>On deck</SectionLabel>
      <h2
        id="ops-on-deck-heading"
        className="jj-serif mt-1 text-2xl font-semibold text-foreground"
      >
        What to pick up next
      </h2>

      {tasks.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No open tasks"
            hint="Press ⌘K, or use New task, to put something on the board."
          />
        </div>
      ) : (
        <ul className="mt-3 space-y-1">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              venture={ventureById.get(task.ventureId)}
              today={today}
              onToggleDone={onToggleDone}
              onEdit={onEdit}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export interface TaskBoardProps {
  data: OpsData;
  today: string;
  /** Narrow the board to one venture, or show everything when undefined. */
  ventureFilter?: string;
  onToggleDone: (id: string) => void;
  onEdit: (task: Task) => void;
}

export function TaskBoard({
  data,
  today,
  ventureFilter,
  onToggleDone,
  onEdit,
}: TaskBoardProps) {
  const ventureById = useMemo(
    () => new Map(data.ventures.map((v) => [v.id, v])),
    [data.ventures],
  );

  const visible = useMemo(
    () =>
      ventureFilter
        ? data.tasks.filter((t) => t.ventureId === ventureFilter)
        : data.tasks,
    [data.tasks, ventureFilter],
  );

  const columns = useMemo(
    () =>
      TASK_STATUSES.map((status) => ({
        status,
        tasks: visible
          .filter((t) => t.status === status)
          // Dated work first inside a column, then by title so the order is stable.
          .sort((a, b) => {
            if (a.due && b.due) return a.due.localeCompare(b.due);
            if (a.due) return -1;
            if (b.due) return 1;
            return a.title.localeCompare(b.title);
          }),
      })),
    [visible],
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {columns.map(({ status, tasks }) => (
        <BoardColumn key={status} status={status} count={tasks.length}>
          {tasks.length === 0 ? (
            <EmptyState title="Nothing here" />
          ) : (
            <ul className="space-y-1">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  venture={ventureById.get(task.ventureId)}
                  today={today}
                  hideVenture={!!ventureFilter}
                  onToggleDone={onToggleDone}
                  onEdit={onEdit}
                />
              ))}
            </ul>
          )}
        </BoardColumn>
      ))}
    </div>
  );
}

function BoardColumn({
  status,
  count,
  children,
}: {
  status: TaskStatus;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={STATUS_LABELS[status]} className="jj-card p-4">
      <div className="flex items-center justify-between">
        <SectionLabel>{STATUS_LABELS[status]}</SectionLabel>
        <span className="text-xs font-semibold text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}
