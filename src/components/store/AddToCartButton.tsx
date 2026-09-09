import { useEffect, useRef, useState } from "react";
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
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onClick = () => {
    add(item);
    setJustAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustAdded(false), 2000);
  };

  const label = justAdded ? "Added to cart ✓" : inCart ? "In cart" : "Add to cart";

  return (
    <Button
      onClick={onClick}
      size={size}
      variant={variant}
      className={`max-w-full overflow-hidden whitespace-normal text-center leading-snug ${className ?? ""}`}
      disabled={disabled || (inCart && !justAdded)}
      aria-live="polite"
    >
      {justAdded || inCart ? (
        <Check className="h-4 w-4 mr-2 shrink-0" />
      ) : (
        <ShoppingBag className="h-4 w-4 mr-2 shrink-0" />
      )}
      <span className="truncate">{label}</span>
    </Button>
  );
}
