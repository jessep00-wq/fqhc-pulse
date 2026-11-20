import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { generateOutreachNotes } from "@/lib/marketing/linkedinAgent.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const LABELS: Record<string, string> = { resource: "Free PDSA template", readiness: "Readiness assessment", peer: "Peer question" };

export function OutreachGenerator() {
  const gen = useServerFn(generateOutreachNotes);
  const [f, setF] = useState({ name: "", title: "", center: "", focus: "" });
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<{ style: string; text: string }[]>([]);

  const run = async () => {
    if (!f.center.trim()) { toast.error("Add the health center name"); return; }
    setBusy(true);
    try {
      const res = await gen({ data: f });
      if (res.ok) setMsgs(res.messages); else toast.error(res.error);
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setBusy(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Peer outreach notes</CardTitle>
        <p className="text-sm text-muted-foreground">Enter a Quality Director you want to connect with. You get 3 short, no-pitch connection notes.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <Input placeholder="First name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Input placeholder="Title, e.g. Quality Director" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <Input placeholder="Health center" value={f.center} onChange={(e) => setF({ ...f, center: e.target.value })} />
        </div>
        <Textarea rows={2} placeholder="Optional: what they post about or care about, e.g. hypertension control, upcoming site visit" value={f.focus} onChange={(e) => setF({ ...f, focus: e.target.value })} />
        <Button onClick={run} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          {busy ? "Writing..." : "Write 3 notes"}
        </Button>
        {msgs.map((m, i) => (
          <div key={i} className="border rounded-md p-3 bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{LABELS[m.style] ?? m.style}</Badge>
              <span className="text-xs text-muted-foreground">{m.text.length}/300</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{m.text}</p>
            <Button size="sm" variant="outline" onClick={async () => { await navigator.clipboard.writeText(m.text); toast.success("Copied. Paste it into your LinkedIn invite."); }}>
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
