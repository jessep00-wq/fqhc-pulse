import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BuyButton } from "@/components/store/BuyButton";
import { PreviewGallery } from "@/components/store/PreviewGallery";
import { FounderCredibilityCard } from "@/components/store/FounderCredibilityCard";
import { CheckCircle, Package, Sparkles } from "lucide-react";
import { formatPrice, type StoreBundle, type StoreProduct } from "@/types/store";

export default function StoreBundleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [bundle, setBundle] = useState<StoreBundle | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: b } = await supabase
        .from("store_bundles" as never)
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      const bundleRow = b as unknown as StoreBundle | null;
      setBundle(bundleRow);
      if (bundleRow?.included_product_ids?.length) {
        const { data: p } = await supabase
          .from("store_products" as never)
          .select("*")
          .in("id", bundleRow.included_product_ids);
        setProducts((p as unknown as StoreProduct[]) ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <PublicPageLayout backTo={{ label: "Back to store", href: "/store" }}>
        <div className="max-w-4xl mx-auto px-6 py-16 text-muted-foreground">Loading…</div>
      </PublicPageLayout>
    );
  }
  if (!bundle) {
    return (
      <PublicPageLayout backTo={{ label: "Back to store", href: "/store" }}>
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1 className="text-2xl font-bold mb-2">Bundle not found</h1>
          <Link to="/store" className="text-primary underline">Browse all templates</Link>
        </div>
      </PublicPageLayout>
    );
  }

  const fullPrice = products.reduce((sum, p) => sum + p.price_cents, 0);
  const savings = fullPrice - bundle.price_cents;

  return (
    <PublicPageLayout backTo={{ label: "Back to store", href: "/store" }}>
      <SEO
        title={`${bundle.name} — MeasureWise Store`}
        description={bundle.short_description ?? bundle.name}
        canonical={`https://measurewise.org/store/bundle/${bundle.slug}`}
      />

      <article className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <header className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-5xl">{bundle.hero_emoji ?? "🎁"}</span>
                <Badge>Bundle</Badge>
                {savings > 0 && (
                  <Badge variant="secondary">Save {formatPrice(savings, bundle.currency)}</Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{bundle.name}</h1>
              <p className="text-lg text-muted-foreground">{bundle.short_description}</p>
            </header>

            {bundle.long_description && (
              <p className="text-base leading-relaxed">{bundle.long_description}</p>
            )}

            <section>
              <h2 className="text-xl font-semibold mb-3">What's included</h2>
              <div className="space-y-3">
                {products.map((p) => (
                  <Link key={p.id} to={`/store/${p.slug}`} className="block group">
                    <Card className="transition-shadow group-hover:shadow-md">
                      <CardContent className="p-4 flex items-start gap-3">
                        <span className="text-3xl">{p.hero_emoji ?? "📋"}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-semibold group-hover:text-primary transition-colors">{p.name}</h3>
                            <span className="text-sm text-muted-foreground shrink-0">
                              {formatPrice(p.price_cents, p.currency)} value
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{p.short_description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-1">
            <Card className="lg:sticky lg:top-24 border-primary/30">
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold">{formatPrice(bundle.price_cents, bundle.currency)}</div>
                    {savings > 0 && (
                      <div className="text-sm text-muted-foreground line-through">
                        {formatPrice(fullPrice, bundle.currency)}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">One-time purchase · all files delivered together</p>
                </div>
                <BuyButton priceId={bundle.stripe_price_id} className="w-full" label={`Buy ${bundle.name}`} />
                <Separator />
                <ul className="text-sm space-y-1.5 text-muted-foreground">
                  <li className="flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> {products.length} templates included</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Email delivery within 1 minute</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Free updates for 12 months</li>
                </ul>
              </CardContent>
            </Card>
          </aside>
        </div>
      </article>
    </PublicPageLayout>
  );
}
