import { Link } from "@/lib/router-compat";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Package, Sparkles, Users } from "lucide-react";
import { formatPrice, type StoreBundle, type StoreProduct } from "@/types/store";
import { ProductHero } from "./ProductHero";

interface BundleCardProps {
  bundle: StoreBundle;
  includedProducts: StoreProduct[];
}

export function BundleCard({ bundle, includedProducts }: BundleCardProps) {
  const fullPrice = includedProducts.reduce((sum, p) => sum + p.price_cents, 0);
  const savings = fullPrice - bundle.price_cents;

  const audience = Array.from(
    new Set(includedProducts.flatMap((p) => p.who_its_for ?? [])),
  ).slice(0, 3).join(" · ");

  return (
    <Link
      to={`/store/bundle/${bundle.slug}`}
      className="group block focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
    >
      <Card className="h-full border-primary/30 bg-gradient-to-br from-primary/5 to-transparent transition-shadow hover:shadow-md">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <ProductHero
              imageUrl={bundle.hero_image_url}
              icon={bundle.hero_icon}
              fallbackIcon="Package"
              size="md"
              alt={bundle.name}
            />
            {savings > 0 && (
              <Badge className="bg-primary text-primary-foreground">
                Save {formatPrice(savings, bundle.currency)}
              </Badge>
            )}
          </div>
          <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">
            {bundle.name}
          </h3>
          {bundle.buyer_guidance && (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              {bundle.buyer_guidance}
            </div>
          )}
          <p className="text-sm text-muted-foreground mb-4">{bundle.short_description}</p>

          <div className="space-y-1.5 mb-4">
            {includedProducts.map((p) => (
              <div key={p.id} className="flex items-center text-sm">
                <Package className="h-3.5 w-3.5 mr-2 text-primary" />
                <span>{p.name}</span>
              </div>
            ))}
          </div>

          {audience && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Users className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate"><span className="font-medium text-foreground/80">For:</span> {audience}</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-auto pt-3 border-t">
            <div>
              <span className="text-xl font-bold">{formatPrice(bundle.price_cents, bundle.currency)}</span>
              {savings > 0 && (
                <span className="text-sm text-muted-foreground line-through ml-2">
                  {formatPrice(fullPrice, bundle.currency)}
                </span>
              )}
            </div>
            <span className="inline-flex items-center text-sm text-primary font-medium">
              View bundle <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
