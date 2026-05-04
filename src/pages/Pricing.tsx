import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle,
  Users,
  Infinity,
  Shield,
  ArrowLeft,
} from "lucide-react";
import measurewiseLogo from "@/assets/measurewise-logo.png";

const tiers = [
  {
    name: "Solo Clinic",
    price: "$149",
    period: "/month",
    description: "One site, unlimited everything else.",
    highlight: false,
    features: [
      "1 clinic site",
      "Unlimited users — MAs, RNs, providers, QI staff",
      "Unlimited PDSA cycles",
      "UDS measure dashboards & SPC charts",
      "HRSA OSV audit binder export",
      "PCMH Q-PASS evidence tracking",
      "Email support",
    ],
  },
  {
    name: "Multi-Site",
    price: "$349",
    period: "/month",
    description: "For health centers with 2–5 locations.",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Up to 5 clinic sites",
      "Unlimited users — no per-seat fees",
      "Unlimited PDSA cycles",
      "Cross-site measure comparison",
      "UDS dashboards & SPC charts",
      "HRSA OSV audit binder export",
      "PCMH Q-PASS evidence tracking",
      "Financial impact tracking",
      "Priority support",
    ],
  },
  {
    name: "Health Center Network",
    price: "$699",
    period: "/month",
    description: "For networks with 6+ sites or PCA/HCCN programs.",
    highlight: false,
    features: [
      "Unlimited clinic sites",
      "Unlimited users across the network",
      "Unlimited PDSA cycles",
      "Network-wide analytics & benchmarking",
      "Cross-site measure comparison",
      "All dashboards, charts & exports",
      "Financial impact tracking",
      "Dedicated onboarding",
      "Priority support & SLA",
    ],
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
  return (
    <div className="min-h-screen bg-background">
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
                  ? "border-primary shadow-lg ring-2 ring-primary/20"
                  : ""
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  {tier.badge}
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription className="text-sm">{tier.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-extrabold text-foreground">{tier.price}</span>
                  <span className="text-muted-foreground text-sm">{tier.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <ul className="space-y-3 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-6"
                  variant={tier.highlight ? "default" : "outline"}
                  asChild
                >
                  <Link to="/auth?signup=true">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
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
                q: "Do I need a credit card to start?",
                a: "No. Start your 30-day free trial with just an email address. No credit card, no purchase order, no procurement approval.",
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
                a: "Yes. Month-to-month billing, cancel anytime. No long-term contracts, no early termination fees.",
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
