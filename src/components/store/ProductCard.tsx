import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { formatPrice, type StoreProduct } from "@/types/store";

export function ProductCard({ product }: { product: StoreProduct }) {
  return (
    <Link
      to={`/store/${product.slug}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
    >
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <div className="text-4xl">{product.hero_emoji ?? "📋"}</div>
            <Badge variant="secondary">{product.category}</Badge>
          </div>
          <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
            {product.short_description}
          </p>
          <div className="flex items-center justify-between mt-auto pt-3 border-t">
            <span className="text-xl font-bold">{formatPrice(product.price_cents, product.currency)}</span>
            <span className="inline-flex items-center text-sm text-primary font-medium">
              View <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
