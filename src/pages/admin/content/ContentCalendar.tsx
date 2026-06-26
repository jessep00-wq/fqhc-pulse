import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ContentDraft } from "@/hooks/useContentOps";

function firstMondayOfMonth(year: number, month: number): Date {
  const d = new Date(Date.UTC(year, month, 1));
  while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

export function ContentCalendar({ drafts }: { drafts: ContentDraft[] }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // Sunday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsByDay = useMemo(() => {
    const m: Record<number, ContentDraft[]> = {};
    for (const d of drafts) {
      const t = d.published_at ? new Date(d.published_at) : new Date(d.generated_at);
      if (t.getFullYear() === year && t.getMonth() === month) {
        const day = t.getDate();
        (m[day] ||= []).push(d);
      }
    }
    return m;
  }, [drafts, year, month]);

  const scheduledDay = firstMondayOfMonth(year, month).getUTCDate();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}</CardTitle>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }}>Today</Button>
          <Button size="icon" variant="ghost" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="px-2 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden">
          {Array.from({ length: startDay }).map((_, i) => <div key={`b${i}`} className="bg-muted/30 min-h-[88px]" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const events = eventsByDay[day] || [];
            const isScheduled = day === scheduledDay;
            return (
              <div key={day} className="bg-card min-h-[88px] p-2 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{day}</span>
                  {isScheduled && <span className="text-[9px] uppercase tracking-wider text-primary font-semibold">Run</span>}
                </div>
                <div className="space-y-1">
                  {events.slice(0, 2).map((e) => (
                    <div key={e.id} className={`truncate rounded px-1.5 py-0.5 text-[10px] ${e.status === "published" ? "bg-emerald-100 text-emerald-900" : e.status === "pending_review" ? "bg-primary/15 text-primary" : e.status === "failed" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`} title={e.blog_title || e.topic}>
                      {e.blog_title || e.topic}
                    </div>
                  ))}
                  {events.length > 2 && <div className="text-[10px] text-muted-foreground">+{events.length - 2} more</div>}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">Scheduled monthly run highlighted in teal. Past runs and publishes show inline on the day they occurred.</p>
      </CardContent>
    </Card>
  );
}
