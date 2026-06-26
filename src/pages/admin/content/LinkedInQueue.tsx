import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";
import type { ContentDraft, LinkedinShare } from "@/hooks/useContentOps";
import { useMarkLinkedinShared } from "@/hooks/useContentOps";

export function LinkedInQueue({ drafts, shares }: { drafts: ContentDraft[]; shares: LinkedinShare[] }) {
  const sharedSet = useMemo(() => new Set(shares.map((s) => s.draft_id)), [shares]);
  const mark = useMarkLinkedinShared();
  const [urlByDraft, setUrlByDraft] = useState<Record<string, string>>({});

  const onCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const openLinkedinComposer = () => {
    window.open("https://www.linkedin.com/feed/?shareActive=true", "_blank", "noreferrer");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">LinkedIn Share Queue</CardTitle>
        <CardDescription>
          Approved LinkedIn posts you can copy and share manually. <strong>Nothing auto-posts.</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No approved drafts yet.</p>
        ) : (
          drafts.map((d) => {
            const isShared = sharedSet.has(d.id);
            return (
              <div key={d.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <div className="font-medium">{d.blog_title || d.topic}</div>
                    <div className="text-xs text-muted-foreground">Approved · {(d.linkedin_post || "").length} chars</div>
                  </div>
                  {isShared ? <Badge variant="secondary" className="bg-emerald-100 text-emerald-900 gap-1"><Check className="h-3 w-3" />Shared</Badge> : <Badge variant="outline">Awaiting share</Badge>}
                </div>
                <Textarea readOnly rows={8} value={d.linkedin_post || ""} className="font-mono text-xs" />
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => onCopy(d.linkedin_post || "")} className="gap-1"><Copy className="h-3.5 w-3.5" />Copy</Button>
                  <Button size="sm" variant="outline" onClick={openLinkedinComposer} className="gap-1"><ExternalLink className="h-3.5 w-3.5" />Open LinkedIn</Button>
                  {!isShared && (
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Post URL (optional)</Label>
                        <Input className="h-8 w-72" placeholder="https://www.linkedin.com/posts/..." value={urlByDraft[d.id] || ""} onChange={(e) => setUrlByDraft((m) => ({ ...m, [d.id]: e.target.value }))} />
                      </div>
                      <Button size="sm" onClick={() => mark.mutate({ draft_id: d.id, external_url: urlByDraft[d.id] })} className="gap-1"><Check className="h-3.5 w-3.5" />Mark shared</Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
