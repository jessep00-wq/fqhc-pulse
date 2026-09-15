/**
 * The capture inbox — somewhere to put a thought before it has a shape.
 *
 * Nothing here is a commitment. A note either becomes a task on a venture or
 * gets thrown away, which is the point: the inbox exists so that catching an
 * idea never costs a decision about where it belongs.
 */

import { useState } from "react";
import { ArrowRight, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { sortedCaptures } from "@/lib/ops/selectors";
import type { OpsData } from "@/lib/ops/types";
import { EmptyState, SectionLabel } from "@/components/ops/primitives";

export interface CaptureInboxProps {
  data: OpsData;
  onCapture: (text: string) => void;
  onPromote: (id: string, ventureId: string) => void;
  onDelete: (id: string) => void;
}

export function CaptureInbox({
  data,
  onCapture,
  onPromote,
  onDelete,
}: CaptureInboxProps) {
  const [text, setText] = useState("");
  const captures = sortedCaptures(data.captures);
  const ventures = data.ventures.filter((v) => !v.archived);

  const submit = () => {
    if (!text.trim()) return;
    onCapture(text);
    setText("");
  };

  return (
    <div className="space-y-5">
      <section className="jj-card p-5">
        <SectionLabel>Capture</SectionLabel>
        <h2 className="jj-serif mt-1 text-2xl font-semibold text-foreground">
          Get it out of your head
        </h2>
        <Textarea
          value={text}
          rows={3}
          className="mt-3"
          placeholder="Anything worth keeping. Press ⌘ + Enter to save."
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={submit} disabled={!text.trim()}>
            Save note
          </Button>
        </div>
      </section>

      <section className="jj-card p-5">
        <div className="flex items-center justify-between">
          <SectionLabel>Inbox</SectionLabel>
          <span className="text-xs font-semibold text-muted-foreground">
            {captures.length}
          </span>
        </div>

        {captures.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="Inbox is empty"
              hint="Nothing waiting to be sorted."
            />
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {captures.map((capture) => (
              <li key={capture.id} className="flex items-start gap-3 py-3">
                <p className="jj-read min-w-0 flex-1 text-sm text-foreground">
                  {capture.text}
                </p>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="shrink-0">
                      Make a task
                      <ArrowRight className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {ventures.map((v) => (
                      <DropdownMenuItem
                        key={v.id}
                        onSelect={() => onPromote(capture.id, v.id)}
                      >
                        {v.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete note"
                  onClick={() => onDelete(capture.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
