import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { SEO } from "@/components/SEO";
import { ProductCard } from "@/components/store/ProductCard";
import { BundleCard } from "@/components/store/BundleCard";
import { FounderCredibilityCard } from "@/components/store/FounderCredibilityCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, ShieldCheck, TrendingUp, Clock } from "lucide-react";
import {
  STORE_CATEGORIES,
  type StoreBundle,
  type StoreProduct,
  type StoreCategory,
} from "@/types/store";

export default function StoreIndex() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [bundles, setBundles] = useState<StoreBundle[]>([]);
  const [filter, setFilter] = useState<StoreCategory | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: b }] = await Promise.all([
        supabase
          .from("store_products" as never)
          .select("*")
          .eq("status", "published")
          .order("sort_order"),
        supabase
          .from("store_bundles" as never)
          .select("*")
          .eq("status", "published")
          .order("sort_order"),
      ]);
      setProducts((p as unknown as StoreProduct[]) ?? []);
      setBundles((b as unknown as StoreBundle[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filteredProducts = useMemo(
    () => (filter === "all" ? products : products.filter((p) => p.category === filter)),
    [products, filter],
  );

  const productById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products],
  );

  return (
    <PublicPageLayout>
      <SEO
        title="Store — Templates for FQHC Quality Teams"
        description="Implementation-ready UDS, PDSA, QI committee, and board reporting templates for Federally Qualified Health Centers. Instant download, HRSA-aligned."
        canonical="https://measurewise.org/store"
      />

      {/* Hero */}
      <section className="py-16 px-6 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <Badge variant="secondary">MeasureWise Store</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Templates that move UDS measures and survive HRSA audits.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built by an FQHC quality leader and used by quality directors at health centers across
            the country — not generic forms. Every template is designed to move a measure, defend an
            OSV, or run a real QI committee.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground pt-2">
            <span className="inline-flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-primary" /> Move a UDS measure</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Defend an HRSA OSV</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> Run a QI committee in 30 min</span>
          </div>
        </div>
      </section>

      {/* Founder credibility band */}
      <section className="px-6 -mt-6">
        <div className="max-w-4xl mx-auto">
          <FounderCredibilityCard />
        </div>
      </section>

      {/* Bundles */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-2xl font-bold">Save with a bundle</h2>
            <span className="text-sm text-muted-foreground">Curated for governance + improvement</span>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {bundles.map((bundle) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                includedProducts={bundle.included_product_ids
                  .map((id) => productById[id])
                  .filter(Boolean) as StoreProduct[]}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="py-12 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-2xl font-bold">All templates</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              {STORE_CATEGORIES.map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={filter === c ? "default" : "outline"}
                  onClick={() => setFilter(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
          {loading ? (
            <p className="text-muted-foreground text-center py-12">Loading templates…</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust band */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: ShieldCheck, title: "HRSA-aligned", body: "Built around UDS Tables 6B & 7" },
            { icon: Download, title: "No subscriptions", body: "Buy once, use across reporting cycles" },
            { icon: CheckCircle, title: "Audit-defensible", body: "Designed for OSV documentation" },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="p-4">
              <Icon className="h-7 w-7 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicPageLayout>
  );
}
