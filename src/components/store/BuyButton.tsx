import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getStripeEnvironment } from "@/lib/stripe";

interface BuyButtonProps {
  priceId: string | null;
  label?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "secondary" | "outline";
  className?: string;
  /** When set, the button renders disabled with this label (e.g. "Coming soon"). */
  disabledReason?: string | null;
}

export function BuyButton({
  priceId,
  label = "Buy now",
  size = "lg",
  variant = "default",
  className,
  disabledReason,
}: BuyButtonProps) {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    if (disabledReason) return;
    if (!priceId) {
      toast.error("This item isn't available for purchase yet.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, environment: getStripeEnvironment() },
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

  const isDisabled = loading || !priceId || !!disabledReason;
  const buttonLabel = disabledReason ?? label;

  return (
    <Button onClick={onClick} disabled={isDisabled} size={size} variant={variant} className={className}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : buttonLabel}
    </Button>
  );
}
