import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, FileText, Sparkles } from "lucide-react";
import { formatPrice, type StoreProduct } from "@/types/store";

export function ProductCard({ product }: { product: StoreProduct }) {
  const audience = (product.who_its_for ?? []).slice(0, 2).join(" · ");
  const fileCount = product.file_count ?? 0;
  const firstDeliverable = product.whats_inside?.[0];

  return (
    <Link
      to={`/store/${product.slug}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
    >
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <div className="text-4xl">{product.hero_emoji ?? "📋"}</div>
            <div className="flex flex-col items-end gap-1.5">
              {product.is_coming_soon && (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">
                  Coming soon
                </Badge>
              )}
              <Badge variant="secondary">{product.category}</Badge>
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {product.buyer_guidance && (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              {product.buyer_guidance}
            </div>
          )}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {product.short_description}
          </p>

          <div className="space-y-1.5 text-xs text-muted-foreground mb-4 flex-1">
            {audience && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate"><span className="font-medium text-foreground/80">For:</span> {audience}</span>
              </div>
            )}
            {firstDeliverable && (
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">
                  <span className="font-medium text-foreground/80">Get:</span>{" "}
                  {fileCount > 0 ? `${fileCount} files · ` : ""}
                  {firstDeliverable}
                </span>
              </div>
            )}
          </div>

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
