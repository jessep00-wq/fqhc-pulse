import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IconUploader } from "@/components/admin/IconUploader";
import { ContentIcon } from "@/components/ContentIcon";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_emoji: string | null;
  cover_image_url: string | null;
  content_md: string;
  read_time_minutes: number;
  author_name: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const empty = {
  slug: "",
  title: "",
  excerpt: "",
  cover_emoji: "📋",
  cover_image_url: null as string | null,
  content_md: "",
  read_time_minutes: 5,
  author_name: "Jessica Smith, RN, BSN",
  status: "draft" as "draft" | "published",
};

export default function AdminBlog() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [slugTouched, setSlugTouched] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  function openNew() {
    setEditing(null);
    setForm({ ...empty });
    setSlugTouched(false);
    setOpen(true);
  }

  function openEdit(p: BlogPost) {
    setEditing(p);
    setForm({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt || "",
      cover_emoji: p.cover_emoji || "📋",
      cover_image_url: p.cover_image_url ?? null,
      content_md: p.content_md,
      read_time_minutes: p.read_time_minutes,
      author_name: p.author_name,
      status: p.status as "draft" | "published",
    });
    setSlugTouched(true);
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Title required");
      const slug = form.slug || slugify(form.title);
      const payload = {
        slug,
        title: form.title,
        excerpt: form.excerpt || null,
        cover_emoji: form.cover_emoji,
        cover_image_url: form.cover_image_url,
        content_md: form.content_md,
        read_time_minutes: form.read_time_minutes,
        author_name: form.author_name,
        status: form.status,
        published_at:
          form.status === "published"
            ? editing?.published_at || new Date().toISOString()
            : editing?.published_at || null,
      };
      if (editing) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Post updated" : "Post created");
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      qc.invalidateQueries({ queryKey: ["public-blog-posts"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publish = useMutation({
    mutationFn: async (p: BlogPost) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          status: "published",
          published_at: p.published_at || new Date().toISOString(),
        })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Published");
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      qc.invalidateQueries({ queryKey: ["public-blog-posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      qc.invalidateQueries({ queryKey: ["public-blog-posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-sm text-muted-foreground">Author and publish monthly blog posts.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" /> New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Post" : "New Post"}</DialogTitle>
              <DialogDescription className="sr-only">Author or edit a blog post with title, slug, body, and SEO metadata.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      title: e.target.value,
                      slug: slugTouched ? f.slug : slugify(e.target.value),
                    }));
                  }}
                  placeholder="How to Run Effective PDSA Cycles"
                />
              </div>
              <IconUploader
                folder="blog"
                label="Cover icon"
                value={form.cover_image_url}
                emojiFallback={form.cover_emoji}
                onEmojiChange={(v) => setForm((f) => ({ ...f, cover_emoji: v }))}
                onChange={(url) => setForm((f) => ({ ...f, cover_image_url: url }))}
              />
              <div>
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
                  }}
                  placeholder="auto-generated-from-title"
                />
              </div>
              <div>
                <Label>Excerpt</Label>
                <Textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  rows={2}
                  placeholder="Short summary shown on the blog index."
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Read time (min)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.read_time_minutes}
                    onChange={(e) => setForm((f) => ({ ...f, read_time_minutes: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label>Author</Label>
                  <Input
                    value={form.author_name}
                    onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as "draft" | "published" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Body (Markdown)</Label>
                <Tabs defaultValue="write">
                  <TabsList>
                    <TabsTrigger value="write">Write</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="write">
                    <Textarea
                      value={form.content_md}
                      onChange={(e) => setForm((f) => ({ ...f, content_md: e.target.value }))}
                      rows={18}
                      className="font-mono text-sm"
                      placeholder={"## Heading\n\nWrite your post in markdown.\n\n- Bullet\n- Another bullet"}
                    />
                  </TabsContent>
                  <TabsContent value="preview">
                    <div className="border rounded-md p-6 min-h-[300px] bg-background">
                      <article className="max-w-3xl mx-auto">
                        <header className="mb-8 space-y-3">
                          {(form.cover_image_url || form.cover_emoji) && (
                            <ContentIcon imageUrl={form.cover_image_url} emoji={form.cover_emoji} size={56} />
                          )}
                          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                            {form.title || "Untitled post"}
                          </h1>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                            <span>·</span>
                            <span>{form.read_time_minutes} min read</span>
                            <span>·</span>
                            <span>By {form.author_name}</span>
                          </div>
                          {form.excerpt && (
                            <p className="text-base text-muted-foreground leading-relaxed">{form.excerpt}</p>
                          )}
                        </header>
                        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-primary prose-strong:text-foreground prose-li:text-foreground/90">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {form.content_md || "_Nothing to preview yet._"}
                          </ReactMarkdown>
                        </div>
                      </article>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Posts</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No posts yet. Click "New Post" to write your first.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium flex items-center gap-2">
                        <ContentIcon imageUrl={p.cover_image_url} emoji={p.cover_emoji} size={24} />
                        <span>{p.title}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">/{p.slug}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "published" ? "default" : "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.published_at ? new Date(p.published_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {p.status === "published" && (
                        <Button variant="ghost" size="icon" asChild title="View">
                          <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {p.status !== "published" && (
                        <Button variant="ghost" size="icon" onClick={() => publish.mutate(p)} title="Publish">
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Delete">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{p.title}" will be permanently removed. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove.mutate(p.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
