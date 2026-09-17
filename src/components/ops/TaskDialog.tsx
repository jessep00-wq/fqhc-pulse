/**
 * Create or edit one task. The same dialog serves both so the fields, the
 * validation and the keyboard behaviour cannot drift apart.
 */

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { TaskDraft } from "@/lib/ops/store";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/lib/ops/types";
import type { Task, TaskPriority, TaskStatus, Venture } from "@/lib/ops/types";

export interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ventures: Venture[];
  /** Present when editing; absent when creating. */
  task?: Task;
  /** Pre-selected venture for a new task. */
  defaultVentureId?: string;
  onCreate: (draft: TaskDraft) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete?: (id: string) => void;
}

export function TaskDialog({
  open,
  onOpenChange,
  ventures,
  task,
  defaultVentureId,
  onCreate,
  onUpdate,
  onDelete,
}: TaskDialogProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [ventureId, setVentureId] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [due, setDue] = useState("");

  // Re-seed the form every time the dialog opens so a previous edit never
  // leaks into the next one.
  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setNotes(task?.notes ?? "");
    setVentureId(task?.ventureId ?? defaultVentureId ?? ventures[0]?.id ?? "");
    setStatus(task?.status ?? "todo");
    setPriority(task?.priority ?? "normal");
    setDue(task?.due ?? "");
  }, [open, task, defaultVentureId, ventures]);

  const canSave = title.trim().length > 0 && ventureId.length > 0;

  const save = () => {
    if (!canSave) return;
    const shape = {
      ventureId,
      title: title.trim(),
      notes: notes.trim() || undefined,
      status,
      priority,
      due: due || undefined,
    };
    if (task) onUpdate(task.id, shape);
    else onCreate(shape);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="jj-serif text-xl">
            {task ? "Edit task" : "New task"}
          </DialogTitle>
          <DialogDescription>
            {task
              ? "Change anything here and it updates everywhere in the console."
              : "Give it a venture and a title. Everything else is optional."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              autoFocus
              placeholder="What needs to happen?"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSave) {
                  e.preventDefault();
                  save();
                }
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="task-venture">Venture</Label>
              <Select value={ventureId} onValueChange={setVentureId}>
                <SelectTrigger id="task-venture">
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

            <div className="space-y-1.5">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
              >
                <SelectTrigger id="task-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger id="task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-notes">Notes</Label>
            <Textarea
              id="task-notes"
              value={notes}
              rows={3}
              placeholder="Context, links, who you are waiting on."
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {task && onDelete ? (
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                onDelete(task.id);
                onOpenChange(false);
              }}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!canSave}>
              {task ? "Save changes" : "Add task"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
