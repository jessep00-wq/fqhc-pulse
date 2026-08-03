import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, History } from "lucide-react";
import {
  CREATED_FIELD,
  displayValue,
  fieldLabel,
  fmtDateTime,
  type RecordRevision,
} from "@/lib/cycleHistory";

interface Props {
  revisions: RecordRevision[];
  loading?: boolean;
  /** user id -> display name */
  names: Record<string, string>;
}

export function CycleHistoryTab({ revisions, loading, names }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const byDay = new Map<string, RecordRevision[]>();
    for (const r of revisions) {
      const day = r.created_at.slice(0, 10);
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(r);
    }
    return [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [revisions]);

  if (loading) {
    return <p className="text-sm text-muted-foreground py-6">Loading change history…</p>;
  }

  if (revisions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <History className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          No changes recorded yet. Every future edit to this cycle is logged here permanently —
          previous values are kept, never overwritten.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Every edit to this cycle is recorded permanently. Previous values are retained so you can
        show an auditor how the plan evolved.
      </p>

      {groups.map(([day, entries]) => (
        <div key={day} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {fmtDateTime(entries[0].created_at).split(" at ")[0]}
          </p>
          <div className="space-y-2">
            {entries.map((r) => {
              const isCreate = r.field_name === CREATED_FIELD;
              const who = r.changed_by ? names[r.changed_by] || "A team member" : "System";
              const open = expanded[r.id];
              return (
                <div key={r.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{fieldLabel(r.field_name)}</span>
                        {!isCreate && <span className="text-muted-foreground"> updated</span>}
                        <span className="text-muted-foreground"> by {who}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(r.created_at)}</p>
                    </div>
                    {r.field_name === "status" && (
                      <Badge variant="secondary" className="shrink-0">
                        {displayValue("status", r.new_value)}
                      </Badge>
                    )}
                  </div>

                  {!isCreate && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-7 px-1 text-xs text-muted-foreground"
                        onClick={() => setExpanded((p) => ({ ...p, [r.id]: !p[r.id] }))}
                      >
                        {open ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                        {open ? "Hide previous value" : "Show previous value"}
                      </Button>
                      {open && (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <div className="rounded-md bg-muted/60 p-2">
                            <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-1">Before</p>
                            <p className="text-xs whitespace-pre-wrap break-words">
                              {displayValue(r.field_name, r.old_value)}
                            </p>
                          </div>
                          <div className="rounded-md bg-primary/5 p-2">
                            <p className="text-[11px] font-semibold uppercase text-primary mb-1">After</p>
                            <p className="text-xs whitespace-pre-wrap break-words">
                              {displayValue(r.field_name, r.new_value)}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CycleHistoryTab;
