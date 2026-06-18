import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { SubscribeForm } from "@/components/newsletter/SubscribeForm";
import { NewsletterSectionRenderer } from "@/components/newsletter/NewsletterSectionRenderer";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowLeft, Share2, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentIcon } from "@/components/ContentIcon";
import { toast } from "sonner";
import type { Newsletter, NewsletterSection } from "@/types/newsletter";
import { Logo } from "@/components/Logo";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function NewsletterDetail() {
  // Route is /newsletter/:slug — `slug` param doubles as a legacy UUID fallback.
  const { slug } = useParams<{ slug: string }>();

  const { data: newsletter, isLoading } = useQuery({
    queryKey: ["newsletter-detail", slug],
    queryFn: async () => {
      const column = slug && UUID_RE.test(slug) ? "id" : "slug";
      const { data, error } = await supabase
        .from("newsletters")
        .select("*")
        .eq(column, slug!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        sections: (data.sections as unknown as NewsletterSection[]) || [],
      } as Newsletter;
    },
    enabled: !!slug,
  });

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  if (isLoading) {
    return (
      <PublicPageLayout>
        <div className="max-w-[680px] mx-auto px-6 py-16 space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PublicPageLayout>
    );
  }

  if (!newsletter) {
    return (
      <PublicPageLayout>
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h1 className="text-2xl font-bold mb-2">Newsletter not found</h1>
          <p className="text-muted-foreground mb-6">This issue may have been removed or isn't published yet.</p>
          <Link to="/newsletter"><Button variant="outline">← Back to Archive</Button></Link>
        </div>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout>
      <SEO
        title={`${newsletter.title} — MeasureWise Newsletter`}
        description={newsletter.hero_summary || newsletter.subtitle || "FQHC Quality Newsletter"}
        canonical={`https://measurewise.org/newsletter/${newsletter.slug}`}
        type="article"
      />

      <article className="max-w-[680px] mx-auto my-8 bg-card shadow-lg rounded-lg overflow-hidden border">
        {/* Header */}
        <div className="relative bg-sidebar px-8 sm:px-12 pt-9 pb-7 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-primary/10 blur-sm" />
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-primary/60 to-transparent" />
          <div className="flex items-center gap-3 mb-6">
            <Logo size="md" />
          </div>
          <div className="text-[11px] font-medium tracking-[2px] uppercase text-primary mb-2.5">
            FQHC Quality Newsletter &nbsp;·&nbsp; {newsletter.published_at ? new Date(newsletter.published_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Draft"}
          </div>
          <h1 className="font-serif text-3xl sm:text-[34px] leading-tight text-sidebar-foreground">{newsletter.title}</h1>
        </div>

        {/* Hero band */}
        {newsletter.hero_summary && (
          <div className="bg-primary px-8 sm:px-12 py-5 flex items-center gap-4">
            <ContentIcon imageUrl={newsletter.hero_image_url} emoji={newsletter.hero_emoji} size={32} className="bg-primary-foreground/10" />
            <p className="text-[15px] font-medium text-primary-foreground leading-snug" dangerouslySetInnerHTML={{ __html: String(newsletter.hero_summary ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
          </div>
        )}

        {/* Body */}
        <div className="px-8 sm:px-12 py-10">
          {newsletter.sections.map((section, i) => (
            <NewsletterSectionRenderer key={i} section={section} />
          ))}
        </div>

        {/* CTA */}
        <div className="relative bg-sidebar px-8 sm:px-12 py-11 text-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-primary/60 to-transparent" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-primary/10 blur-sm" />
          <div className="text-[10px] tracking-[3px] font-bold uppercase text-primary mb-3">MeasureWise · Quality Operations for FQHCs</div>
          <h2 className="font-serif text-2xl text-sidebar-foreground mb-3">Start building audit-ready QI documentation.</h2>
          <p className="text-sm text-sidebar-foreground/70 mb-7 max-w-md mx-auto">
            MeasureWise helps FQHC quality teams organize PDSA cycles, document measure-driven improvement work, and assign clear ownership — all year long.
          </p>
          <Button asChild><Link to="/auth?signup=true">Start 14-day free trial</Link></Button>
        </div>

        {/* Footer */}
        <div className="bg-muted border-t px-8 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            <strong>MeasureWise™</strong> · Quality Operations for FQHCs<br />
            Better Improvement. Better Care. Stronger Communities.
          </p>
        </div>
      </article>

      {/* Share + subscribe */}
      <div className="max-w-[680px] mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mt-6">
          <Link to="/newsletter" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> All Issues
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5"><Share2 className="h-3.5 w-3.5" /> Share</Button>
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-3">Get the next issue in your inbox</p>
          <SubscribeForm className="mx-auto justify-center" />
        </div>
      </div>
    </PublicPageLayout>
  );
}
