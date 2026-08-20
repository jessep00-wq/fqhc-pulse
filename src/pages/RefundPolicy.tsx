import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <SEO
        title="Refund Policy — MeasureWise"
        description="MeasureWise refund policy: 14-day free trial, no monthly refunds, 30-day pro-rated refund on annual plans."
        canonical="https://measurewise.org/refund-policy"
      />
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" asChild className="mb-8">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Refund Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: May 12, 2026</p>

        <div className="space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-2">14-day free trial</h2>
            <p className="text-muted-foreground leading-relaxed">
              Every paid plan includes a 14-day free trial. You will not be charged during the trial.
              You can cancel at any time before the trial ends with no obligation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Monthly plans</h2>
            <p className="text-muted-foreground leading-relaxed">
              Monthly subscriptions are non-refundable. You can cancel at any time, and you will
              keep access until the end of your current billing period. We do not pro-rate or refund
              partial months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Annual plans</h2>
            <p className="text-muted-foreground leading-relaxed">
              Annual subscriptions are eligible for a pro-rated refund within the first 30 days of
              the billing period. After 30 days, annual plans are non-refundable, but you may cancel
              auto-renewal at any time and keep access through the end of the term.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">How to request a refund</h2>
            <p className="text-muted-foreground leading-relaxed">
              Email{" "}
              <a href="mailto:hello@measurewise.org" className="text-primary hover:underline">
                hello@measurewise.org
              </a>{" "}
              with your account email and reason for the request. Eligible refunds are processed to
              the original payment method within 5–10 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Service interruptions</h2>
            <p className="text-muted-foreground leading-relaxed">
              If MeasureWise experiences extended downtime that materially affects your use of the
              platform, contact support — we evaluate service credits on a case-by-case basis.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
