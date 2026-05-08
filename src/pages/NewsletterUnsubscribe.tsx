import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function NewsletterUnsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "confirm" | "done" | "already" | "error">("loading");
  const [email, setEmail] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setState("error"); return; }
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    fetch(`https://${projectId}.supabase.co/functions/v1/newsletter-unsubscribe?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.valid) { setState("error"); return; }
        if (data.already_unsubscribed) { setState("already"); setEmail(data.email); return; }
        setEmail(data.email);
        setState("confirm");
      })
      .catch(() => setState("error"));
  }, [token]);

  const handleUnsubscribe = async () => {
    setProcessing(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/newsletter-unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      setState(data.success ? "done" : "already");
    } catch {
      setState("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <PublicPageLayout>
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        {state === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Validating your request…</p>
          </div>
        )}
        {state === "confirm" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Unsubscribe</h1>
            <p className="text-muted-foreground">
              You'll stop receiving the MeasureWise newsletter at <strong>{email}</strong>.
            </p>
            <Button onClick={handleUnsubscribe} disabled={processing} variant="destructive">
              {processing ? "Unsubscribing…" : "Confirm Unsubscribe"}
            </Button>
          </div>
        )}
        {state === "done" && (
          <div className="space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold">Unsubscribed</h1>
            <p className="text-muted-foreground">You've been removed from the newsletter list. You can always re-subscribe from our <Link to="/newsletter" className="text-primary hover:underline">newsletter page</Link>.</p>
          </div>
        )}
        {state === "already" && (
          <div className="space-y-4">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold">Already Unsubscribed</h1>
            <p className="text-muted-foreground">This email is no longer receiving newsletters.</p>
          </div>
        )}
        {state === "error" && (
          <div className="space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Invalid Link</h1>
            <p className="text-muted-foreground">This unsubscribe link is invalid or has expired.</p>
          </div>
        )}
      </div>
    </PublicPageLayout>
  );
}
