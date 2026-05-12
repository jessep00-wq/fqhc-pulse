import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { SEO } from "@/components/SEO";
import { Calendar, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentIcon } from "@/components/ContentIcon";

export default function BlogPostDynamic() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug!)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <PublicPageLayout backTo={{ label: "All posts", href: "/blog" }}>
        <article className="max-w-3xl mx-auto px-6 py-12 space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </article>
      </PublicPageLayout>
    );
  }

  if (error || !post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <PublicPageLayout backTo={{ label: "All posts", href: "/blog" }}>
      <SEO
        title={post.title}
        description={post.excerpt || post.title}
        canonical={`https://measurewise.org/blog/${post.slug}`}
        type="article"
        article={{
          publishedTime: post.published_at || undefined,
          author: post.author_name,
        }}
      />
      <article className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-10 space-y-4">
          {(post.cover_image_url || post.cover_emoji) && (
            <ContentIcon imageUrl={post.cover_image_url} emoji={post.cover_emoji} size={64} />
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {post.published_at && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.published_at}>
                  {new Date(post.published_at).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </time>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.read_time_minutes} min read
            </span>
            <span>By {post.author_name}</span>
          </div>
          {post.excerpt && (
            <p className="text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
          )}
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-primary prose-strong:text-foreground prose-li:text-foreground/90">
          <ReactMarkdown>{post.content_md}</ReactMarkdown>
        </div>
      </article>
    </PublicPageLayout>
  );
}
