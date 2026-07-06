import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCartStore, cartSubtotalCents } from "@/stores/cartStore";
import { formatPrice } from "@/types/store";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

export function CartDrawer() {
  const { items, isOpen, setOpen, remove } = useCartStore();
  const [loading, setLoading] = useState(false);

  const subtotal = cartSubtotalCents(items);
  const currency = items[0]?.currency ?? "usd";

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          items: items.map((i) => ({ lookupKey: i.lookupKey })),
          environment: getStripeEnvironment(),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error as string);
      if (data?.url) {
        // Same-tab redirect: Safari blocks window.open after an awaited promise
        // because the user-activation gesture is consumed by the await.
        window.location.href = data.url as string;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Checkout failed";
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Your cart
          </SheetTitle>
          <SheetDescription>
            Instant digital download after checkout.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 text-sm">
              Your cart is empty.
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.lookupKey}
                  className="flex items-start gap-3 p-3 rounded-md border bg-card"
                >
                  <div className="text-2xl shrink-0">{item.heroEmoji ?? "📋"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.kind}</p>
                    <p className="text-sm font-semibold mt-1">
                      {formatPrice(item.priceCents, item.currency)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(item.lookupKey)}
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold text-base">{formatPrice(subtotal, currency)}</span>
            </div>
            <Button
              onClick={handleCheckout}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting…
                </>
              ) : (
                `Checkout · ${formatPrice(subtotal, currency)}`
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Secure checkout via Stripe. Tax calculated at checkout.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
