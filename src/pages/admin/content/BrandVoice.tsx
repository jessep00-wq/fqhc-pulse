import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, useUpsertSettings } from "@/hooks/useContentOps";

export function BrandVoice() {
  const { data: settings, isLoading } = useSettings();
  const upsert = useUpsertSettings();
  const [form, setForm] = useState({
    brand_voice_prompt: "",
    audience: "",
    tone_keywords: "",
    banned_phrases: "",
    reference_urls: "",
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      brand_voice_prompt: settings.brand_voice_prompt,
      audience: settings.audience,
      tone_keywords: (settings.tone_keywords || []).join(", "),
      banned_phrases: (settings.banned_phrases || []).join(", "),
      reference_urls: Array.isArray(settings.reference_urls) ? (settings.reference_urls as string[]).join("\n") : "",
    });
  }, [settings]);

  if (isLoading || !settings) return <Skeleton className="h-96 w-full" />;

  const onSave = () =>
    upsert.mutate({
      brand_voice_prompt: form.brand_voice_prompt,
      audience: form.audience,
      tone_keywords: form.tone_keywords.split(",").map((s) => s.trim()).filter(Boolean),
      banned_phrases: form.banned_phrases.split(",").map((s) => s.trim()).filter(Boolean),
      reference_urls: form.reference_urls.split("\n").map((s) => s.trim()).filter(Boolean) as unknown,
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand voice & AI context</CardTitle>
        <CardDescription>What every draft inherits before the AI starts writing. Changes apply on the next generation.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-3xl">
        <div className="space-y-1"><Label>Brand voice prompt</Label><Textarea rows={5} value={form.brand_voice_prompt} onChange={(e) => setForm((f) => ({ ...f, brand_voice_prompt: e.target.value }))} /></div>
        <div className="space-y-1"><Label>Target audience</Label><Textarea rows={2} value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))} /></div>
        <div className="space-y-1"><Label>Tone keywords (comma separated)</Label><Input value={form.tone_keywords} onChange={(e) => setForm((f) => ({ ...f, tone_keywords: e.target.value }))} /></div>
        <div className="space-y-1"><Label>Banned phrases (comma separated)</Label><Input value={form.banned_phrases} onChange={(e) => setForm((f) => ({ ...f, banned_phrases: e.target.value }))} /></div>
        <div className="space-y-1"><Label>Reference URLs (one per line)</Label><Textarea rows={4} value={form.reference_urls} onChange={(e) => setForm((f) => ({ ...f, reference_urls: e.target.value }))} placeholder="https://measurewise.org/blog/..." /></div>
        <div><Button onClick={onSave} disabled={upsert.isPending}>{upsert.isPending ? "Saving…" : "Save"}</Button></div>
      </CardContent>
    </Card>
  );
}
