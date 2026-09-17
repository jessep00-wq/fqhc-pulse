/**
 * Operations OS — one console for everything Jessica runs.
 *
 * MeasureWise, Just Jessica and the daily quality operations at Access Family
 * Health each have their own tools, their own cadence and their own inbox. This
 * page is the layer above them: the briefing that says what today looks like,
 * the daily run that keeps recurring work honest, the board for one-off work,
 * and an inbox for everything not yet decided.
 *
 * Two deliberate choices shape the rest of the file:
 *
 *   Local-first. The data lives in this browser's localStorage, not in the
 *   MeasureWise database, because it is one person's operating brain rather
 *   than tenant data. src/lib/ops/store.ts is the only thing that touches it.
 *
 *   Brand-scoped. The Just Jessica palette is applied by the `.jj-ops` wrapper
 *   below, which re-points the design-system variables for this subtree only.
 *   Nothing outside this page changes colour.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Command as CommandIcon, Plus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { dayKey } from "@/lib/ops/date";
import { opsData, useOpsStore } from "@/lib/ops/store";
import type { Task } from "@/lib/ops/types";
import { BriefingPanel } from "@/components/ops/BriefingPanel";
import { CaptureInbox } from "@/components/ops/CaptureInbox";
import { DailyRun } from "@/components/ops/DailyRun";
import { OnDeckList, TaskBoard } from "@/components/ops/TaskBoard";
import { OpsCommandPalette } from "@/components/ops/OpsCommandPalette";
import { RitualManager } from "@/components/ops/RitualManager";
import { TaskDialog } from "@/components/ops/TaskDialog";
import { VentureGrid } from "@/components/ops/VentureGrid";
import { SectionLabel, VentureDot } from "@/components/ops/primitives";
import {
  OPS_VIEWS,
  OPS_VIEW_LABELS,
  type OpsView,
} from "@/components/ops/views";

export default function OpsConsole() {
  const store = useOpsStore();
  const data = useMemo(() => opsData(store), [store]);

  const [view, setView] = useState<OpsView>("briefing");
  const [ventureFilter, setVentureFilter] = useState<string | undefined>();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  // The clock is read on the client only: the greeting and the current day
  // depend on the viewer's timezone, and rendering either on the server would
  // hand React a different tree to hydrate. `clock` staying null is also what
  // gates the skeleton below.
  const [clock, setClock] = useState<Date | null>(null);
  useEffect(() => {
    setClock(new Date());
    // Re-read every minute so an open tab rolls over at midnight instead of
    // showing yesterday's run until it is reloaded.
    const id = setInterval(() => setClock(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const today = clock ? dayKey(clock) : dayKey();

  // Radix renders dialogs, dropdowns and the command palette into a portal on
  // <body>, outside this page's DOM subtree — so a wrapper class alone would
  // leave every overlay on the MeasureWise palette. Marking <body> for as long
  // as the console is mounted brings the portals inside the brand scope, and
  // the class comes straight back off on unmount.
  useEffect(() => {
    document.body.classList.add("jj-ops");
    return () => document.body.classList.remove("jj-ops");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openNewTask = useCallback(() => {
    setEditingTask(undefined);
    setTaskDialogOpen(true);
  }, []);

  const openTask = useCallback((task: Task) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  }, []);

  const openVentureBoard = useCallback((ventureId: string) => {
    setVentureFilter(ventureId);
    setView("board");
  }, []);

  const ready = clock !== null && store.hydrated;
  const filteredVenture = data.ventures.find((v) => v.id === ventureFilter);

  return (
    <div className="jj-ops jj-ops-backdrop min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <SectionLabel>Just Jessica</SectionLabel>
            <p className="jj-display mt-1 text-3xl leading-none text-primary sm:text-4xl">
              Operations OS
            </p>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Every venture, every recurring run, and everything still owed — in
              one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setPaletteOpen(true)}>
              <CommandIcon className="size-4" />
              Command
              <kbd className="ml-1 rounded border border-border px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground">
                ⌘K
              </kbd>
            </Button>
            <Button onClick={openNewTask}>
              <Plus className="size-4" />
              New task
            </Button>
          </div>
        </header>

        <nav aria-label="Console views" className="mt-8">
          <div className="flex flex-wrap gap-1 rounded-full border border-border bg-card p-1">
            {OPS_VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-current={view === v ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {OPS_VIEW_LABELS[v]}
              </button>
            ))}
          </div>
        </nav>

        <main className="mt-6 pb-16">
          {!ready ? (
            <ConsoleSkeleton />
          ) : (
            <>
              {view === "briefing" ? (
                <div className="space-y-6">
                  <BriefingPanel
                    data={data}
                    today={today}
                    hour={clock.getHours()}
                  />
                  <div className="grid gap-6 lg:grid-cols-2">
                    <DailyRun
                      data={data}
                      today={today}
                      onToggle={store.toggleRitual}
                    />
                    <OnDeckList
                      data={data}
                      today={today}
                      onToggleDone={store.toggleTaskDone}
                      onEdit={openTask}
                    />
                  </div>
                </div>
              ) : null}

              {view === "board" ? (
                <div className="space-y-4">
                  <VentureFilterBar
                    data={data}
                    active={ventureFilter}
                    onChange={setVentureFilter}
                  />
                  {filteredVenture ? (
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredVenture.name} only.
                    </p>
                  ) : null}
                  <TaskBoard
                    data={data}
                    today={today}
                    ventureFilter={ventureFilter}
                    onToggleDone={store.toggleTaskDone}
                    onEdit={openTask}
                  />
                </div>
              ) : null}

              {view === "ventures" ? (
                <VentureGrid
                  data={data}
                  today={today}
                  onOpen={openVentureBoard}
                />
              ) : null}

              {view === "rituals" ? (
                <RitualManager
                  data={data}
                  today={today}
                  onAdd={store.addRitual}
                  onDelete={store.deleteRitual}
                />
              ) : null}

              {view === "inbox" ? (
                <CaptureInbox
                  data={data}
                  onCapture={store.addCapture}
                  onPromote={store.promoteCapture}
                  onDelete={store.deleteCapture}
                />
              ) : null}
            </>
          )}
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-6">
          <p className="text-xs text-muted-foreground">
            Saved in this browser only. Nothing here leaves the device.
          </p>
          <ResetButton onReset={store.resetToSeed} />
        </footer>
      </div>

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        ventures={data.ventures}
        task={editingTask}
        defaultVentureId={ventureFilter}
        onCreate={store.addTask}
        onUpdate={store.updateTask}
        onDelete={store.deleteTask}
      />

      <OpsCommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        data={data}
        today={today}
        onNavigate={setView}
        onToggleRitual={store.toggleRitual}
        onNewTask={openNewTask}
        onCapture={store.addCapture}
        onOpenVenture={openVentureBoard}
      />
    </div>
  );
}

function VentureFilterBar({
  data,
  active,
  onChange,
}: {
  data: ReturnType<typeof opsData>;
  active?: string;
  onChange: (id: string | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <FilterChip active={!active} onClick={() => onChange(undefined)}>
        Everything
      </FilterChip>
      {data.ventures
        .filter((v) => !v.archived)
        .map((v) => (
          <FilterChip
            key={v.id}
            active={active === v.id}
            onClick={() => onChange(active === v.id ? undefined : v.id)}
          >
            <VentureDot venture={v} className="size-2" />
            {v.name}
          </FilterChip>
        ))}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <RotateCcw className="size-4" />
          Reset to starter data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset the console?</AlertDialogTitle>
          <AlertDialogDescription>
            Every task, ritual, completion and note in this browser is replaced
            with the starter set. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep my data</AlertDialogCancel>
          <AlertDialogAction
            onClick={onReset}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Reset everything
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConsoleSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <Skeleton className="h-44 w-full rounded-[var(--radius)]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-[var(--radius)]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-[var(--radius)]" />
        <Skeleton className="h-72 rounded-[var(--radius)]" />
      </div>
    </div>
  );
}
