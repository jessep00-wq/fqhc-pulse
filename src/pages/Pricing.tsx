import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle,
  Users,
  Infinity,
  Shield,
  ArrowLeft,
  Lock,
  Loader2,
} from "lucide-react";
import measurewiseLogo from "@/assets/measurewise-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { toast } from "sonner";

interface TierFeature {
  text: string;
  locked?: boolean;
  lockedLabel?: string;
}

const getTiers = (annual: boolean) => [
  {
    name: "Solo Clinic",
    lookupKey: annual ? "solo_annual" : "solo_monthly",
    price: annual ? "$124" : "$149",
    period: "/month",
    annualTotal: annual ? "$1,490/yr" : undefined,
    description: "One site, unlimited everything else.",
    highlight: false,
    cta: "Subscribe",
    features: [
      { text: "1 clinic site" },
      { text: "Unlimited users — MAs, RNs, providers, QI staff" },
      { text: "Unlimited PDSA cycles" },
      { text: "UDS measure dashboards & SPC charts" },
      { text: "HRSA OSV audit binder export" },
      { text: "Board report PDF export" },
      { text: "PCMH Q-PASS evidence tracking" },
      { text: "Email support" },
      { text: "Network dashboard", locked: true, lockedLabel: "Available in Multi-Site" },
    ] as TierFeature[],
  },
  {
    name: "Multi-Site",
    lookupKey: annual ? "multi_annual" : "multi_monthly",
    price: annual ? "$291" : "$349",
    period: "/month",
    annualTotal: annual ? "$3,490/yr" : undefined,
    description: "For health centers with 2–5 locations.",
    highlight: true,
    badge: "Most Popular",
    cta: "Subscribe",
    features: [
      { text: "Up to 5 clinic sites" },
      { text: "Unlimited users — no per-seat fees" },
      { text: "Unlimited PDSA cycles" },
      { text: "Network dashboard & cross-site comparison" },
      { text: "UDS dashboards & SPC charts" },
      { text: "HRSA OSV audit binder export" },
      { text: "Board report PDF export" },
      { text: "PCMH Q-PASS evidence tracking" },
      { text: "Financial impact tracking" },
      { text: "Priority support" },
    ] as TierFeature[],
  },
  {
    name: "Health Center Network",
    lookupKey: annual ? "network_annual" : "network_monthly",
    price: annual ? "$582" : "$699",
    period: "/month",
    annualTotal: annual ? "$6,990/yr" : undefined,
    description: "For networks with 6+ sites or PCA/HCCN programs.",
    highlight: false,
    cta: "Subscribe",
    features: [
      { text: "Unlimited clinic sites" },
      { text: "Unlimited users across the network" },
      { text: "Unlimited PDSA cycles" },
      { text: "Network-wide analytics & benchmarking" },
      { text: "Cross-site measure comparison" },
      { text: "All dashboards, charts & exports" },
      { text: "Financial impact tracking" },
      { text: "Dedicated onboarding" },
      { text: "Priority support & SLA" },
    ] as TierFeature[],
  },
];

const differentiators = [
  {
    icon: Users,
    title: "Unlimited users, always",
    description:
      "No per-seat pricing. Your QI Director, frontline MAs, RNs, and providers can all participate without procurement friction.",
  },
  {
    icon: Infinity,
    title: "Unlimited PDSA cycles",
    description:
      "Run as many improvement cycles as your team needs. We never throttle your QI work.",
  },
  {
    icon: Shield,
    title: "Per-site, not per-person",
    description:
      "Priced the way FQHCs actually budget — by site, by HRSA grant, by program. Not by individual employee.",
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const tiers = getTiers(annual);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async (lookupKey: string | null) => {
    if (!lookupKey) {
      navigate("/auth?signup=true");
      return;
    }
    if (!user) {
      // Send to signup; after onboarding the user can come back here.
      navigate(`/auth?signup=true&plan=${lookupKey}`);
      return;
    }
    setLoadingKey(lookupKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription-checkout", {
        body: { priceId: lookupKey, environment: getStripeEnvironment() },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url as string;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start checkout";
      toast.error(message);
      setLoadingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={measurewiseLogo} alt="MeasureWise" className="h-9" />
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth?signup=true">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-6">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
        </Link>
      </div>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Transparent pricing.
            <br />
            <span className="text-primary">No "Contact Sales" wall.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Flat per-site monthly pricing with unlimited users and unlimited PDSA cycles.
            Priced the way FQHCs actually budget — a QI Director can buy without procurement approval.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-2 text-sm font-medium text-primary">
            30-day free trial — no credit card required
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className={`text-sm font-medium ${!annual ? "text-foreground" : "text-muted-foreground"}`}>
              Billed Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                annual ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              aria-label="Toggle annual billing"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  annual ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${annual ? "text-foreground" : "text-muted-foreground"}`}>
              Billed Annually
            </span>
            {annual && (
              <span className="rounded-full bg-green-500/10 text-green-600 border border-green-500/20 px-3 py-0.5 text-xs font-semibold">
                Save 2 months
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative flex flex-col border-border ${
                tier.highlight
                  ? "border-primary shadow-lg ring-2 ring-primary/20 md:scale-105"
                  : ""
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  {tier.badge}
                </div>
              )}
              <CardHeader className={`text-center pb-4 ${tier.highlight ? "bg-gradient-to-b from-primary/5 to-transparent rounded-t-lg" : ""}`}>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription className="text-sm">{tier.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-extrabold text-foreground">{tier.price}</span>
                  {tier.period && <span className="text-muted-foreground text-sm">{tier.period}</span>}
                </div>
                {tier.annualTotal && (
                  <p className="text-xs text-muted-foreground mt-1">{tier.annualTotal} billed annually</p>
                )}
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <ul className="space-y-3 flex-1">
                  {tier.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2 text-sm">
                      {f.locked ? (
                        <Lock className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      )}
                      <span className={f.locked ? "text-muted-foreground/50" : "text-muted-foreground"}>
                        {f.text}
                        {f.lockedLabel && (
                          <span className="block text-xs text-muted-foreground/40 mt-0.5">{f.lockedLabel}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-6"
                  variant={tier.highlight ? "default" : "outline"}
                  onClick={() => handleSubscribe(tier.lookupKey)}
                  disabled={loadingKey === tier.lookupKey}
                >
                  {loadingKey === tier.lookupKey ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {tier.lookupKey === null ? tier.cta : tier.cta}{" "}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Why per-site */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">
            Why per-site pricing?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Enterprise QI vendors charge per seat, forcing FQHCs to limit who can participate.
            We believe every team member — from QI Director to frontline MA — should have access.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {differentiators.map((d) => (
              <div key={d.title} className="text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <d.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground">{d.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{d.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Common questions
          </h2>
          <div className="space-y-8">
            {[
              {
                q: "What's included in the Free plan?",
                a: "The Free plan gives you full access to the PDSA tracker with guided methodology, UDS measure dashboards, and HRSA audit binder export (watermarked). It's limited to 1 user, 3 active PDSA cycles, and 1 clinic site — enough to run your first improvement cycle and see real results before upgrading.",
              },
              {
                q: "Do I need a credit card to start?",
                a: "No. Start your 30-day free trial on any paid plan with just an email address. No credit card, no purchase order, no procurement approval. The Free plan never requires a card at all.",
              },
              {
                q: "Do you offer annual billing?",
                a: "Yes. Toggle to annual billing and get 2 months free on every paid plan. Annual contracts are easier to write into HRSA grants and operational budgets — no monthly credit card hassle.",
              },
              {
                q: "What counts as a 'site'?",
                a: "A site is a physical clinic location. If you have three buildings serving patients, that's three sites. Mobile units and school-based programs count as separate sites.",
              },
              {
                q: "Is there really no per-user fee?",
                a: "Correct. Add your entire QI committee, clinical staff, and leadership team — the price stays the same. We want frontline engagement, not tool gatekeeping.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Monthly plans cancel anytime with no early termination fees. Annual plans run through the end of the billing year — no partial refunds, but no auto-renewal surprises either.",
              },
              {
                q: "How does this compare to KaiNexus or RLDatix?",
                a: "Those platforms charge per user and hide pricing behind a sales call. MeasureWise publishes transparent per-site pricing that's typically 60-80% less for an FQHC.",
              },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="font-semibold text-foreground">{faq.q}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Start your 30-day free trial</h2>
          <p className="text-primary-foreground/80 text-lg">
            No credit card. No sales call. Just the QI tools your FQHC needs.
          </p>
          <Button size="lg" variant="secondary" asChild className="text-base px-8">
            <Link to="/auth?signup=true">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} MeasureWise. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
