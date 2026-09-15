/**
 * Operations OS store.
 *
 * Local-first on purpose: this is one person's operating brain, not tenant
 * data, so it lives in this browser's localStorage rather than in the
 * MeasureWise database. Everything below is plain state plus small, total
 * mutations — the interesting logic lives in ./selectors.ts.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { dayKey } from "./date";
import { seedData } from "./seed";
import type {
  Capture,
  Cadence,
  OpsData,
  Ritual,
  Task,
  TaskPriority,
  TaskStatus,
  Venture,
  VentureAccent,
  VentureKind,
} from "./types";

export const OPS_STORAGE_KEY = "jj_ops_os_v1";

/** Short, collision-resistant enough for a single-user local store. */
function newId(prefix: string): string {
  const rand =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export interface TaskDraft {
  ventureId: string;
  title: string;
  notes?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due?: string;
}

export interface RitualDraft {
  ventureId: string;
  title: string;
  cadence: Cadence;
  weekday?: number;
  dayOfMonth?: number;
  notes?: string;
  estimateMins?: number;
}

export interface VentureDraft {
  name: string;
  kind: VentureKind;
  tagline: string;
  accent: VentureAccent;
}

interface OpsActions {
  /** Flipped once the persisted state has been read back in the browser. */
  hydrated: boolean;
  setHydrated: (v: boolean) => void;

  addTask: (draft: TaskDraft) => Task;
  updateTask: (
    id: string,
    patch: Partial<Omit<Task, "id" | "createdAt">>,
  ) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  toggleTaskDone: (id: string) => void;
  deleteTask: (id: string) => void;

  addRitual: (draft: RitualDraft) => Ritual;
  updateRitual: (id: string, patch: Partial<Omit<Ritual, "id">>) => void;
  deleteRitual: (id: string) => void;
  toggleRitual: (ritualId: string, date?: string) => void;

  addVenture: (draft: VentureDraft) => Venture;
  updateVenture: (id: string, patch: Partial<Omit<Venture, "id">>) => void;

  addCapture: (text: string, ventureId?: string) => Capture | null;
  promoteCapture: (id: string, ventureId: string) => Task | null;
  deleteCapture: (id: string) => void;

  resetToSeed: () => void;
}

export type OpsStore = OpsData & OpsActions;

export const useOpsStore = create<OpsStore>()(
  persist(
    (set, get) => ({
      ...seedData(),
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      addTask: (draft) => {
        const now = new Date().toISOString();
        const task: Task = {
          id: newId("task"),
          ventureId: draft.ventureId,
          title: draft.title.trim(),
          notes: draft.notes?.trim() || undefined,
          status: draft.status ?? "todo",
          priority: draft.priority ?? "normal",
          due: draft.due || undefined,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        return task;
      },

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, ...patch, updatedAt: new Date().toISOString() }
              : t,
          ),
        })),

      setTaskStatus: (id, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            const now = new Date().toISOString();
            return {
              ...t,
              status,
              updatedAt: now,
              completedAt: status === "done" ? now : undefined,
            };
          }),
        })),

      toggleTaskDone: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        get().setTaskStatus(id, task.status === "done" ? "todo" : "done");
      },

      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      addRitual: (draft) => {
        const rit: Ritual = {
          id: newId("ritual"),
          ventureId: draft.ventureId,
          title: draft.title.trim(),
          cadence: draft.cadence,
          weekday: draft.weekday,
          dayOfMonth: draft.dayOfMonth,
          notes: draft.notes?.trim() || undefined,
          estimateMins: draft.estimateMins,
        };
        set((s) => ({ rituals: [...s.rituals, rit] }));
        return rit;
      },

      updateRitual: (id, patch) =>
        set((s) => ({
          rituals: s.rituals.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      /** Removing a ritual also drops its history, so streaks cannot haunt a deleted habit. */
      deleteRitual: (id) =>
        set((s) => ({
          rituals: s.rituals.filter((r) => r.id !== id),
          completions: s.completions.filter((c) => c.ritualId !== id),
        })),

      toggleRitual: (ritualId, date) => {
        const key = date ?? dayKey();
        set((s) => {
          const already = s.completions.some(
            (c) => c.ritualId === ritualId && c.date === key,
          );
          if (already) {
            return {
              completions: s.completions.filter(
                (c) => !(c.ritualId === ritualId && c.date === key),
              ),
            };
          }
          return {
            completions: [
              ...s.completions,
              { ritualId, date: key, completedAt: new Date().toISOString() },
            ],
          };
        });
      },

      addVenture: (draft) => {
        const venture: Venture = {
          id: newId("venture"),
          name: draft.name.trim(),
          kind: draft.kind,
          tagline: draft.tagline.trim(),
          accent: draft.accent,
        };
        set((s) => ({ ventures: [...s.ventures, venture] }));
        return venture;
      },

      updateVenture: (id, patch) =>
        set((s) => ({
          ventures: s.ventures.map((v) =>
            v.id === id ? { ...v, ...patch } : v,
          ),
        })),

      addCapture: (text, ventureId) => {
        const trimmed = text.trim();
        if (!trimmed) return null;
        const capture: Capture = {
          id: newId("capture"),
          text: trimmed,
          ventureId,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ captures: [capture, ...s.captures] }));
        return capture;
      },

      /** Turn an inbox note into a real task and clear it from the inbox. */
      promoteCapture: (id, ventureId) => {
        const capture = get().captures.find((c) => c.id === id);
        if (!capture) return null;
        const task = get().addTask({ ventureId, title: capture.text });
        set((s) => ({ captures: s.captures.filter((c) => c.id !== id) }));
        return task;
      },

      deleteCapture: (id) =>
        set((s) => ({ captures: s.captures.filter((c) => c.id !== id) })),

      resetToSeed: () => set({ ...seedData() }),
    }),
    {
      name: OPS_STORAGE_KEY,
      version: 1,
      partialize: (s) => ({
        ventures: s.ventures,
        rituals: s.rituals,
        completions: s.completions,
        tasks: s.tasks,
        captures: s.captures,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

/** Read-only snapshot of just the data, for passing into the pure selectors. */
export function opsData(s: OpsStore): OpsData {
  return {
    ventures: s.ventures,
    rituals: s.rituals,
    completions: s.completions,
    tasks: s.tasks,
    captures: s.captures,
  };
}
