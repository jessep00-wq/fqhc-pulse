import { useEffect, useState } from "react";
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

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { BRAND } from "@/lib/brand";
import { savePlanIntent } from "@/lib/planIntent";
import { trackAnonEvent } from "@/lib/trackEvent";


const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: BRAND.name,
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description: "Quality operations platform for FQHCs — PDSA cycles, UDS tracking, SPC charts, HRSA Audit Binders.",
  offers: [
    { "@type": "Offer", name: "Solo Clinic", price: "149", priceCurrency: "USD" },
    { "@type": "Offer", name: "Multi-Site", price: "349", priceCurrency: "USD" },
    { "@type": "Offer", name: "Network", price: "699", priceCurrency: "USD" },
  ],
};

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
    cta: "Start 14-day free trial",
    features: [
      { text: "1 clinic site" },
      { text: "Unlimited users — MAs, RNs, providers, QI staff" },
      { text: "Unlimited PDSA cycles" },
      { text: "UDS measure dashboards & SPC charts" },
      { text: "HRSA Audit Binder export" },
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
    cta: "Start 14-day free trial",
    features: [
      { text: "Up to 5 clinic sites" },
      { text: "Unlimited users — no per-seat fees" },
      { text: "Unlimited PDSA cycles" },
      { text: "Network dashboard & cross-site comparison" },
      { text: "UDS dashboards & SPC charts" },
      { text: "HRSA Audit Binder export" },
      { text: "Board report PDF export" },
      { text: "PCMH Q-PASS evidence tracking" },
      { text: "HRSA Audit Binder" },
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
    cta: "Start 14-day free trial",
    features: [
      { text: "Unlimited clinic sites" },
      { text: "Unlimited users across the network" },
      { text: "Unlimited PDSA cycles" },
      { text: "Network-wide analytics & benchmarking" },
      { text: "Cross-site measure comparison" },
      { text: "All dashboards, charts & exports" },
      { text: "HRSA Audit Binder" },
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

  useEffect(() => {
    trackAnonEvent("pricing_viewed", { source: "pricing_page" });
  }, []);

  const handleSubscribe = async (lookupKey: string | null) => {
    if (!lookupKey) {
      navigate("/auth?signup=true");
      return;
    }
    const billing: "monthly" | "annual" = annual ? "annual" : "monthly";
    trackAnonEvent("plan_selected", { priceId: lookupKey, billing });
    savePlanIntent(lookupKey, billing);
    if (!user) {
      navigate(`/auth?signup=true&plan=${lookupKey}&billing=${billing}`);
      return;
    }
    setLoadingKey(lookupKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription-checkout", {
        body: { priceId: lookupKey, environment: getStripeEnvironment() },
      });
      if (error) throw error;
      if (data?.url) {
        trackAnonEvent("checkout_started", { priceId: lookupKey });
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
    <PublicPageLayout>
      <SEO
        title={`${BRAND.name} pricing for FQHC quality teams`}
        description="Flat per-site pricing for FQHC quality ops: Solo $149, Multi-Site $349, Network $699. 14-day free trial on every plan."
        canonical={`${BRAND.url}/pricing`}
        jsonLd={pricingJsonLd}

      />


      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            {BRAND.name} pricing for
            <br />
            <span className="text-primary">FQHC quality teams</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Three flat per-site monthly plans built for how Federally Qualified Health Centers actually budget for quality software. Unlimited users, unlimited PDSA cycles, and no "contact sales" wall — a QI Director can sign up without procurement approval.
          </p>

          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-2 text-sm font-medium text-primary">
            14-day free trial — no credit card required
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
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
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
                      <span className={f.locked ? "text-muted-foreground" : "text-foreground"}>
                        {f.text}
                        {f.lockedLabel && (
                          <span className="block text-xs text-muted-foreground mt-0.5">{f.lockedLabel}</span>
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
                q: "How does the 14-day free trial work?",
                a: "Sign up with your email, pick a plan, and get full access to MeasureWise for 14 days. No credit card required to start. Add a card before day 14 to keep your workspace; otherwise it locks until you subscribe.",
              },
              {
                q: "Do I need a credit card to start?",
                a: "No. Start your 14-day free trial with just an email address — no credit card, no purchase order, no procurement approval. Add a card before the trial ends to continue using MeasureWise.",
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

    </PublicPageLayout>
  );
}
