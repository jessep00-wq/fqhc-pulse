import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/** Inline launch-alert capture for coming-soon products. */
export function NotifyMeForm({ productSlug }: { productSlug: string }) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm inline-flex items-start gap-2">
        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <span>You're on the list. We'll email you the moment this template is ready.</span>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("store_waitlist_signups").insert({
      email: value,
      product_slug: productSlug,
      intent: "waitlist",
    });
    setSaving(false);
    if (error) {
      toast.error("Something went wrong. Try again.");
      return;
    }
    setDone(true);
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <p className="text-xs text-muted-foreground">
        This template is launching soon. Get an email when it's ready.
      </p>
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@healthcenter.org"
        aria-label="Email for launch notification"
      />
      <Button type="submit" variant="outline" className="w-full" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Notify me when this launches"}
      </Button>
    </form>
  );
}
