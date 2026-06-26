import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ContentDraft } from "@/hooks/useContentOps";

const VARIANT: Record<string, { className: string; label: string }> = {
  generating: { className: "bg-muted text-muted-foreground", label: "Generating" },
  pending_review: { className: "bg-primary/15 text-primary", label: "Pending Review" },
  approved: { className: "bg-emerald-100 text-emerald-900", label: "Approved" },
  published: { className: "bg-emerald-600 text-white", label: "Published" },
  rejected: { className: "bg-muted text-muted-foreground line-through", label: "Rejected" },
  failed: { className: "bg-destructive/15 text-destructive", label: "Failed" },
};

export function ReviewQueue({ drafts, onOpen }: { drafts: ContentDraft[]; onOpen: (id: string) => void }) {
  const groups = {
    pending: drafts.filter((d) => d.status === "pending_review" || d.status === "generating"),
    approved: drafts.filter((d) => d.status === "approved"),
    published: drafts.filter((d) => d.status === "published"),
    rejected: drafts.filter((d) => d.status === "rejected" || d.status === "failed"),
  };

  return (
    <Tabs defaultValue="pending">
      <TabsList>
        <TabsTrigger value="pending">Pending ({groups.pending.length})</TabsTrigger>
        <TabsTrigger value="approved">Approved ({groups.approved.length})</TabsTrigger>
        <TabsTrigger value="published">Published ({groups.published.length})</TabsTrigger>
        <TabsTrigger value="rejected">Rejected / Failed ({groups.rejected.length})</TabsTrigger>
      </TabsList>
      {(Object.keys(groups) as (keyof typeof groups)[]).map((g) => (
        <TabsContent key={g} value={g} className="mt-3">
          <DraftList items={groups[g]} onOpen={onOpen} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function DraftList({ items, onOpen }: { items: ContentDraft[]; onOpen: (id: string) => void }) {
  if (items.length === 0) {
    return (
      <Card><CardContent className="py-10 text-sm text-muted-foreground text-center">Nothing here yet.</CardContent></Card>
    );
  }
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Generated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((d) => {
              const v = VARIANT[d.status] || VARIANT.pending_review;
              return (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="font-medium">{d.blog_title || d.topic || "Untitled"}</div>
                    {d.blog_excerpt && <div className="text-xs text-muted-foreground line-clamp-1">{d.blog_excerpt}</div>}
                  </TableCell>
                  <TableCell><Badge className={v.className} variant="secondary">{v.label}</Badge></TableCell>
                  <TableCell className="text-xs">{d.triggered_by}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(d.generated_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => onOpen(d.id)}>Open</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
