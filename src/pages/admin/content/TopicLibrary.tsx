import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Play } from "lucide-react";
import { useTopics, useUpsertTopic, useDeleteTopic, useRunNow } from "@/hooks/useContentOps";

export function TopicLibrary() {
  const { data: topics = [] } = useTopics();
  const upsert = useUpsertTopic();
  const del = useDeleteTopic();
  const run = useRunNow();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", angle: "", priority: 100, notes: "" });

  const onAdd = async () => {
    if (!form.title.trim()) return;
    await upsert.mutateAsync({ title: form.title, angle: form.angle, priority: form.priority, notes: form.notes, status: "queued" });
    setForm({ title: "", angle: "", priority: 100, notes: "" });
    setOpen(false);
  };

  const queued = topics.filter((t) => t.status === "queued");
  const used = topics.filter((t) => t.status === "used");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Topic library</CardTitle>
            <CardDescription>The next monthly run picks the queued topic with the lowest priority number.</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" />New topic</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New topic</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="UDS performance benchmarking for 2026" /></div>
                <div className="space-y-1"><Label>Angle (optional)</Label><Input value={form.angle} onChange={(e) => setForm((f) => ({ ...f, angle: e.target.value }))} placeholder="Operational checklist + 5 measures to watch" /></div>
                <div className="space-y-1"><Label>Priority</Label><Input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: parseInt(e.target.value) || 100 }))} /></div>
                <div className="space-y-1"><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={onAdd} disabled={upsert.isPending}>Add</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {queued.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No queued topics. Add one — otherwise the AI will pick a generic monthly topic.</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Angle</TableHead><TableHead>Priority</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {queued.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.angle || "—"}</TableCell>
                    <TableCell className="text-sm">{t.priority}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => run.mutate({ topic_id: t.id })} title="Generate now using this topic" className="gap-1"><Play className="h-3.5 w-3.5" />Use now</Button>
                      <Button size="icon" variant="ghost" onClick={() => del.mutate(t.id)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {used.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Used topics</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {used.map((t) => (
                <li key={t.id} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.title}</span>
                  <Badge variant="outline" className="text-[10px]">used {t.used_at && new Date(t.used_at).toLocaleDateString()}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
