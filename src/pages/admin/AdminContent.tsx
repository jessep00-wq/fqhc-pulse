import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Play, Inbox, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import {
  useDrafts, useSettings, useActivity, useLinkedinShares,
  useRunNow,
} from "@/hooks/useContentOps";
import { ContentDashboard } from "./content/ContentDashboard";
import { ContentCalendar } from "./content/ContentCalendar";
import { ReviewQueue } from "./content/ReviewQueue";
import { ReviewEditor } from "./content/ReviewEditor";
import { BrandVoice } from "./content/BrandVoice";
import { TopicLibrary } from "./content/TopicLibrary";
import { PublishingLog } from "./content/PublishingLog";
import { LinkedInQueue } from "./content/LinkedInQueue";
import { AutomationSettings } from "./content/AutomationSettings";

export default function AdminContent() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "dashboard";
  const reviewDraftId = params.get("draft") || undefined;
  const setTab = (t: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", t);
    if (t !== "review") next.delete("draft");
    setParams(next, { replace: true });
  };

  const { data: drafts = [], isLoading: draftsLoading } = useDrafts();
  const { data: settings } = useSettings();
  const { data: activity = [] } = useActivity(200);
  const { data: shares = [] } = useLinkedinShares();
  const runNow = useRunNow();

  const pending = useMemo(() => drafts.filter((d) => d.status === "pending_review" || d.status === "generating"), [drafts]);
  const approvedForLinkedin = useMemo(() => drafts.filter((d) => d.status === "approved" || d.status === "published"), [drafts]);

  // If a review draft id is present but the tab isn't review, fall through to the dashboard.
  const showReviewEditor = tab === "review" && reviewDraftId;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Content Ops</h1>
            <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" />AI-assisted</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Monthly AI-drafted blog, newsletter and LinkedIn content with human review before anything ships.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LastRunBadge
            status={settings?.last_run_status}
            at={settings?.last_run_at}
            error={settings?.last_run_error}
          />
          <Button onClick={() => runNow.mutate(undefined)} disabled={runNow.isPending} className="gap-2">
            <Play className="h-4 w-4" />
            {runNow.isPending ? "Running…" : "Run now"}
          </Button>
        </div>
      </div>

      {pending.length > 0 && tab !== "review" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Inbox className="h-4 w-4 text-primary" />
              {pending.length} draft{pending.length === 1 ? "" : "s"} awaiting review
            </CardTitle>
            <CardDescription>Generated content stays in Pending Review until you approve, reject, or regenerate it.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pending.slice(0, 4).map((d) => (
                <Button key={d.id} size="sm" variant="outline" onClick={() => { const n = new URLSearchParams(params); n.set("tab", "review"); n.set("draft", d.id); setParams(n, { replace: true }); }}>
                  {d.blog_title || d.topic || "Untitled draft"}
                </Button>
              ))}
              {pending.length > 4 && (
                <Button size="sm" variant="ghost" onClick={() => setTab("queue")}>View all</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="queue">Review Queue {pending.length > 0 && <Badge variant="secondary" className="ml-2">{pending.length}</Badge>}</TabsTrigger>
          {showReviewEditor && <TabsTrigger value="review">Review Editor</TabsTrigger>}
          <TabsTrigger value="brand">Brand Voice</TabsTrigger>
          <TabsTrigger value="topics">Topic Library</TabsTrigger>
          <TabsTrigger value="log">Publishing Log</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn Share</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          {draftsLoading ? <Skeleton className="h-60 w-full" /> : <ContentDashboard drafts={drafts} settings={settings ?? null} onOpenDraft={(id) => { const n = new URLSearchParams(params); n.set("tab", "review"); n.set("draft", id); setParams(n, { replace: true }); }} />}
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <ContentCalendar drafts={drafts} />
        </TabsContent>
        <TabsContent value="queue" className="mt-4">
          <ReviewQueue drafts={drafts} onOpen={(id) => { const n = new URLSearchParams(params); n.set("tab", "review"); n.set("draft", id); setParams(n, { replace: true }); }} />
        </TabsContent>
        <TabsContent value="review" className="mt-4">
          {showReviewEditor && <ReviewEditor draftId={reviewDraftId!} onBack={() => setTab("queue")} />}
        </TabsContent>
        <TabsContent value="brand" className="mt-4">
          <BrandVoice />
        </TabsContent>
        <TabsContent value="topics" className="mt-4">
          <TopicLibrary />
        </TabsContent>
        <TabsContent value="log" className="mt-4">
          <PublishingLog activity={activity} drafts={drafts} />
        </TabsContent>
        <TabsContent value="linkedin" className="mt-4">
          <LinkedInQueue drafts={approvedForLinkedin} shares={shares} />
        </TabsContent>
        <TabsContent value="automation" className="mt-4">
          <AutomationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LastRunBadge({ status, at, error }: { status: string | null | undefined; at: string | null | undefined; error: string | null | undefined }) {
  if (!at) return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />No runs yet</Badge>;
  const ts = new Date(at).toLocaleString();
  if (status === "success") return <Badge variant="outline" className="gap-1 border-emerald-300 text-emerald-700"><CheckCircle2 className="h-3 w-3" />Last run OK · {ts}</Badge>;
  if (status === "failed") return <Badge variant="outline" className="gap-1 border-destructive text-destructive" title={error || ""}><AlertCircle className="h-3 w-3" />Last run failed · {ts}</Badge>;
  return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{ts}</Badge>;
}
