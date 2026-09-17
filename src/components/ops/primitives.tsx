/**
 * Small shared pieces of the Operations OS interface.
 *
 * Venture colour is never hard-coded in JSX: each element carries the venture's
 * `data-accent`, and the brand layer in styles.css resolves that into
 * `--venture-accent` / `--venture-ink`.
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/ops/types";
import type { TaskPriority, TaskStatus, Venture } from "@/lib/ops/types";

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("jj-label", className)}>{children}</p>;
}

/** A venture's colour as a small dot — the quickest read of "whose work is this". */
export function VentureDot({
  venture,
  className,
}: {
  venture?: Venture;
  className?: string;
}) {
  if (!venture) return null;
  return (
    <span
      data-accent={venture.accent}
      aria-hidden="true"
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: "var(--venture-accent)" }}
    />
  );
}

export function VentureBadge({
  venture,
  className,
}: {
  venture?: Venture;
  className?: string;
}) {
  if (!venture) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-xs font-medium text-secondary-foreground",
        className,
      )}
    >
      <VentureDot venture={venture} className="size-2" />
      {venture.name}
    </span>
  );
}

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  critical: "border-destructive/40 bg-destructive/10 text-destructive",
  high: "border-[color:var(--jj-coral)]/45 bg-[color:var(--jj-coral)]/12 text-[color:var(--warning)]",
  normal: "border-border bg-muted text-muted-foreground",
  low: "border-border bg-transparent text-muted-foreground",
};

export function PriorityChip({ priority }: { priority: TaskPriority }) {
  if (priority === "normal" || priority === "low") return null;
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold",
        PRIORITY_CLASS[priority],
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

const STATUS_CLASS: Record<TaskStatus, string> = {
  todo: "border-border bg-muted text-muted-foreground",
  doing: "border-primary/30 bg-primary/10 text-primary",
  blocked: "border-destructive/35 bg-destructive/10 text-destructive",
  done: "border-[color:var(--success)]/35 bg-[color:var(--success)]/10 text-[color:var(--success)]",
};

export function StatusChip({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold",
        STATUS_CLASS[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  /** Draws attention when the number is one that should not be ignored. */
  tone?: "default" | "alert" | "good";
}

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: StatTileProps) {
  return (
    <div
      className={cn(
        "jj-card p-4",
        tone === "alert" && "border-destructive/35",
        tone === "good" && "border-[color:var(--success)]/35",
      )}
    >
      <SectionLabel>{label}</SectionLabel>
      <p
        className={cn(
          "jj-display mt-2 text-3xl leading-none",
          tone === "alert" && "text-destructive",
          tone === "good" && "text-[color:var(--success)]",
          tone === "default" && "text-primary",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Shown wherever a list has nothing in it yet. */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-border px-4 py-8 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
