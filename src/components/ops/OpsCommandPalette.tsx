/**
 * The command bar — ⌘K from anywhere in the console.
 *
 * It is the fastest path to the three things done most often: jump to a view,
 * check off a ritual, and drop a thought into the inbox. Typing anything that
 * matches nothing still offers to capture it, so a stray thought is never lost
 * to a failed search.
 */

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Inbox,
  LayoutGrid,
  ListTodo,
  PenLine,
  Repeat,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { completedOn, ritualsDueOn } from "@/lib/ops/selectors";
import type { OpsData } from "@/lib/ops/types";
import type { OpsView } from "@/components/ops/views";

export interface OpsCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: OpsData;
  today: string;
  onNavigate: (view: OpsView) => void;
  onToggleRitual: (ritualId: string) => void;
  onNewTask: () => void;
  onCapture: (text: string) => void;
  onOpenVenture: (ventureId: string) => void;
}

const VIEW_ITEMS: { view: OpsView; label: string; icon: typeof ListTodo }[] = [
  { view: "briefing", label: "Briefing", icon: CalendarCheck },
  { view: "board", label: "Task board", icon: ListTodo },
  { view: "ventures", label: "Ventures", icon: LayoutGrid },
  { view: "rituals", label: "Rituals", icon: Repeat },
  { view: "inbox", label: "Inbox", icon: Inbox },
];

export function OpsCommandPalette({
  open,
  onOpenChange,
  data,
  today,
  onNavigate,
  onToggleRitual,
  onNewTask,
  onCapture,
  onOpenVenture,
}: OpsCommandPaletteProps) {
  const [query, setQuery] = useState("");

  // Clear the query on close so the palette always opens fresh.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const remaining = useMemo(() => {
    const done = completedOn(data.completions, today);
    return ritualsDueOn(data.rituals, today).filter((r) => !done.has(r.id));
  }, [data.rituals, data.completions, today]);

  const ventureName = useMemo(
    () => new Map(data.ventures.map((v) => [v.id, v.name])),
    [data.ventures],
  );

  const run = (fn: () => void) => {
    fn();
    onOpenChange(false);
  };

  const trimmed = query.trim();

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Jump to a view, check off a ritual, or capture a thought…"
      />
      <CommandList>
        <CommandEmpty>
          {trimmed
            ? "Nothing matched. Capture it instead, below."
            : "Start typing."}
        </CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem className="gap-2" onSelect={() => run(onNewTask)}>
            <PenLine className="size-4" />
            New task
          </CommandItem>
          {trimmed ? (
            <CommandItem
              className="gap-2"
              value={`capture ${trimmed}`}
              onSelect={() => run(() => onCapture(trimmed))}
            >
              <Inbox className="size-4" />
              Capture &ldquo;{trimmed}&rdquo;
            </CommandItem>
          ) : null}
        </CommandGroup>

        {remaining.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Rituals left today">
              {remaining.map((rit) => (
                <CommandItem
                  key={rit.id}
                  className="gap-2"
                  value={`${rit.title} ${ventureName.get(rit.ventureId) ?? ""}`}
                  onSelect={() => run(() => onToggleRitual(rit.id))}
                >
                  <CheckCircle2 className="size-4" />
                  <span className="flex-1">{rit.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {ventureName.get(rit.ventureId)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}

        <CommandSeparator />
        <CommandGroup heading="Go to">
          {VIEW_ITEMS.map(({ view, label, icon: Icon }) => (
            <CommandItem
              key={view}
              className="gap-2"
              onSelect={() => run(() => onNavigate(view))}
            >
              <Icon className="size-4" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Ventures">
          {data.ventures
            .filter((v) => !v.archived)
            .map((v) => (
              <CommandItem
                key={v.id}
                className="gap-2"
                value={`open ${v.name}`}
                onSelect={() => run(() => onOpenVenture(v.id))}
              >
                <LayoutGrid className="size-4" />
                {v.name}
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
