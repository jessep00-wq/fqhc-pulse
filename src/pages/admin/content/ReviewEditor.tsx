import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Save, Check, X, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useDraft, useUpdateDraft, useApproveAndPublish, useRejectDraft, useRegenerateDraft } from "@/hooks/useContentOps";

export function ReviewEditor({ draftId, onBack }: { draftId: string; onBack: () => void }) {
  const { data: draft, isLoading } = useDraft(draftId);
  const update = useUpdateDraft();
  const approve = useApproveAndPublish();
  const reject = useRejectDraft();
  const regen = useRegenerateDraft();

  const [form, setForm] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!draft) return;
    setForm({
      blog_title: draft.blog_title || "",
      blog_slug: draft.blog_slug || "",
      blog_excerpt: draft.blog_excerpt || "",
      blog_meta_description: draft.blog_meta_description || "",
      blog_cta: draft.blog_cta || "",
      blog_body_md: draft.blog_body_md || "",
      newsletter_subject: draft.newsletter_subject || "",
      newsletter_body_md: draft.newsletter_body_md || "",
      linkedin_post: draft.linkedin_post || "",
    });
    setDirty(false);
  }, [draft]);

  if (isLoading || !draft) return <Skeleton className="h-96 w-full" />;

  const editable = draft.status === "pending_review" || draft.status === "approved";

  const onChange = (k: string, v: string) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true); };

  const onSave = async () => {
    await update.mutateAsync({ id: draft.id, patch: form as never });
    setDirty(false);
    toast.success("Draft saved");
  };

  const onApprove = async () => {
    if (dirty) await update.mutateAsync({ id: draft.id, patch: form as never });
    approve.mutate(draft.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1"><ArrowLeft className="h-4 w-4" />Back</Button>
          <Badge variant="secondary">{draft.status.replace(/_/g, " ")}</Badge>
          {draft.model && <span className="text-xs text-muted-foreground">{draft.model}</span>}
          <span className="text-xs text-muted-foreground">Generated {new Date(draft.generated_at).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSave} disabled={!dirty || !editable} className="gap-1"><Save className="h-4 w-4" />Save</Button>
          <Button variant="outline" size="sm" onClick={() => regen.mutate({ id: draft.id, topic: draft.topic })} disabled={regen.isPending} className="gap-1"><RefreshCcw className="h-4 w-4" />Regenerate</Button>
          <Button variant="outline" size="sm" onClick={() => setRejectOpen(true)} disabled={!editable} className="gap-1 text-destructive"><X className="h-4 w-4" />Reject</Button>
          <Button size="sm" onClick={onApprove} disabled={!editable || approve.isPending} className="gap-1"><Check className="h-4 w-4" />Approve & Publish</Button>
        </div>
      </div>

      {draft.status === "failed" && draft.generation_error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-sm text-destructive">Generation failed: {draft.generation_error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Blog post</CardTitle>
            <CardDescription>Publishes to <code className="text-xs">/blog/{form.blog_slug || "…"}</code></CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Title"><Input value={form.blog_title} onChange={(e) => onChange("blog_title", e.target.value)} disabled={!editable} /></Field>
            <Field label="Slug"><Input value={form.blog_slug} onChange={(e) => onChange("blog_slug", e.target.value)} disabled={!editable} /></Field>
            <Field label="Excerpt"><Textarea rows={2} value={form.blog_excerpt} onChange={(e) => onChange("blog_excerpt", e.target.value)} disabled={!editable} /></Field>
            <Field label="Meta description"><Textarea rows={2} value={form.blog_meta_description} onChange={(e) => onChange("blog_meta_description", e.target.value)} disabled={!editable} /></Field>
            <Field label="CTA"><Input value={form.blog_cta} onChange={(e) => onChange("blog_cta", e.target.value)} disabled={!editable} /></Field>
            <Field label="Body (markdown)"><Textarea rows={20} className="font-mono text-xs" value={form.blog_body_md} onChange={(e) => onChange("blog_body_md", e.target.value)} disabled={!editable} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Newsletter</CardTitle>
            <CardDescription>Saves as draft in the Newsletter admin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Subject"><Input value={form.newsletter_subject} onChange={(e) => onChange("newsletter_subject", e.target.value)} disabled={!editable} /></Field>
            <Field label="Body (markdown)"><Textarea rows={28} className="font-mono text-xs" value={form.newsletter_body_md} onChange={(e) => onChange("newsletter_body_md", e.target.value)} disabled={!editable} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">LinkedIn post</CardTitle>
            <CardDescription>Never auto-shared. Approve here, then share manually from the LinkedIn Share tab.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Post body">
              <Textarea rows={28} value={form.linkedin_post} onChange={(e) => onChange("linkedin_post", e.target.value)} disabled={!editable} />
            </Field>
            <div className="text-xs text-muted-foreground">{(form.linkedin_post || "").length} / 1300 chars</div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this draft?</DialogTitle>
            <DialogDescription>The draft will be marked rejected and won't publish. Logged in the activity feed.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Why is this being rejected?" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { reject.mutate({ id: draft.id, reason: rejectReason }); setRejectOpen(false); onBack(); }}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}
