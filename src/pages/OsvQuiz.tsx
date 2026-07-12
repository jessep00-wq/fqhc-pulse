import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, ShieldCheck, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackAnonEvent } from "@/lib/trackEvent";
import {
  OSV_QUESTIONS,
  MAX_SCORE,
  tierFor,
  scoreAnswers,
  parseUTM,
  type Tier,
} from "@/lib/osvQuiz";
import { toast } from "@/hooks/use-toast";

type Stage = "intro" | "quiz" | "result" | "thankyou";

const TIER_STYLES: Record<Tier, { border: string; badge: string; icon: JSX.Element }> = {
  red: {
    border: "border-l-4 border-destructive",
    badge: "bg-destructive/10 text-destructive",
    icon: <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />,
  },
  yellow: {
    border: "border-l-4 border-amber-500",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    icon: <AlertTriangle className="h-6 w-6 text-amber-500" aria-hidden />,
  },
  green: {
    border: "border-l-4 border-primary",
    badge: "bg-primary/10 text-primary",
    icon: <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden />,
  },
};

export default function OsvQuiz() {
  const [stage, setStage] = useState<Stage>("intro");
  const [step, setStep] = useState(0); // 0..OSV_QUESTIONS.length - 1
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const startedRef = useRef(false);
  const completedRef = useRef(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    organization: "",
    job_title: "",
    phone: "",
    consent: false,
  });

  const score = useMemo(() => scoreAnswers(answers), [answers]);
  const tier = useMemo(() => tierFor(score), [score]);
  const question = OSV_QUESTIONS[step];
  const progress = ((step + (answers[question?.id] !== undefined ? 1 : 0)) / OSV_QUESTIONS.length) * 100;

  const startQuiz = () => {
    if (!startedRef.current) {
      trackAnonEvent("osv_quiz_started");
      startedRef.current = true;
    }
    setStage("quiz");
  };

  const chooseAnswer = (points: number) => {
    const q = OSV_QUESTIONS[step];
    setAnswers((prev) => ({ ...prev, [q.id]: points }));
    // Auto-advance
    window.setTimeout(() => {
      if (step < OSV_QUESTIONS.length - 1) {
        setStep((s) => s + 1);
      } else {
        const finalScore = scoreAnswers({ ...answers, [q.id]: points });
        if (!completedRef.current) {
          trackAnonEvent("osv_quiz_completed", {
            score: finalScore,
            tier: tierFor(finalScore).tier,
          });
          completedRef.current = true;
        }
        setStage("result");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 200);
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast({ title: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (!form.consent) {
      toast({ title: "Please confirm the follow-up consent to continue.", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      organization: form.organization.trim(),
      job_title: form.job_title.trim(),
      phone: form.phone.trim() || null,
      consent: form.consent,
      score,
      tier: tier.tier,
      answers,
      page_url: typeof window !== "undefined" ? window.location.href : null,
      utm: typeof window !== "undefined" ? parseUTM(window.location.search) : {},
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    };

    const { data: inserted, error } = await supabase
      .from("osv_quiz_leads")
      .insert(payload)
      .select("id")
      .maybeSingle();
    if (error) {
      console.error("osv_quiz_leads insert failed", error);
    } else if (inserted?.id) {
      // Fire-and-forget: kick off the Day-0 result email + nurture sequence.
      supabase.functions
        .invoke("send-osv-result", { body: { lead_id: inserted.id } })
        .catch((e) => console.error("send-osv-result invoke failed", e));
    }

    trackAnonEvent("osv_quiz_submitted", {
      score,
      tier: tier.tier,
      organization: payload.organization,
      job_title: payload.job_title,
    });

    setSubmitting(false);
    setStage("thankyou");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (stage === "quiz") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, stage]);

  return (
    <PublicPageLayout>
      <SEO
        title="OSV Panic Index — HRSA Readiness Quiz"
        description="60-second self-assessment for FQHC QI directors and compliance leads. See where your OSV evidence binder is likely to break — and how to tighten it."
        canonical="https://measurewise.org/osv-quiz"
      />

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {stage === "intro" && (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              HRSA OSV self-assessment
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              The OSV Panic Index
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Eight questions. Sixty seconds. Find out where your QI/QA evidence binder is most
              likely to break under an HRSA Operational Site Visit — and get the checklist to
              tighten it.
            </p>
            <p className="text-sm text-muted-foreground">
              Built for QI directors, PCMH coordinators, and compliance leads. Self-assessment
              only — not a compliance determination.
            </p>
            <Button size="lg" className="min-h-14 px-8 text-base" onClick={startQuiz}>
              Start the assessment
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
            </Button>
          </div>
        )}

        {stage === "quiz" && question && (
          <div className="space-y-6">
            <div className="sticky top-20 z-10 -mx-4 sm:mx-0 bg-background/95 backdrop-blur px-4 sm:px-0 pt-2 pb-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Question {step + 1} of {OSV_QUESTIONS.length}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <Card>
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground leading-snug">
                    {question.prompt}
                  </h2>
                  {question.helper && (
                    <p className="mt-2 text-sm text-muted-foreground">{question.helper}</p>
                  )}
                </div>

                <div className="space-y-3">
                  {question.choices.map((c, idx) => {
                    const selected = answers[question.id] === c.points;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => chooseAnswer(c.points)}
                        className={`w-full text-left rounded-lg border p-4 min-h-14 transition-colors ${
                          selected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <span className="text-base text-foreground">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={step === 0}
                className="min-h-12"
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                Back
              </Button>
              <span className="text-sm text-muted-foreground self-center">
                Answers auto-advance
              </span>
            </div>
          </div>
        )}

        {stage === "result" && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Your result</p>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${TIER_STYLES[tier.tier].badge}`}>
                {TIER_STYLES[tier.tier].icon}
                {tier.label} · {score} / {MAX_SCORE}
              </div>
            </div>

            <Card className={TIER_STYLES[tier.tier].border}>
              <CardContent className="p-6 sm:p-8 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                  {tier.headline}
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {tier.summary}
                </p>
                <p className="text-base text-foreground font-medium">{tier.nextStep}</p>
              </CardContent>
            </Card>

            <div id="lead-form">
              <Card>
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Get your full breakdown + checklist
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    We'll email your question-by-question breakdown, the 90-day OSV-readiness
                    checklist, and follow-up resources tailored to your tier.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="first_name">First name</Label>
                        <Input
                          id="first_name"
                          required
                          autoComplete="given-name"
                          value={form.first_name}
                          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                          className="min-h-12"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="last_name">Last name</Label>
                        <Input
                          id="last_name"
                          required
                          autoComplete="family-name"
                          value={form.last_name}
                          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                          className="min-h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email">Work email</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="min-h-12"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="organization">Organization</Label>
                      <Input
                        id="organization"
                        required
                        autoComplete="organization"
                        value={form.organization}
                        onChange={(e) => setForm({ ...form, organization: e.target.value })}
                        className="min-h-12"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="job_title">Job title</Label>
                      <Input
                        id="job_title"
                        required
                        autoComplete="organization-title"
                        placeholder="e.g. QI Director, Compliance Lead"
                        value={form.job_title}
                        onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                        className="min-h-12"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone">
                        Phone <span className="text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="min-h-12"
                      />
                    </div>

                    <label className="flex items-start gap-3 pt-2 cursor-pointer">
                      <Checkbox
                        checked={form.consent}
                        onCheckedChange={(v) => setForm({ ...form, consent: v === true })}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-muted-foreground leading-snug">
                        Send me my breakdown and occasional MeasureWise resources for FQHC QI
                        teams. You can unsubscribe anytime.
                      </span>
                    </label>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full min-h-14 text-base"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
                          Sending…
                        </>
                      ) : (
                        <>Send me the breakdown</>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center pt-2">
                      Built for health center leaders, QI teams, and compliance staff.
                      Self-assessment only — not a compliance determination.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {stage === "thankyou" && (
          <div className="text-center space-y-6 py-10">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Your breakdown is on its way.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              We'll email your question-by-question breakdown, the 90-day OSV-readiness checklist,
              and follow-up resources within the next few minutes. Keep an eye on your inbox
              (and your spam folder, just in case).
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button asChild size="lg" className="min-h-14">
                <Link to="/contact">Book a MeasureWise walkthrough</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-h-14">
                <Link to="/">Back to MeasureWise.org</Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </PublicPageLayout>
  );
}
