import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Mail, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function StoreSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (sessionId) {
      // Optional: ping to ensure order is recorded; webhook handles fulfillment.
    }
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
      <SEO title="Thanks for your purchase" description="Your MeasureWise templates are on their way." canonical="https://measurewise.org/store/success" />

      <section className="max-w-2xl mx-auto px-6 py-16">
        <Card>
          <CardContent className="p-8 text-center space-y-5">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mx-auto">
              <CheckCircle className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Thank you for your purchase</h1>
            <p className="text-muted-foreground">
              We've sent your download links to the email you provided at checkout. They typically
              arrive within a minute. Check your spam folder if you don't see them.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
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
            <p className="text-xs text-muted-foreground pt-4 inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Need help? Reply to your purchase email and we'll respond within one business day.
            </p>
          </CardContent>
        </Card>
      </section>
    </PublicPageLayout>
  );
}
