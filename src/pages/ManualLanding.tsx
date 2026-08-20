import { useState } from "react";
import { SEO } from "@/components/SEO";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const LOOKUP_KEY = "athenaone_operations_manual_one_time";

interface BuyerForm {
  name: string;
  email: string;
  org: string;
}

export default function ManualLanding() {
  const [form, setForm] = useState<BuyerForm>({ name: "", email: "", org: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (k: keyof BuyerForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = form.name.trim();
    const email = form.email.trim();
    const org = form.org.trim();
    if (!name || !email || !org) {
      setError("Please fill in name, email, and organization.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid work email.");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceId: LOOKUP_KEY,
          buyer: { name, email, org },
          environment: getStripeEnvironment(),
        },
      });
      if (invokeErr) throw invokeErr;
      if (data?.error) throw new Error(data.error as string);
      if (!data?.url) throw new Error("Checkout did not return a URL.");
      window.location.href = data.url as string;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Checkout failed";
      setError(msg);
      toast.error(msg);
      setSubmitting(false);
    }
  };

  return (
    // Audit fix 33: clip oversized decorative blobs (w-[800px]/w-[600px])
    // so they don't bloat mobile paint area or trigger horizontal scroll.
    <div className="min-h-screen overflow-x-hidden bg-[#0F172A] text-[#F8FAFC] font-sans antialiased">
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <SEO
        title="FQHC AthenaOne Operations Manual — $197"
        description="The only operations manual built for FQHCs running AthenaOne. Workflows, CPT codes, macros, SOPs, and staff guides aligned with UDS 2025 and HEDIS MY 2026."
        canonical="https://measurewise.org/manual"
        image="https://measurewise.org/manual-og.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "MeasureWise FQHC AthenaOne Operations Manual",
          description:
            "32-page audit-ready AthenaOne operations manual: CPT codes, text macros, order sets, encounter plans, and SOPs for FQHC quality teams.",
          image: ["https://measurewise.org/manual-og.jpg"],
          sku: "MW-ATHENAONE-MANUAL",
          brand: { "@type": "Brand", name: "MeasureWise" },
          offers: {
            "@type": "Offer",
            price: "197.00",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: "https://measurewise.org/manual",
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: "US",
              returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
            },
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "USD" },
              shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
              deliveryTime: {
                "@type": "ShippingDeliveryTime",
                handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
                transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
              },
            },
          },
        }}
      />
      <PaymentTestModeBanner />

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-4 flex items-center justify-between bg-[#0F172A]/85 backdrop-blur border-b border-[#1A7A7A]/15">
        <a
          href="/"
          className="text-xl"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          MeasureWise<span className="text-[#9DD4D4]">™</span>
        </a>
        <span className="text-[11px] tracking-wider text-[#9DD4D4] bg-[#1A7A7A]/15 border border-[#1A7A7A]/30 px-3 py-1 rounded-full">
          FQHC · ATHENAONE · UDS 2025
        </span>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center px-6 md:px-12 pt-32 pb-20 overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-72 -right-72 w-[800px] h-[800px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(26,122,122,0.12) 0%, transparent 65%)" }}
        />
        <div
          aria-hidden
          className="absolute -bottom-48 -left-24 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(15,79,79,0.10) 0%, transparent 65%)" }}
        />
        <div className="relative z-10 max-w-6xl mx-auto w-full grid gap-12 lg:grid-cols-[1fr_420px] items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-[#9DD4D4] mb-6 before:content-[''] before:w-6 before:h-px before:bg-[#1A7A7A]">
              The only manual built for this
            </p>
            <h1
              className="text-4xl md:text-6xl leading-[1.1] text-white mb-6"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Stop losing measure credit for care you <em className="italic text-[#9DD4D4]">already delivered</em>.
            </h1>
            <p className="text-base md:text-lg text-[#94A3B8] max-w-xl mb-9 leading-relaxed">
              The MeasureWise FQHC AthenaOne Operations Manual gives your quality team the exact
              workflows, CPT codes, macros, SOPs, and staff guides to make sure every encounter
              counts — aligned with UDS 2025 and HEDIS MY 2026.
            </p>
            <div className="flex gap-8 mb-10">
              {[
                { n: "14", l: "UDS CQMs covered" },
                { n: "9", l: "Sections + SOPs" },
                { n: "8", l: "Ready-to-use macros" },
              ].map((s) => (
                <div key={s.l}>
                  <div
                    className="text-3xl text-[#9DD4D4] leading-none"
                    style={{ fontFamily: "'DM Serif Display', serif" }}
                  >
                    {s.n}
                  </div>
                  <div className="text-xs text-[#94A3B8] mt-1">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {["UDS 2025 Manual · HRSA", "HEDIS MY 2026 · NCQA", "AthenaOne · Jan 2026", "Updated May 2026"].map((t) => (
                <span
                  key={t}
                  className="text-[11px] font-medium text-[#9DD4D4] bg-[#1A7A7A]/10 border border-[#1A7A7A]/25 px-3 py-1 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* PURCHASE CARD */}
          <aside
            id="buy"
            className="relative bg-[#1E293B] border border-[#1A7A7A]/25 rounded-3xl p-8 overflow-hidden"
          >
            <div
              aria-hidden
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{ background: "linear-gradient(90deg, #0F4F4F, #1A7A7A, #9DD4D4)" }}
            />
            <div className="flex items-baseline gap-2">
              <span className="text-5xl text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
                $197
              </span>
              <span className="text-sm text-[#94A3B8]">one-time · single site license</span>
            </div>
            <p className="text-xs text-[#94A3B8] mb-6 mt-1">
              Instant download · PDF watermarked to your organization
            </p>

            <ul className="mb-6 space-y-0">
              {[
                "Complete 9-section operations manual (full PDF)",
                "All CPT, ICD-10 & CVX code tables — UDS 2025",
                "8 ready-to-deploy AthenaOne text macros",
                "Order sets + encounter plan configurations",
                "8 step-by-step SOPs for highest-risk documentation",
                "Print-ready MA cheat sheet + provider checklist",
                "End-of-month audit protocol",
                "HEDIS MY 2026 screening questionnaire guide",
              ].map((b, i, arr) => (
                <li
                  key={b}
                  className={`flex items-start gap-2.5 py-1.5 text-[13px] text-white/70 leading-snug ${
                    i < arr.length - 1 ? "border-b border-white/[0.06]" : ""
                  }`}
                >
                  <span className="text-[#10B981] font-bold text-xs mt-0.5">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="bg-[#1A7A7A]/10 border border-[#1A7A7A]/25 rounded-lg px-3.5 py-2.5 text-xs text-[#9DD4D4] mb-4 leading-snug">
              🔒 Your download is watermarked with your name and organization — unique to your purchase.
            </div>

            <form onSubmit={onSubmit} noValidate>
              {[
                { key: "name", label: "Your Full Name", placeholder: "Dr. Jordan Rivera", type: "text", autoComplete: "name" },
                { key: "email", label: "Work Email", placeholder: "you@healthcenter.org", type: "email", autoComplete: "email" },
                { key: "org", label: "Organization Name", placeholder: "Sunrise Community Health Center", type: "text", autoComplete: "organization" },
              ].map((f) => (
                <div key={f.key} className="mb-3">
                  <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#94A3B8] mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    autoComplete={f.autoComplete}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof BuyerForm]}
                    onChange={update(f.key as keyof BuyerForm)}
                    required
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#1A7A7A] placeholder:text-white/70 transition-colors"
                  />
                </div>
              ))}

              {error && <p className="text-[#FCA5A5] text-xs mt-2 min-h-[18px]">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 bg-[#1A7A7A] hover:bg-[#158080] disabled:bg-[#475569] disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Redirecting to checkout…
                  </>
                ) : (
                  <>Purchase for $197 →</>
                )}
              </button>
              <p className="text-center text-[11px] text-[#94A3B8] mt-3">
                🔒 Secured by Stripe · Card details never touch our servers
              </p>
            </form>
          </aside>
        </div>
      </section>

      {/* PROOF STRIP */}
      <section className="bg-[#1A7A7A]/[0.06] border-y border-[#1A7A7A]/10 px-6 md:px-12 py-5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-6">
          {[
            { i: "📋", t: "Built exclusively for FQHCs running AthenaOne — not adapted from a generic guide" },
            { i: "📅", t: "Current: UDS 2025 Manual (HRSA) + HEDIS MY 2026 (NCQA)" },
            { i: "⚡", t: "Instant delivery — watermarked PDF in seconds" },
            { i: "🔒", t: "Single-site license · one secure download per purchase" },
          ].map((p) => (
            <div key={p.t} className="flex items-center gap-2.5 text-[13px] text-[#94A3B8] flex-1 min-w-[220px]">
              <span className="w-8 h-8 bg-[#1A7A7A]/15 rounded-lg flex items-center justify-center text-base shrink-0">
                {p.i}
              </span>
              <span>{p.t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT'S INSIDE */}
      <section className="px-6 md:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          <p className="flex items-center gap-2.5 text-[11px] font-semibold tracking-widest uppercase text-[#9DD4D4] mb-3 before:content-[''] before:w-5 before:h-px before:bg-[#1A7A7A]">
            What's Inside
          </p>
          <h2
            className="text-3xl md:text-4xl text-white mb-12 max-w-2xl leading-tight"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Everything your team needs to close documentation gaps — permanently.
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { n: "01", t: "Master CPT Code Reference", d: "Every CPT, ICD-10, and CVX code AthenaOne's quality engine recognizes for all 14 UDS CQMs — with lookback periods and exact documentation locations." },
              { n: "02", t: "Ready-to-Use Text Macros", d: "Copy-paste macros for AWV, diabetes follow-up, hypertension, depression, tobacco, SDOH, and more. Configured with shortcuts and correct AthenaOne sections." },
              { n: "03", t: "Order Sets", d: "Pre-built order sets for preventive care, diabetes monitoring, hypertension, tobacco cessation, childhood immunizations, and MOUD initiation." },
              { n: "04", t: "Encounter Plans", d: "10 configured encounter plans that auto-load the right macros, templates, and order sets — so documentation happens automatically, not retroactively." },
              { n: "05", t: "8 Standard Operating Procedures", d: "Step-by-step SOPs for external lab results, mastectomy exclusions, hysterectomy exclusions, daily MA workflow, end-of-month audit, and more." },
              { n: "06", t: "Staff Training Quick Reference", d: "Print-ready MA cheat sheet and provider 60-second encounter checklist. Post at every rooming station. No training session required." },
              { n: "07–09", t: "Rules, Build Reference & Standards", d: "The five non-negotiable documentation rules, complete AthenaOne build path quick reference, and annual review protocol aligned to HRSA and NCQA." },
            ].map((c) => (
              <article
                key={c.n}
                className="bg-[#1E293B] border border-white/[0.07] hover:border-[#1A7A7A]/40 rounded-2xl p-6 transition-colors"
              >
                <p
                  className="text-[11px] text-[#1A7A7A] font-medium tracking-widest mb-2.5"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  SECTION {c.n}
                </p>
                <h3
                  className="text-lg text-white mb-2"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  {c.t}
                </h3>
                <p className="text-[13px] text-[#94A3B8] leading-relaxed">{c.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="px-6 md:px-12 py-20 bg-[#1A7A7A]/[0.04] border-t border-[#1A7A7A]/10">
        <div className="max-w-6xl mx-auto">
          <p className="flex items-center gap-2.5 text-[11px] font-semibold tracking-widest uppercase text-[#9DD4D4] mb-3 before:content-[''] before:w-5 before:h-px before:bg-[#1A7A7A]">
            Who This Is For
          </p>
          <h2
            className="text-3xl md:text-4xl text-white mb-12 max-w-2xl leading-tight"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Built for every role on your quality team.
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { r: "Quality / UDS Analyst", u: "Validate documentation standards, run audit reports, verify exclusions, close measure gaps before year-end" },
              { r: "AthenaOne Administrator", u: "Build macros, order sets, encounter plans, and questionnaire configurations from exact specifications" },
              { r: "Medical Assistant", u: "Print-ready intake checklist — know exactly which fields to enter at every visit without guessing" },
              { r: "Provider / Clinician", u: "60-second encounter checklist — close every visit knowing your documentation will count" },
              { r: "CMO / Clinical Leader", u: "Monthly audit protocol and provider scorecard framework to identify gaps and drive team adoption" },
            ].map((w) => (
              <div
                key={w.r}
                className="bg-[#1E293B] border border-white/[0.07] border-t-2 border-t-[#1A7A7A] rounded-xl p-5"
              >
                <div className="font-semibold text-white text-sm mb-1.5">{w.r}</div>
                <div className="text-[12.5px] text-[#94A3B8] leading-snug">{w.u}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="px-6 md:px-12 py-20 text-center">
        <h2
          className="text-3xl md:text-4xl text-white mb-4"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Your data should reflect your care.
        </h2>
        <p className="text-[#94A3B8] max-w-lg mx-auto mb-8">
          One manual. Every role. Every measure. Built for the EHR you're actually running.
        </p>
        <a
          href="#buy"
          className="inline-flex items-center gap-2 bg-[#1A7A7A] hover:bg-[#158080] text-white px-9 py-4 rounded-xl font-semibold transition-colors"
        >
          Get the Manual — $197 →
        </a>
      </section>

      <footer className="bg-[#080F1A] px-6 md:px-12 py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-white/80 leading-relaxed">
          <p>
            MeasureWise™ · <a href="https://measurewise.org" className="text-[#9DD4D4]">measurewise.org</a> ·
            Licensed for internal use by the purchasing organization only. Not for redistribution or resale.
          </p>
          <p>
            Questions:{" "}
            <a href="mailto:hello@measurewise.org" className="text-[#9DD4D4]">
              hello@measurewise.org
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
