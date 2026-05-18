import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

export function CartButton() {
  const { items, open } = useCartStore();
  const count = items.length;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={open}
      aria-label={`Cart (${count} ${count === 1 ? "item" : "items"})`}
      className="relative"
    >
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] leading-none font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
          {count}
        </span>
      )}
    </Button>
  );
}
