import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { QIReportBoardAction } from "@/types/qiReport";

interface Props {
  actions: QIReportBoardAction[];
  onAdd: (a: { kind: QIReportBoardAction["kind"]; title: string; detail: string; due_date: string | null }) => void;
  onRemove: (id: string) => void;
  readOnly?: boolean;
}

const KIND_LABEL: Record<QIReportBoardAction["kind"], string> = {
  action_required: "Action required",
  awareness: "Awareness",
  risk: "Risk",
  escalation: "Escalation",
};

export function BoardActionsTable({ actions, onAdd, onRemove, readOnly }: Props) {
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<QIReportBoardAction["kind"]>("awareness");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [dueDate, setDueDate] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ kind, title: title.trim(), detail: detail.trim(), due_date: dueDate || null });
    setKind("awareness");
    setTitle("");
    setDetail("");
    setDueDate("");
    setAdding(false);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Board actions & awareness</h3>
        {!readOnly && !adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add item
          </Button>
        )}
      </div>

      {adding && (
        <div className="mb-4 p-3 border rounded-lg bg-muted/30 space-y-2">
          <div className="flex gap-2">
            <Select value={kind} onValueChange={(v) => setKind(v as QIReportBoardAction["kind"])}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(KIND_LABEL) as QIReportBoardAction["kind"][]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {KIND_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-40" />
          </div>
          <Textarea placeholder="Detail" value={detail} onChange={(e) => setDetail(e.target.value)} rows={2} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit}>
              Add
            </Button>
          </div>
        </div>
      )}

      {actions.length === 0 ? (
        <div className="text-sm text-muted-foreground italic">No board items flagged this quarter.</div>
      ) : (
        <div className="space-y-2">
          {actions.map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border">
              <Badge variant="outline" className="shrink-0">
                {KIND_LABEL[a.kind]}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{a.title}</div>
                {a.detail && <div className="text-xs text-muted-foreground mt-1">{a.detail}</div>}
                {a.due_date && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Due {new Date(a.due_date).toLocaleDateString()}
                  </div>
                )}
              </div>
              {!readOnly && (
                <Button size="sm" variant="ghost" onClick={() => onRemove(a.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
