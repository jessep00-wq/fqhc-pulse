import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  listPromptVersions,
  createPromptVersion,
  setActivePromptVersion,
} from "@/lib/ai/promptVersions.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, CheckCircle, X } from "lucide-react";

interface PromptVersion {
  id: string;
  flag_key: string;
  version: number;
  prompt_text: string;
  system_text: string | null;
  model_name: string | null;
  model_provider: string | null;
  is_active: boolean;
  created_at: string;
}

export function AiPromptsPanel() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listPromptVersions);
  const createFn = useServerFn(createPromptVersion);
  const activateFn = useServerFn(setActivePromptVersion);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin_ai_prompt_versions"],
    queryFn: () => listFn(),
  });

  const [editing, setEditing] = useState<Partial<PromptVersion> | null>(null);

  const createMutation = useMutation({
    mutationFn: createFn,
    onSuccess: () => {
      toast.success("Prompt version created");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin_ai_prompt_versions"] });
    },
    onError: (e) => toast.error(`Failed: ${e?.message ?? ""}`),
  });

  const activateMutation = useMutation({
    mutationFn: activateFn,
    onSuccess: () => {
      toast.success("Active prompt updated");
      queryClient.invalidateQueries({ queryKey: ["admin_ai_prompt_versions"] });
    },
    onError: (e) => toast.error(`Failed: ${e?.message ?? ""}`),
  });

  const versions = (data as PromptVersion[]).sort(
    (a, b) => a.flag_key.localeCompare(b.flag_key) || b.version - a.version
  );
  const grouped = versions.reduce<Record<string, PromptVersion[]>>((acc, v) => {
    acc[v.flag_key] = acc[v.flag_key] ?? [];
    acc[v.flag_key].push(v);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Prompt versions</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setEditing({ prompt_text: "" })}>
          <Plus className="h-4 w-4 mr-1" /> New version
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No prompt versions recorded.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([flagKey, items]) => (
              <div key={flagKey}>
                <h4 className="text-sm font-semibold mb-2">{flagKey}</h4>
                <div className="space-y-2">
                  {items.map((v) => (
                    <div key={v.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Version {v.version}</span>
                          {v.is_active && <Badge variant="outline" className="bg-success/10 text-success border-success/30">Active</Badge>}
                        </div>
                        {!v.is_active && (
                          <Button size="sm" variant="ghost" onClick={() => activateMutation.mutate({ id: v.id, flag_key: v.flag_key })}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Set active
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{v.prompt_text}</p>
                      {v.model_name && <p className="text-xs text-muted-foreground">Model: {v.model_name}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create prompt version</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Flag key</Label>
                <Input value={editing?.flag_key ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, flag_key: e.target.value }))} placeholder="e.g. ai_evidence_auditor" />
              </div>
              <div className="space-y-1.5">
                <Label>Version number</Label>
                <Input type="number" value={editing?.version ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, version: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Model provider</Label>
                <Input value={editing?.model_provider ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, model_provider: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Model name</Label>
                <Input value={editing?.model_name ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, model_name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>System prompt</Label>
              <Textarea value={editing?.system_text ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, system_text: e.target.value }))} rows={4} />
            </div>
            <div className="space-y-1.5">
              <Label>Prompt text</Label>
              <Textarea value={editing?.prompt_text ?? ""} onChange={(e) => setEditing((p) => ({ ...p!, prompt_text: e.target.value }))} rows={8} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}><X className="h-4 w-4 mr-1" /> Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(editing as never)}
              disabled={!editing?.flag_key?.trim() || !editing?.version || !editing?.prompt_text?.trim()}
            >
              Create version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
