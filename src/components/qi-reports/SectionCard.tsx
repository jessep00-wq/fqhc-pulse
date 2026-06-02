import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, RotateCw } from "lucide-react";
import { useState } from "react";

interface Props {
  title: string;
  hrsaAnchor: string;
  helper: string;
  value: string;
  onChange: (v: string) => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
  aiGenerated?: boolean;
  readOnly?: boolean;
}

export function SectionCard({
  title,
  hrsaAnchor,
  helper,
  value,
  onChange,
  onRegenerate,
  regenerating,
  aiGenerated,
  readOnly,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base">{title}</h3>
            {aiGenerated && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                <Sparkles className="h-3 w-3 mr-1" />
                AI draft
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{hrsaAnchor}</div>
        </div>
        <div className="flex gap-2 shrink-0">
          {onRegenerate && !readOnly && (
            <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={regenerating}>
              <RotateCw className={`h-3.5 w-3.5 mr-1.5 ${regenerating ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </div>
      {expanded && (
        <>
          <p className="text-xs text-muted-foreground italic mb-2">{helper}</p>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            readOnly={readOnly}
            placeholder={readOnly ? "—" : "Draft narrative here, or click Regenerate to use AI."}
          />
        </>
      )}
    </Card>
  );
}
