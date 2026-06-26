import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ContentDraft, ContentSettings } from "@/hooks/useContentOps";
import { ArrowRight, FileText, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

function startOfYear(): Date { const d = new Date(); d.setMonth(0, 1); d.setHours(0, 0, 0, 0); return d; }
function startOfMonth(): Date { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; }

export function ContentDashboard({
  drafts, settings, onOpenDraft,
}: {
  drafts: ContentDraft[];
  settings: ContentSettings | null;
  onOpenDraft: (id: string) => void;
}) {
  const pending = drafts.filter((d) => d.status === "pending_review" || d.status === "generating");
  const monthDrafts = drafts.filter((d) => new Date(d.generated_at) >= startOfMonth());
  const publishedYTD = drafts.filter((d) => d.status === "published" && d.published_at && new Date(d.published_at) >= startOfYear());

  const tiles = [
    { label: "Awaiting Review", value: pending.length, icon: Clock, tone: "text-primary" },
    { label: "Drafts this month", value: monthDrafts.length, icon: FileText, tone: "text-foreground" },
    { label: "Published YTD", value: publishedYTD.length, icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "Last run", value: settings?.last_run_status ? labelFor(settings.last_run_status) : "—", icon: settings?.last_run_status === "failed" ? XCircle : Clock, tone: settings?.last_run_status === "failed" ? "text-destructive" : "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t.label}</span>
                <t.icon className={`h-4 w-4 ${t.tone}`} />
              </div>
              <div className="text-2xl font-bold">{t.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Awaiting review</CardTitle>
          <CardDescription>Drafts the AI generated that haven't been approved or rejected yet.</CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No drafts in the queue. Click "Run now" to generate one for testing, or wait for the monthly schedule.</p>
          ) : (
            <ul className="divide-y">
              {pending.map((d) => (
                <li key={d.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate flex items-center gap-2">
                      {d.status === "generating" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                      {d.blog_title || d.topic || "Untitled draft"}
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(d.generated_at).toLocaleString()} · {d.triggered_by}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={d.status === "generating" ? "secondary" : "outline"}>{labelFor(d.status)}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => onOpenDraft(d.id)} className="gap-1">Review <ArrowRight className="h-3.5 w-3.5" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recently published</CardTitle>
        </CardHeader>
        <CardContent>
          {publishedYTD.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nothing published yet.</p>
          ) : (
            <ul className="divide-y">
              {publishedYTD.slice(0, 5).map((d) => (
                <li key={d.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{d.blog_title}</div>
                    <div className="text-xs text-muted-foreground">Published {d.published_at && new Date(d.published_at).toLocaleDateString()}</div>
                  </div>
                  {d.blog_slug && (
                    <a href={`/blog/${d.blog_slug}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View</a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function labelFor(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
