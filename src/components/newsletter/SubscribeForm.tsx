import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { trackAnonEvent } from "@/lib/trackEvent";

export function SubscribeForm({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("subscribe-newsletter", {
        body: { email: trimmed },
      });
      if (error) throw error;
      if (data?.alreadySubscribed) {
        toast.info("You're already subscribed!");
      } else {
        toast.success("Subscribed! Check your inbox for a welcome email.");
        trackAnonEvent("newsletter_subscribed", {});
      }
      setEmail("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubscribe} className={`flex gap-2 max-w-md ${className ?? ""}`}>
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="email"
          placeholder="you@fqhc.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-9"
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Subscribing…" : "Subscribe"}
      </Button>
    </form>
  );
}
