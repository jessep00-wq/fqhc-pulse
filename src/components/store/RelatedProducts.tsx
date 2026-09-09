import { Link } from "@/lib/router-compat";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { formatPrice, type StoreProduct } from "@/types/store";
import { ProductHero } from "./ProductHero";

/**
 * Picks up to `limit` purchasable products related to the current one:
 * same category first, then anything else. Coming-soon items are excluded.
 */
export function pickRelatedProducts(
  all: StoreProduct[],
  current: StoreProduct,
  limit = 3,
): StoreProduct[] {
  const candidates = all.filter(
    (p) => p.id !== current.id && !p.is_coming_soon && (p.file_count ?? 0) > 0,
  );
  const sameCategory = candidates.filter((p) => p.category === current.category);
  const others = candidates.filter((p) => p.category !== current.category);
  return [...sameCategory, ...others].slice(0, limit);
}

export function RelatedProducts({ products }: { products: StoreProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="py-12 px-6 bg-muted/30 border-t">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">You might also need</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              to={`/store/${p.slug}`}
              className="group block rounded-lg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-5 flex flex-col h-full gap-3">
                  <ProductHero
                    imageUrl={p.hero_image_url}
                    icon={p.hero_icon}
                    size="md"
                    alt={p.name}
                  />
                  <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {p.short_description}
                  </p>
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="font-bold">{formatPrice(p.price_cents, p.currency)}</span>
                    <span className="inline-flex items-center text-sm text-primary font-medium">
                      View <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
