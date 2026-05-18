import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Calendar, ArrowRight, Search, X } from "lucide-react";
import { ContentIcon } from "@/components/ContentIcon";
import { PlaybookSidebarCard } from "@/components/lead-magnets/PlaybookSidebarCard";

type ListPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  cover_emoji?: string | null;
  cover_image_url?: string | null;
};

const legacyPosts: ListPost[] = [
  {
    slug: "pdsa-cycle-fqhc-guide",
    title: "How to Run Effective PDSA Cycles at Your FQHC",
    excerpt: "A step-by-step guide to Plan-Do-Study-Act cycles for Federally Qualified Health Centers — from aim statements to data collection to scaling successful interventions.",
    date: "2026-04-15",
    readTime: "8 min read",
  },
  {
    slug: "uds-clinical-quality-measures-2026",
    title: "UDS Clinical Quality Measures in 2026: What's Changed",
    excerpt: "A comprehensive overview of the 2026 UDS reporting requirements, updated measures, and what FQHC quality teams need to know for this year's submission.",
    date: "2026-03-28",
    readTime: "10 min read",
  },
  {
    slug: "hrsa-site-visit-checklist",
    title: "HRSA Site Visit Checklist: What QI Directors Need to Prepare",
    excerpt: "Everything your quality improvement team needs to have ready before an HRSA Operational Site Visit — organized by compliance chapter with downloadable templates.",
    date: "2026-03-10",
    readTime: "12 min read",
  },
  {
    slug: "quality-improvement-fqhc-staff",
    title: "Building a Quality Improvement Culture at Your FQHC",
    excerpt: "How to engage clinical and administrative staff in quality improvement work — from making QI part of daily huddles to celebrating measure improvements.",
    date: "2026-02-20",
    readTime: "9 min read",
  },
];

// TODO: switch to a Postgres FTS RPC when posts > 200
function useDebounced<T>(value: T, ms = 150): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function BlogIndex() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debouncedQuery = useDebounced(query, 150);

  // Sync URL ?q= with debounced query
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedQuery) next.set("q", debouncedQuery);
    else next.delete("q");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const { data: dbPosts = [] } = useQuery({
    queryKey: ["public-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, cover_emoji, cover_image_url, published_at, read_time_minutes")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data || []).map<ListPost>((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt || "",
        date: p.published_at || new Date().toISOString(),
        readTime: `${p.read_time_minutes} min read`,
        cover_emoji: p.cover_emoji,
        cover_image_url: p.cover_image_url,
      }));
    },
  });

  const allPosts = useMemo(() => {
    const seen = new Set(dbPosts.map((p) => p.slug));
    return [...dbPosts, ...legacyPosts.filter((p) => !seen.has(p.slug))]
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [dbPosts]);

  const posts = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return allPosts;
    const tokens = q.split(/\s+/).filter(Boolean);
    return allPosts.filter((p) => {
      const haystack = `${p.title} ${p.excerpt}`.toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  }, [allPosts, debouncedQuery]);

  const clearSearch = () => setQuery("");

  return (
    <PublicPageLayout>
      <SEO
        title="Blog — Quality Improvement Resources for FQHCs"
        description="Guides, checklists, and best practices for FQHC quality directors. Learn about PDSA cycles, UDS measures, HRSA site visits, and healthcare quality improvement."
        canonical="https://measurewise.org/blog"
      />

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_320px] gap-10 items-start">
          <div className="max-w-3xl w-full mx-auto lg:mx-0">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Quality Improvement Resources
              <br />
              <span className="text-primary">for FQHCs</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Practical guides, checklists, and best practices for health center quality directors, PCMH coordinators, and operations managers.
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles by topic, measure, or keyword…"
                className="pl-10 pr-10 h-11"
                aria-label="Search blog articles"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {debouncedQuery && (
              <p className="text-center text-sm text-muted-foreground mt-3">
                {posts.length} {posts.length === 1 ? "article" : "articles"} matching "{debouncedQuery}"
              </p>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <p className="text-muted-foreground">
                No articles match "{debouncedQuery}".
              </p>
              <Button variant="outline" onClick={clearSearch}>
                Clear search
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.slug} className="border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                      {(post.cover_image_url || post.cover_emoji) && (
                        <ContentIcon imageUrl={post.cover_image_url} emoji={post.cover_emoji} size={20} />
                      )}
                      <Calendar className="h-4 w-4" />
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </time>
                      <span>·</span>
                      <span>{post.readTime}</span>
                    </div>
                    <Link to={`/blog/${post.slug}`} className="group">
                      <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                        {post.title}
                      </h2>
                    </Link>
                    <p className="text-muted-foreground leading-relaxed mb-4">{post.excerpt}</p>
                    <Link to={`/blog/${post.slug}`} className="inline-flex items-center text-primary font-medium hover:underline">
                      Read more <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          </div>
          <PlaybookSidebarCard />
        </div>
      </section>
    </PublicPageLayout>
  );
}
