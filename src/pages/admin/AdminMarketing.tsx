import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Megaphone, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateLinkedInPosts, TOPICS } from "@/lib/marketing/linkedinAgent.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Status = "draft" | "ready" | "posted" | "archived";
type Post = {
  id: string; topic: string; hook: string; body: string; link_url: string | null;
  hashtags: string[]; status: Status; created_at: string; posted_at: string | null;
};

const fullText = (p: Post) =>
  [p.hook, "", p.body, "", p.link_url ?? "", "", p.hashtags.join(" ")].join("\n").trim();

export default function AdminMarketing() {
  const qc = useQueryClient();
  const generate = useServerFn(generateLinkedInPosts);
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Status>("draft");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["marketing_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_posts").select("*").eq("channel", "linkedin")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["marketing_posts"] });

  const run = async () => {
    setBusy(true);
    try {
      const res = await generate({ data: { topic, count: 3, notes } });
      if (res.ok) { toast.success(`${res.created} new drafts ready to review`); setTab("draft"); refresh(); }
      else toast.error(res.error);
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setBusy(false); }
  };

  const setStatus = async (p: Post, status: Status) => {
    const { error } = await supabase.from("marketing_posts")
      .update({ status, posted_at: status === "posted" ? new Date().toISOString() : p.posted_at })
      .eq("id", p.id);
    if (error) toast.error("Could not update"); else refresh();
  };
  const copy = async (p: Post) => {
    await navigator.clipboard.writeText(fullText(p));
    toast.success("Copied. Paste it into LinkedIn.");
  };

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const counts = {
    draft: posts.filter((p) => p.status === "draft").length,
    ready: posts.filter((p) => p.status === "ready").length,
    postedMonth: posts.filter((p) => p.posted_at && new Date(p.posted_at) >= monthStart).length,
  };
  const shown = posts.filter((p) => p.status === tab);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="h-6 w-6 text-primary" /> LinkedIn Content Agent</h1>
        <p className="text-sm text-muted-foreground">Drafts posts in your voice. Nothing is posted until you copy it to LinkedIn.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[["Drafts to review", counts.draft], ["Ready to post", counts.ready], ["Posted this month", counts.postedMonth]].map(([l, v]) => (
          <Card key={l as string}><CardContent className="pt-6"><div className="text-2xl font-bold">{v}</div><div className="text-xs text-muted-foreground">{l}</div></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Generate new drafts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="max-w-md"><SelectValue /></SelectTrigger>
            <SelectContent>{TOPICS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Textarea placeholder="Optional direction, e.g. mention site visit season, or a lesson from your nursing days" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          <Button onClick={run} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {busy ? "Drafting..." : "Generate 3 post drafts"}
          </Button>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="ready">Ready to post</TabsTrigger>
          <TabsTrigger value="posted">Posted</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <div className="space-y-4">
          {shown.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">{p.topic}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed border rounded-md p-4 bg-muted/30">
                  <p className="font-semibold">{p.hook}</p>
                  <p className="mt-3">{p.body}</p>
                  {p.link_url && <p className="mt-3 text-primary break-all">{p.link_url}</p>}
                  <p className="mt-3 text-muted-foreground">{p.hashtags.join(" ")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => copy(p)}><Copy className="h-4 w-4 mr-1" /> Copy</Button>
                  {p.status === "draft" && <Button size="sm" variant="outline" onClick={() => setStatus(p, "ready")}>Approve</Button>}
                  {p.status !== "posted" && <Button size="sm" variant="outline" onClick={() => setStatus(p, "posted")}>Mark as posted</Button>}
                  {p.status !== "archived" && <Button size="sm" variant="ghost" onClick={() => setStatus(p, "archived")}>Archive</Button>}
                  {p.status === "archived" && <Button size="sm" variant="ghost" onClick={() => setStatus(p, "draft")}>Restore</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
