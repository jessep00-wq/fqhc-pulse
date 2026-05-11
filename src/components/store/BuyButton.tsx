import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BuyButtonProps {
  priceId: string | null;
  label?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "secondary" | "outline";
  className?: string;
}

export function BuyButton({
  priceId,
  label = "Buy now",
  size = "lg",
  variant = "default",
  className,
}: BuyButtonProps) {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    if (!priceId) {
      toast.error("This item isn't available for purchase yet.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, environment: "sandbox" },
      });
      if (error) throw error;
      if (data?.url) {
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
    <Button onClick={onClick} disabled={loading || !priceId} size={size} variant={variant} className={className}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </Button>
  );
}
