import { Button } from "@/components/ui/button";
import { ShoppingBag, Check } from "lucide-react";
import { useCartStore, type CartItem } from "@/stores/cartStore";

interface Props {
  item: CartItem;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "secondary" | "outline";
  className?: string;
  disabled?: boolean;
}

export function AddToCartButton({ item, size = "lg", variant = "outline", className, disabled }: Props) {
  const { items, add } = useCartStore();
  const inCart = items.some((i) => i.lookupKey === item.lookupKey);

  return (
    <Button
      onClick={() => add(item)}
      size={size}
      variant={variant}
      className={className}
      disabled={disabled || inCart}
    >
      {inCart ? (
        <>
          <Check className="h-4 w-4 mr-2" /> In cart
        </>
      ) : (
        <>
          <ShoppingBag className="h-4 w-4 mr-2" /> Add to cart
        </>
      )}
    </Button>
  );
}
