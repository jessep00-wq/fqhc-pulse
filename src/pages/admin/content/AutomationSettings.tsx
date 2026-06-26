import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, AlertCircle, CheckCircle2 } from "lucide-react";
import { useSettings, useUpsertSettings, useRunNow } from "@/hooks/useContentOps";

const MODELS = [
  { value: "openai/gpt-5", label: "OpenAI GPT-5 (recommended)" },
  { value: "openai/gpt-5-mini", label: "OpenAI GPT-5 mini (faster, cheaper)" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (cheapest)" },
];

export function AutomationSettings() {
  const { data: settings, isLoading } = useSettings();
  const upsert = useUpsertSettings();
  const run = useRunNow();
  const [form, setForm] = useState({
    schedule_enabled: true,
    schedule_label: "",
    schedule_cron: "",
    recipient_email: "",
    model: "openai/gpt-5",
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      schedule_enabled: settings.schedule_enabled,
      schedule_label: settings.schedule_label,
      schedule_cron: settings.schedule_cron,
      recipient_email: settings.recipient_email,
      model: settings.model,
    });
  }, [settings]);

  if (isLoading || !settings) return <Skeleton className="h-72 w-full" />;

  const onSave = () => upsert.mutate(form);

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Automation</CardTitle>
          <CardDescription>Schedule, model, and recipient for the monthly content run.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="font-medium">Monthly auto-generation</Label>
              <p className="text-xs text-muted-foreground">When on, the cron job runs every Monday at 13:00 UTC; the function only proceeds on the first Monday of the month.</p>
            </div>
            <Switch checked={form.schedule_enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, schedule_enabled: v }))} />
          </div>
          <div className="space-y-1">
            <Label>Schedule label (human-readable)</Label>
            <Input value={form.schedule_label} onChange={(e) => setForm((f) => ({ ...f, schedule_label: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Cron expression (advanced)</Label>
            <Input value={form.schedule_cron} onChange={(e) => setForm((f) => ({ ...f, schedule_cron: e.target.value }))} className="font-mono" />
            <p className="text-xs text-muted-foreground">Default <code>0 13 * * 1</code> = Mondays at 13:00 UTC. Edge function enforces "first Monday of month" gating.</p>
          </div>
          <div className="space-y-1">
            <Label>Reviewer email</Label>
            <Input type="email" value={form.recipient_email} onChange={(e) => setForm((f) => ({ ...f, recipient_email: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>AI model</Label>
            <Select value={form.model} onValueChange={(v) => setForm((f) => ({ ...f, model: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onSave} disabled={upsert.isPending}>{upsert.isPending ? "Saving…" : "Save"}</Button>
            <Button variant="outline" onClick={() => run.mutate(undefined)} disabled={run.isPending} className="gap-1"><Play className="h-4 w-4" />Run now</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Last run</CardTitle></CardHeader>
        <CardContent className="text-sm">
          {settings.last_run_at ? (
            <div className="flex items-start gap-2">
              {settings.last_run_status === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" /> : <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />}
              <div>
                <div>{new Date(settings.last_run_at).toLocaleString()} · {settings.last_run_status}</div>
                {settings.last_run_error && <div className="text-xs text-destructive mt-1">{settings.last_run_error}</div>}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No runs recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
