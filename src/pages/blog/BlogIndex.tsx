import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Calendar, ArrowRight } from "lucide-react";

const posts = [
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

export default function BlogIndex() {
  return (
    <PublicPageLayout>
      <SEO
        title="Blog — Quality Improvement Resources for FQHCs"
        description="Guides, checklists, and best practices for FQHC quality directors. Learn about PDSA cycles, UDS measures, HRSA site visits, and healthcare quality improvement."
        canonical="https://measurewise.org/blog"
      />

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Quality Improvement Resources
              <br />
              <span className="text-primary">for FQHCs</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Practical guides, checklists, and best practices for health center quality directors, PCMH coordinators, and operations managers.
            </p>
          </div>

          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.slug} className="border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
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
        </div>
      </section>
    </PublicPageLayout>
  );
}
