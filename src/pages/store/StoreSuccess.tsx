import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Mail, RefreshCw, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderInfo {
  status: string;
  items: string[];
  downloadLinks: Array<{ name: string; url: string; path: string }>;
  customerEmail: string;
}

export default function StoreSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      const { data, error } = await supabase.functions.invoke("get-order", {
        body: { sessionId },
      });
      if (cancelled) return;
      if (!error && data && data.status === "paid") {
        setOrder(data as OrderInfo);
        setLoading(false);
        return;
      }
      // Webhook may take a few seconds — retry up to ~30s.
      if (attempts < 15) {
        setTimeout(poll, 2000);
      } else {
        setLoading(false);
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const handleResend = async () => {
    if (!sessionId) return;
    setResending(true);
    try {
      const { error } = await supabase.functions.invoke("resend-purchase-email", {
        body: { sessionId },
      });
      if (error) throw error;
      setResent(true);
      toast.success("We've re-sent your download links.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not resend";
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <PublicPageLayout backTo={{ label: "Back to store", href: "/store" }}>
      <SEO
        title="Thanks for your purchase"
        description="Your MeasureWise templates are ready to download."
        canonical="https://measurewise.org/store/success"
      />

      <section className="max-w-2xl mx-auto px-6 py-16">
        <Card>
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10">
                <CheckCircle className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Thank you for your purchase</h1>
              {order?.items?.length ? (
                <p className="text-muted-foreground">
                  Your <strong>{order.items.join(", ")}</strong> is ready below.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  We've sent your download links to the email you used at checkout.
                </p>
              )}
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-6">
                <Loader2 className="h-4 w-4 animate-spin" /> Preparing your downloads…
              </div>
            )}

            {!loading && order?.downloadLinks?.length ? (
              <div className="space-y-2 rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">Download your files</p>
                <ul className="space-y-2">
                  {order.downloadLinks.map((l) => (
                    <li key={l.path}>
                      <a
                        href={l.url}
                        className="flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download className="h-4 w-4" /> {l.name}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground pt-2">
                  Links expire in 7 days. Use the email link or the re-send button below for a fresh copy.
                </p>
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleResend} disabled={!sessionId || resending || resent} variant="outline">
                {resent ? (
                  <><CheckCircle className="h-4 w-4" /> Email re-sent</>
                ) : (
                  <><RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} /> Re-send the email</>
                )}
              </Button>
              <Button asChild>
                <Link to="/store">Browse more templates</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center inline-flex items-center justify-center gap-1.5 w-full">
              <Mail className="h-3.5 w-3.5" /> Need help? Reply to your purchase email and we'll respond within one business day.
            </p>
          </CardContent>
        </Card>
      </section>
    </PublicPageLayout>
  );
}
