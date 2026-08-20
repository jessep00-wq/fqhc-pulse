import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";


interface TokenResult {
  ready: boolean;
  downloadUrl?: string;
  expiresAt?: string;
  downloaded?: boolean;
}

export default function ManualThankYou() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [state, setState] = useState<TokenResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async (n: number) => {
      const { data, error } = await supabase.functions.invoke<TokenResult>(
        "get-manual-token",
        { body: { session_id: sessionId } },
      );

      if (cancelled) return;
      if (!error && data?.ready) {
        setState(data);
        return;
      }
      if (n >= 15) {
        setTimedOut(true);
        return;
      }
      setAttempts(n + 1);
      timer = setTimeout(() => poll(n + 1), 2000);
    };

    poll(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex flex-col">
      <Helmet>
        <title>Your manual is ready — MeasureWise</title>
        <meta name="robots" content="noindex" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <nav className="px-6 md:px-12 py-4 border-b border-[#1A7A7A]/15">
        <Link to="/" className="text-xl" style={{ fontFamily: "'DM Serif Display', serif" }}>
          MeasureWise<span className="text-[#9DD4D4]">™</span>
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="bg-[#1E293B] border border-[#1A7A7A]/25 rounded-3xl max-w-lg w-full p-10 text-center relative overflow-hidden">
          <div
            aria-hidden
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: "linear-gradient(90deg, #0F4F4F, #1A7A7A, #9DD4D4)" }}
          />

          {!sessionId ? (
            <>
              <h1 className="text-2xl mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Missing checkout reference
              </h1>
              <p className="text-sm text-[#94A3B8] mb-6">
                We couldn't find your session. If you just paid, please check your email — we sent your download link there.
              </p>
              <Link to="/manual" className="text-[#9DD4D4] underline">
                Back to the manual page
              </Link>
            </>
          ) : !state?.ready && !timedOut ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-[#9DD4D4] mx-auto mb-4" />
              <h1 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Preparing your manual…
              </h1>
              <p className="text-sm text-[#94A3B8]">
                Watermarking your personalized PDF. This usually takes a few seconds.
              </p>
              {attempts > 4 && (
                <p className="text-xs text-[#94A3B8]/70 mt-4">
                  Still working… ({attempts * 2}s)
                </p>
              )}
            </>
          ) : timedOut && !state?.ready ? (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-amber-500/15 border-2 border-amber-400 flex items-center justify-center text-2xl">
                ⏳
              </div>
              <h1 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Hang tight
              </h1>
              <p className="text-sm text-[#94A3B8] mb-4">
                Your payment is confirmed but we're still preparing your file. We'll email your download link to the address on your receipt within the next minute.
              </p>
              <p className="text-xs text-[#94A3B8]/70">
                Didn't get it? Email{" "}
                <a href="mailto:hello@measurewise.org" className="text-[#9DD4D4]">
                  hello@measurewise.org
                </a>
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#10B981]/15 border-2 border-[#10B981] flex items-center justify-center text-2xl">
                ✓
              </div>
              <h1 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
                You're all set!
              </h1>
              <p className="text-sm text-[#94A3B8] mb-6">
                Your personalized copy is ready. This link expires after one download or 24 hours, whichever comes first.
              </p>
              <a
                href={state?.downloadUrl}
                className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-7 py-3.5 rounded-xl font-semibold transition-colors"
              >
                ⬇ Download Your Manual
              </a>
              <p className="text-[11px] text-amber-300 mt-4 flex items-center justify-center gap-1">
                ⚠ Save the file immediately — this link works only once
              </p>
              <p className="text-xs text-[#94A3B8]/70 mt-6">
                A receipt has been emailed to you. Questions?{" "}
                <a href="mailto:hello@measurewise.org" className="text-[#9DD4D4]">
                  hello@measurewise.org
                </a>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
