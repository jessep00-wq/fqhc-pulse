import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FileText } from "lucide-react";
import { NO_SUPPORT_STATEMENT } from "@/lib/ai/labels";

export interface SourceReference {
  title?: string;
  source_type?: string;
  version?: string;
  effective_date?: string;
  section?: string;
  source_id?: string;
  retrieved_at?: string;
}

/**
 * "View sources" control. Only real, stored source records are ever shown —
 * when nothing supports a statement, the sheet says so rather than guessing.
 */
export function SourcesSheet({ sources }: { sources: SourceReference[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => setOpen(true)}
      >
        <FileText className="mr-1 h-3.5 w-3.5" />
        View sources
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Sources</SheetTitle>
            <SheetDescription>
              Every source MeasureWise used for this statement.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {sources.length === 0 ? (
              <p className="text-sm text-muted-foreground">{NO_SUPPORT_STATEMENT}</p>
            ) : (
              sources.map((s, i) => (
                <div key={s.source_id ?? i} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{s.title ?? "Untitled source"}</p>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {s.source_type && (
                      <>
                        <dt>Type</dt>
                        <dd>{s.source_type}</dd>
                      </>
                    )}
                    {s.version && (
                      <>
                        <dt>Version</dt>
                        <dd>{s.version}</dd>
                      </>
                    )}
                    {s.effective_date && (
                      <>
                        <dt>Effective</dt>
                        <dd>{s.effective_date}</dd>
                      </>
                    )}
                    {s.section && (
                      <>
                        <dt>Section</dt>
                        <dd>{s.section}</dd>
                      </>
                    )}
                    {s.source_id && (
                      <>
                        <dt>Source ID</dt>
                        <dd className="font-mono">{s.source_id}</dd>
                      </>
                    )}
                    {s.retrieved_at && (
                      <>
                        <dt>Retrieved</dt>
                        <dd>{new Date(s.retrieved_at).toLocaleString()}</dd>
                      </>
                    )}
                  </dl>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
