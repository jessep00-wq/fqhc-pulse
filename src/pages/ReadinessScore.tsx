import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { READINESS_QUESTIONS } from "@/lib/readiness/questions";
import { scoreSubmission, CATEGORY_LABEL, type Answer, type ScoreResult } from "@/lib/readiness/scoring";

type Step = "intro" | "questions" | "capture" | "result";

const BRAND_URL = "https://measurewise.org";

export default function ReadinessScore() {
  const [step, setStep] = useState<Step>("intro");
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [form, setForm] = useState({ firstName: "", email: "", healthCenter: "", state: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);

  const total = READINESS_QUESTIONS.length;
  const q = READINESS_QUESTIONS[qIdx];
  const progress = step === "questions" ? Math.round(((qIdx) / total) * 100) : step === "capture" ? 95 : 0;

  const trackEvent = (event: string, props?: Record<string, unknown>) => {
    try {
      // @ts-expect-error - PostHog global
      window.posthog?.capture?.(event, props);
      // @ts-expect-error - gtag global for Google Ads
      window.gtag?.("event", event, props ?? {});
    } catch {
      /* analytics is non-critical */
    }
  };

  const startAssessment = () => {
    trackEvent("readiness_started");
    setStep("questions");
  };

  const onAnswer = (value: Answer) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    setTimeout(() => {
      if (qIdx + 1 < total) {
        setQIdx(qIdx + 1);
      } else {
        trackEvent("readiness_questions_complete");
        setStep("capture");
      }
    }, 180);
  };

  const onBack = () => {
    if (qIdx > 0) setQIdx(qIdx - 1);
    else setStep("intro");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.email.trim()) return;
    setSubmitting(true);
    try {
      const computed = scoreSubmission(READINESS_QUESTIONS, answers);
      const payload = {
        email: form.email.trim().toLowerCase(),
        first_name: form.firstName.trim(),
        ...(form.healthCenter.trim() ? { health_center: form.healthCenter.trim() } : {}),
        ...(form.state.trim() ? { state: form.state.trim() } : {}),
        answers: { ...answers, __gaps: computed.gaps, __breakdown: computed.breakdown } as unknown as Record<string, unknown>,
        score: computed.total,
        tier: computed.tier,
        source: "readiness_landing",
        user_agent: navigator.userAgent.slice(0, 256),
      };

      const { data, error } = await supabase
        .from("readiness_submissions")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;

      setResult(computed);
      trackEvent("readiness_email_captured", { tier: computed.tier, score: computed.total });
      setStep("result");

      // Fire-and-forget email send.
      supabase.functions
        .invoke("send-readiness-report", { body: { submissionId: data.id } })
        .catch((err) => console.warn("readiness report email failed", err));
    } catch (err) {
      console.error(err);
      toast({
        title: "Something went wrong",
        description: "We couldn't save your score. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <SEO
        title="HRSA SVP Readiness Score — Free 2-Minute Assessment"
        description="Score your FQHC's readiness for the HRSA Operational Site Visit in 2 minutes. Get a personalized scorecard, tier (At Risk / Building / Audit-Ready), and your top 3 priorities. No login."
        canonical={`${BRAND_URL}/readiness`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: "HRSA SVP Readiness Score",
          about: "HRSA Operational Site Visit readiness for Federally Qualified Health Centers",
          provider: { "@type": "Organization", name: "MeasureWise", url: BRAND_URL },
          educationalLevel: "Professional",
          timeRequired: "PT2M",
        }}
      />

      <Helmet>
        <meta name="robots" content="index,follow" />
      </Helmet>

      <header className="container mx-auto flex items-center justify-between px-4 py-6">
        <Link to="/" aria-label="MeasureWise home"><Logo size="md" /></Link>
        <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</Link>
      </header>

      <main className="container mx-auto max-w-2xl px-4 pb-20">
        {step === "intro" && <IntroPanel onStart={startAssessment} />}

        {step === "questions" && (
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <span>{CATEGORY_LABEL[q.category]}</span>
                  <span>{qIdx + 1} / {total}</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>

              <h2 className="text-xl font-semibold leading-snug text-foreground">{q.prompt}</h2>
              {q.helper && <p className="mt-2 text-sm text-muted-foreground">{q.helper}</p>}

              <RadioGroup value={answers[q.id] ?? ""} onValueChange={(v) => onAnswer(v as Answer)} className="mt-6 grid gap-2">
                {(["yes", "partial", "no"] as Answer[]).map((opt) => (
                  <Label
                    key={opt}
                    htmlFor={`${q.id}-${opt}`}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                    <span className="text-sm font-medium capitalize">
                      {opt === "partial" ? "Partially / sometimes" : opt}
                    </span>
                  </Label>
                ))}
              </RadioGroup>

              <div className="mt-6 flex items-center justify-between">
                <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
                  ← Back
                </Button>
                <p className="text-xs text-muted-foreground">Auto-advances after select</p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "capture" && (
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="mb-6"><Progress value={progress} className="h-1.5" /></div>
              <h2 className="text-2xl font-bold text-foreground">Last step — where should we send your scorecard?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                You'll see your score on the next screen. We'll also email a copy you can forward to your Medical Director or QI committee.
              </p>

              <form onSubmit={onSubmit} className="mt-6 grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First name *</Label>
                  <Input id="firstName" required maxLength={80} value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Work email *</Label>
                  <Input id="email" type="email" required maxLength={254} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@yourhealthcenter.org" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="healthCenter">Health center</Label>
                    <Input id="healthCenter" maxLength={120} value={form.healthCenter} onChange={(e) => setForm((f) => ({ ...f, healthCenter: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" maxLength={4} value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))} placeholder="MS" />
                  </div>
                </div>

                <Button type="submit" size="lg" disabled={submitting} className="mt-2 w-full">
                  {submitting ? "Calculating…" : "Show my score"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  We'll only email you about MeasureWise. Unsubscribe anytime.
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "result" && result && <ResultPanel result={result} firstName={form.firstName} />}
      </main>
    </div>
  );
}

function IntroPanel({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Free · 2 minutes · No login
      </div>
      <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
        How ready is your FQHC for its next HRSA Site Visit?
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
        Ten questions, four HRSA SVP categories. Get your readiness score (0–100), your tier, and your top 3 priorities — built from how reviewers actually evaluate evidence.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Button size="lg" onClick={onStart} className="px-8">
          Start the 2-minute assessment <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground">No credit card. No account required.</p>
      </div>

      <div className="mx-auto mt-12 grid max-w-xl gap-3 text-left sm:grid-cols-2">
        {[
          { icon: ShieldCheck, text: "Built by a BSN-trained Quality Director" },
          { icon: CheckCircle2, text: "Mapped to HRSA OSV scoring categories" },
          { icon: Sparkles, text: "Personalized scorecard emailed to you" },
          { icon: CheckCircle2, text: "Specific, actionable priorities — not generic advice" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-start gap-2 rounded-md border border-border/50 bg-card/50 p-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm text-foreground">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultPanel({ result, firstName }: { result: ScoreResult; firstName: string }) {
  const tierColor =
    result.tier === "audit_ready"
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : result.tier === "building"
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-rose-700 bg-rose-50 border-rose-200";

  return (
    <div>
      <Card className="border-border/60">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">{firstName ? `Here's your score, ${firstName}` : "Here's your score"}</p>
          <div className="mt-2 text-6xl font-bold tracking-tight text-foreground">
            {result.total}<span className="text-3xl text-muted-foreground">/100</span>
          </div>
          <div className={`mt-3 inline-flex items-center rounded-full border px-4 py-1 text-sm font-semibold ${tierColor}`}>
            {result.tierLabel}
          </div>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">{result.tierBlurb}</p>
        </CardContent>
      </Card>

      <Card className="mt-6 border-border/60">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Category breakdown</h3>
          <div className="mt-4 grid gap-3">
            {result.breakdown.map((b) => (
              <div key={b.category}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{b.label}</span>
                  <span className="font-semibold text-foreground">{b.score}%</span>
                </div>
                <Progress value={b.score} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {result.gaps.length > 0 && (
        <Card className="mt-6 border-border/60">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your top {result.gaps.length} priorities</h3>
            <ol className="mt-4 grid gap-3">
              {result.gaps.map((g, i) => (
                <li key={g.questionId} className="flex gap-3 rounded-lg border border-border/60 bg-card p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{g.prompt}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{CATEGORY_LABEL[g.category]}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-foreground">Want help closing these gaps?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            MeasureWise auto-builds the PDSA → UDS → Board-minute evidence chain reviewers actually open during OSV. 14-day trial, no credit card.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/auth?signup=true&utm_source=readiness&utm_medium=result">Start a 14-day trial</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contact?utm_source=readiness&utm_medium=result">Book 15 min with Jessica</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        We just emailed a copy of your scorecard — check your inbox (and spam folder).
      </p>
    </div>
  );
}
