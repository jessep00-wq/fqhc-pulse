import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ContentActivity, ContentDraft } from "@/hooks/useContentOps";

const ACTION_LABEL: Record<string, string> = {
  generated: "Generated",
  edited: "Edited",
  approved: "Approved",
  rejected: "Rejected",
  regenerated: "Regenerated",
  published_blog: "Published to blog",
  published_newsletter: "Published to newsletter (draft)",
  linkedin_marked_shared: "LinkedIn marked shared",
  run_failed: "Run failed",
};

const ACTION_TONE: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-muted text-muted-foreground",
  run_failed: "bg-destructive/15 text-destructive",
  published_blog: "bg-emerald-600 text-white",
  published_newsletter: "bg-emerald-600 text-white",
};

export function PublishingLog({ activity, drafts }: { activity: ContentActivity[]; drafts: ContentDraft[] }) {
  const titles = new Map(drafts.map((d) => [d.id, d.blog_title || d.topic || "Untitled"]));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Publishing log</CardTitle>
        <CardDescription>Append-only audit trail of every action in Content Ops.</CardDescription>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No activity yet.</p>
        ) : (
          <ul className="divide-y">
            {activity.map((a) => (
              <li key={a.id} className="py-3 flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={ACTION_TONE[a.action] || ""}>{ACTION_LABEL[a.action] || a.action}</Badge>
                    {a.draft_id && titles.get(a.draft_id) && (
                      <span className="font-medium truncate">{titles.get(a.draft_id)}</span>
                    )}
                  </div>
                  {Object.keys(a.payload || {}).length > 0 && (
                    <pre className="text-[11px] text-muted-foreground mt-1 truncate whitespace-pre-wrap font-mono">{JSON.stringify(a.payload)}</pre>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{new Date(a.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
