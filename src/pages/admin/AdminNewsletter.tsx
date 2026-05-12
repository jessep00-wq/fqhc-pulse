import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NewsletterSectionRenderer } from "@/components/newsletter/NewsletterSectionRenderer";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Send, Calendar, ArrowUp, ArrowDown, X } from "lucide-react";
import { IconUploader } from "@/components/admin/IconUploader";
import { ContentIcon } from "@/components/ContentIcon";
import type { Newsletter, NewsletterSection, SectionType } from "@/types/newsletter";

const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: "body_text", label: "Body Text" },
  { value: "intro", label: "Intro" },
  { value: "comparison", label: "Comparison (Good/Bad)" },
  { value: "checklist", label: "Checklist" },
  { value: "roles_grid", label: "Roles Grid" },
  { value: "sprint_steps", label: "Sprint Steps" },
  { value: "quote", label: "Quote" },
  { value: "callout", label: "Callout Box" },
  { value: "divider", label: "Divider" },
];

function emptySection(type: SectionType): NewsletterSection {
  switch (type) {
    case "intro": return { type: "intro", text: "" };
    case "body_text": return { type: "body_text", text: "", pill: "", heading: "" };
    case "comparison": return { type: "comparison", pill: "", heading: "", bad: { label: "Activity Only", text: "" }, good: { label: "Real Evidence", text: "" } };
    case "checklist": return { type: "checklist", pill: "", heading: "", items: [""] };
    case "roles_grid": return { type: "roles_grid", pill: "", heading: "", roles: [{ title: "", owns: "", description: "" }] };
    case "sprint_steps": return { type: "sprint_steps", pill: "", heading: "", steps: [{ title: "", description: "" }] };
    case "quote": return { type: "quote", text: "" };
    case "callout": return { type: "callout", label: "", text: "" };
    case "divider": return { type: "divider" };
  }
}

function SectionEditor({ section, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: {
  section: NewsletterSection;
  onChange: (s: NewsletterSection) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const s = section;
  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm capitalize">{s.type.replace("_", " ")}</CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveUp} disabled={isFirst}><ArrowUp className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveDown} disabled={isLast}><ArrowDown className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onRemove}><X className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {(s.type === "body_text" || s.type === "comparison" || s.type === "checklist" || s.type === "roles_grid" || s.type === "sprint_steps") && "pill" in s && (
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Pill label (optional)" value={(s as any).pill || ""} onChange={(e) => onChange({ ...s, pill: e.target.value } as any)} />
            {"heading" in s && <Input placeholder="Section heading" value={(s as any).heading || ""} onChange={(e) => onChange({ ...s, heading: e.target.value } as any)} />}
          </div>
        )}
        {(s.type === "intro" || s.type === "body_text" || s.type === "quote") && (
          <Textarea placeholder="Text content (use **bold** for emphasis)" rows={3} value={s.text} onChange={(e) => onChange({ ...s, text: e.target.value })} />
        )}
        {s.type === "callout" && (
          <>
            <Input placeholder="Label (e.g. 'The Real Goal')" value={s.label} onChange={(e) => onChange({ ...s, label: e.target.value })} />
            <Textarea placeholder="Callout text" rows={3} value={s.text} onChange={(e) => onChange({ ...s, text: e.target.value })} />
          </>
        )}
        {s.type === "comparison" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Input placeholder="Bad label" value={s.bad.label} onChange={(e) => onChange({ ...s, bad: { ...s.bad, label: e.target.value } })} />
              <Textarea placeholder="Bad example" rows={2} value={s.bad.text} onChange={(e) => onChange({ ...s, bad: { ...s.bad, text: e.target.value } })} />
            </div>
            <div className="space-y-2">
              <Input placeholder="Good label" value={s.good.label} onChange={(e) => onChange({ ...s, good: { ...s.good, label: e.target.value } })} />
              <Textarea placeholder="Good example" rows={2} value={s.good.text} onChange={(e) => onChange({ ...s, good: { ...s.good, text: e.target.value } })} />
            </div>
          </div>
        )}
        {s.type === "checklist" && (
          <div className="space-y-2">
            {s.items.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input value={item} onChange={(e) => { const items = [...s.items]; items[i] = e.target.value; onChange({ ...s, items }); }} placeholder={`Item ${i + 1}`} />
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => { const items = s.items.filter((_, j) => j !== i); onChange({ ...s, items }); }}><X className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => onChange({ ...s, items: [...s.items, ""] })}>+ Add item</Button>
          </div>
        )}
        {s.type === "roles_grid" && (
          <div className="space-y-3">
            {s.roles.map((role, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 items-start">
                <Input placeholder="Title" value={role.title} onChange={(e) => { const roles = [...s.roles]; roles[i] = { ...role, title: e.target.value }; onChange({ ...s, roles }); }} />
                <Input placeholder="Owns" value={role.owns} onChange={(e) => { const roles = [...s.roles]; roles[i] = { ...role, owns: e.target.value }; onChange({ ...s, roles }); }} />
                <div className="flex gap-1">
                  <Input placeholder="Description" value={role.description} onChange={(e) => { const roles = [...s.roles]; roles[i] = { ...role, description: e.target.value }; onChange({ ...s, roles }); }} />
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => { const roles = s.roles.filter((_, j) => j !== i); onChange({ ...s, roles }); }}><X className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => onChange({ ...s, roles: [...s.roles, { title: "", owns: "", description: "" }] })}>+ Add role</Button>
          </div>
        )}
        {s.type === "sprint_steps" && (
          <div className="space-y-3">
            {s.steps.map((step, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 items-start">
                <Input placeholder="Step title" value={step.title} onChange={(e) => { const steps = [...s.steps]; steps[i] = { ...step, title: e.target.value }; onChange({ ...s, steps }); }} />
                <div className="flex gap-1">
                  <Input placeholder="Description" value={step.description} onChange={(e) => { const steps = [...s.steps]; steps[i] = { ...step, description: e.target.value }; onChange({ ...s, steps }); }} />
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => { const steps = s.steps.filter((_, j) => j !== i); onChange({ ...s, steps }); }}><X className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => onChange({ ...s, steps: [...s.steps, { title: "", description: "" }] })}>+ Add step</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NewsletterEditor({ newsletter, onClose }: { newsletter?: Newsletter; onClose: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(newsletter?.title || "");
  const [subtitle, setSubtitle] = useState(newsletter?.subtitle || "");
  const [heroEmoji, setHeroEmoji] = useState(newsletter?.hero_emoji || "📋");
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(newsletter?.hero_image_url || null);
  const [heroSummary, setHeroSummary] = useState(newsletter?.hero_summary || "");
  const [sections, setSections] = useState<NewsletterSection[]>(newsletter?.sections || []);
  const [addType, setAddType] = useState<SectionType>("body_text");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (status?: string) => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        hero_emoji: heroEmoji.trim() || "📋",
        hero_image_url: heroImageUrl,
        hero_summary: heroSummary.trim() || null,
        sections: sections as any,
      };
      if (status) {
        payload.status = status;
        if (status === "published") payload.published_at = new Date().toISOString();
      }

      let savedId = newsletter?.id;
      if (newsletter?.id) {
        const { error } = await supabase.from("newsletters").update(payload).eq("id", newsletter.id);
        if (error) throw error;
      } else {
        if (status) payload.status = status;
        const { data: inserted, error } = await supabase.from("newsletters").insert(payload).select("id").single();
        if (error) throw error;
        savedId = inserted.id;
      }
      qc.invalidateQueries({ queryKey: ["admin-newsletters"] });

      // Trigger email send on publish
      if (status === "published" && savedId) {
        supabase.functions.invoke("send-newsletter", { body: { newsletterId: savedId } })
          .then(({ error }) => {
            if (error) { toast.error("Published but email send failed"); console.error(error); }
            else toast.success("Newsletter sent to subscribers!");
          });
      }

      toast.success(status === "published" ? "Published!" : "Saved!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (idx: number, s: NewsletterSection) => {
    const copy = [...sections]; copy[idx] = s; setSections(copy);
  };
  const removeSection = (idx: number) => setSections(sections.filter((_, i) => i !== idx));
  const moveSection = (idx: number, dir: -1 | 1) => {
    const copy = [...sections]; [copy[idx], copy[idx + dir]] = [copy[idx + dir], copy[idx]]; setSections(copy);
  };

  if (preview) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Preview</h3>
          <Button variant="outline" size="sm" onClick={() => setPreview(false)}>← Back to editor</Button>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-sidebar px-8 pt-8 pb-6">
            <div className="text-[11px] font-medium tracking-[2px] uppercase text-primary mb-2">FQHC Quality Newsletter</div>
            <h1 className="font-serif text-3xl text-sidebar-foreground">{title || "Untitled"}</h1>
          </div>
          {heroSummary && (
            <div className="bg-primary px-8 py-4 flex items-center gap-3">
              <ContentIcon imageUrl={heroImageUrl} emoji={heroEmoji} size={28} />
              <p className="text-sm font-medium text-primary-foreground">{heroSummary}</p>
            </div>
          )}
          <div className="px-8 py-8">
            {sections.map((s, i) => <NewsletterSectionRenderer key={i} section={s} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input placeholder="Title *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input placeholder="Subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        <Textarea placeholder="Hero summary (bold with **text**)" rows={2} value={heroSummary} onChange={(e) => setHeroSummary(e.target.value)} className="sm:col-span-2" />
      </div>

      <IconUploader
        folder="newsletter"
        label="Hero icon"
        value={heroImageUrl}
        emojiFallback={heroEmoji}
        onEmojiChange={setHeroEmoji}
        onChange={setHeroImageUrl}
      />

      <div>
        <h3 className="text-sm font-semibold mb-3">Sections ({sections.length})</h3>
        <div className="space-y-3 mb-4">
          {sections.map((s, i) => (
            <SectionEditor key={i} section={s} onChange={(ns) => updateSection(i, ns)} onRemove={() => removeSection(i)} onMoveUp={() => moveSection(i, -1)} onMoveDown={() => moveSection(i, 1)} isFirst={i === 0} isLast={i === sections.length - 1} />
          ))}
        </div>
        <div className="flex gap-2">
          <Select value={addType} onValueChange={(v) => setAddType(v as SectionType)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{SECTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setSections([...sections, emptySection(addType)])}><Plus className="h-4 w-4 mr-1" /> Add</Button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t pt-4">
        <Button onClick={() => save()} disabled={saving}>Save Draft</Button>
        <Button variant="outline" onClick={() => setPreview(true)}><Eye className="h-4 w-4 mr-1" /> Preview</Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="default" className="ml-auto gap-1.5" disabled={saving}><Send className="h-4 w-4" /> Publish</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Publish this newsletter?</AlertDialogTitle>
              <AlertDialogDescription>This will make the issue public and send it to all subscribers.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => save("published")}>Publish & Send</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function AdminNewsletter() {
  const qc = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: newsletters, isLoading } = useQuery({
    queryKey: ["admin-newsletters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("newsletters").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((d) => ({ ...d, sections: (d.sections as unknown as NewsletterSection[]) || [] })) as Newsletter[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("newsletters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-newsletters"] }); toast.success("Deleted"); },
  });

  const editNewsletter = newsletters?.find((n) => n.id === editId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Newsletter</h1>
          <p className="text-sm text-muted-foreground">Create and manage weekly newsletter issues</p>
        </div>
        <Dialog open={creating || !!editId} onOpenChange={(open) => { if (!open) { setCreating(false); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" /> New Issue</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Issue" : "New Issue"}</DialogTitle>
            </DialogHeader>
            <NewsletterEditor key={editId ?? "new"} newsletter={editNewsletter} onClose={() => { setCreating(false); setEditId(null); }} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : newsletters && newsletters.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {newsletters.map((nl) => (
                <TableRow key={nl.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setEditId(nl.id)}>
                  <TableCell className="font-medium">
                    <span className="mr-2">{nl.hero_emoji}</span>{nl.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant={nl.status === "published" ? "default" : "secondary"}>{nl.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{new Date(nl.published_at || nl.created_at).toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditId(nl.id)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                        {nl.status === "published" && (
                          <DropdownMenuItem onClick={() => window.open(`/newsletter/${nl.id}`, "_blank")}><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{nl.title}"?</AlertDialogTitle>
                              <AlertDialogDescription>This permanently removes the newsletter issue. This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(nl.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-lg font-medium mb-1">No newsletters yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create your first issue to start building your audience.</p>
          <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" /> New Issue</Button>
        </Card>
      )}
    </div>
  );
}
