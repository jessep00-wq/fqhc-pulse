import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BuyButton } from "@/components/store/BuyButton";
import { CheckCircle, FileText, ShieldCheck, Users } from "lucide-react";
import { formatPrice, type StoreProduct } from "@/types/store";

export default function StoreProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("store_products" as never)
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      setProduct((data as unknown as StoreProduct) ?? null);
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

  if (!product) {
    return (
      <PublicPageLayout backTo={{ label: "Back to store", href: "/store" }}>
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1 className="text-2xl font-bold mb-2">Product not found</h1>
          <Link to="/store" className="text-primary underline">Browse all templates</Link>
        </div>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout backTo={{ label: "Back to store", href: "/store" }}>
      <SEO
        title={`${product.name} — MeasureWise Store`}
        description={product.short_description ?? product.name}
        canonical={`https://measurewise.org/store/${product.slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.short_description,
          offers: {
            "@type": "Offer",
            price: (product.price_cents / 100).toFixed(2),
            priceCurrency: product.currency.toUpperCase(),
            availability: "https://schema.org/InStock",
          },
        }}
      />

      <article className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            <header className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-5xl">{product.hero_emoji ?? "📋"}</span>
                <Badge variant="secondary">{product.category}</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{product.name}</h1>
              <p className="text-lg text-muted-foreground">{product.short_description}</p>
            </header>

            {product.long_description && (
              <p className="text-base leading-relaxed">{product.long_description}</p>
            )}

            {product.bullets?.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-3">Why it works</h2>
                <ul className="space-y-2">
                  {product.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {product.whats_inside?.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-3">What's inside</h2>
                <Card>
                  <CardContent className="p-4">
                    <ul className="divide-y">
                      {product.whats_inside.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 py-2.5">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>
            )}

            {product.who_its_for?.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Who it's for
                </h2>
                <div className="flex flex-wrap gap-2">
                  {product.who_its_for.map((r) => (
                    <Badge key={r} variant="outline">{r}</Badge>
                  ))}
                </div>
              </section>
            )}

            {product.uds_framing && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm">{product.uds_framing}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Buy panel */}
          <aside className="lg:col-span-1">
            <Card className="lg:sticky lg:top-24">
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="text-3xl font-bold">{formatPrice(product.price_cents, product.currency)}</div>
                  <p className="text-sm text-muted-foreground">One-time purchase · instant download</p>
                </div>
                <BuyButton priceId={product.stripe_price_id} className="w-full" label={`Buy ${product.name}`} />
                <Separator />
                <ul className="text-sm space-y-1.5 text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Editable templates</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Free updates for 12 months</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Email delivery within 1 minute</li>
                </ul>
              </CardContent>
            </Card>
          </aside>
        </div>
      </article>
    </PublicPageLayout>
  );
}
