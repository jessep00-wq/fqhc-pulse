import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { SubscribeForm } from "@/components/newsletter/SubscribeForm";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowRight } from "lucide-react";
import type { Newsletter } from "@/types/newsletter";

export default function NewsletterIndex() {
  const { data: newsletters, isLoading } = useQuery({
    queryKey: ["newsletters-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletters")
        .select("id, title, subtitle, hero_emoji, published_at, created_at")
        .eq("status", "published")
        .not("published_at", "is", null)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as Pick<Newsletter, "id" | "title" | "subtitle" | "hero_emoji" | "published_at" | "created_at">[];
    },
  });

  return (
    <PublicPageLayout>
      <SEO title="Newsletter — MeasureWise" description="Weekly quality improvement insights for FQHC teams. Subscribe to get actionable PDSA, UDS, and compliance strategies." />
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">FQHC Quality Newsletter</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Weekly insights on PDSA cycles, UDS measures, and compliance — written for Quality Directors who link clinical improvement to funding outcomes.
          </p>
          <SubscribeForm className="mx-auto justify-center" />
        </div>

        {/* Issues list */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-6">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : newsletters && newsletters.length > 0 ? (
            newsletters.map((nl) => (
              <Link
                key={nl.id}
                to={`/newsletter/${nl.id}`}
                className="block rounded-lg border bg-card p-6 hover:border-primary/50 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{nl.hero_emoji || "📋"}</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">{nl.title}</h2>
                    {nl.subtitle && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{nl.subtitle}</p>}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {nl.published_at ? new Date(nl.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Draft"}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium mb-1">No issues yet</p>
              <p className="text-sm">Subscribe to be notified when the first issue drops.</p>
            </div>
          )}
        </div>

        {/* Bottom subscribe */}
        {newsletters && newsletters.length > 0 && (
          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground mb-3">Never miss an issue</p>
            <SubscribeForm className="mx-auto justify-center" />
          </div>
        )}
      </div>
    </PublicPageLayout>
  );
}
