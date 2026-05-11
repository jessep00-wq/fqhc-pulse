import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Package } from "lucide-react";
import { formatPrice, type StoreBundle, type StoreProduct } from "@/types/store";

interface BundleCardProps {
  bundle: StoreBundle;
  includedProducts: StoreProduct[];
}

export function BundleCard({ bundle, includedProducts }: BundleCardProps) {
  const fullPrice = includedProducts.reduce((sum, p) => sum + p.price_cents, 0);
  const savings = fullPrice - bundle.price_cents;

  return (
    <Link
      to={`/store/bundle/${bundle.slug}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
    >
      <Card className="h-full border-primary/30 bg-gradient-to-br from-primary/5 to-transparent transition-shadow hover:shadow-md">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <div className="text-4xl">{bundle.hero_emoji ?? "🎁"}</div>
            {savings > 0 && (
              <Badge className="bg-primary text-primary-foreground">
                Save {formatPrice(savings, bundle.currency)}
              </Badge>
            )}
          </div>
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
            {bundle.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{bundle.short_description}</p>
          <div className="space-y-1.5 mb-4">
            {includedProducts.map((p) => (
              <div key={p.id} className="flex items-center text-sm">
                <Package className="h-3.5 w-3.5 mr-2 text-primary" />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
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
