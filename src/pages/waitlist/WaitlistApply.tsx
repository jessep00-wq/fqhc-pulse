import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { trackAnonEvent } from "@/lib/trackEvent";
import "./waitlist.css";

const ORG_TYPES = ["FQHC", "FQHC Look-Alike", "RHC", "Other"] as const;
const CONCERNS = [
  "PDSA tracking is unclear or incomplete",
  "Audit/OSV evidence is scattered",
  "UDS measure performance is stalled",
  "Leadership reporting is hard to defend",
  "Staff accountability or workflow breakdowns",
  "Other (described below)",
] as const;
const TIMING = ["Immediately", "Within 30 days", "This quarter", "Next quarter", "Just exploring"] as const;
const INVESTMENT = [
  "Yes — budget is approved",
  "Likely — pending leadership approval",
  "Unsure — would need to discuss",
  "No — exploring only",
] as const;

const BrandMark = () => (
  <Link to="/waitlist" className="mw-brand" aria-label="MeasureWise waitlist">
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="26" height="26" rx="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 20 L7 14 L11 18 L14 10 L17 16 L21 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span className="mw-brand-name">MeasureWise · Waitlist</span>
  </Link>
);

export default function WaitlistApply() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      title: String(data.get("title") || "").trim(),
      organization: String(data.get("organization") || "").trim(),
      state: String(data.get("state") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      sites: data.get("sites") ? Number(data.get("sites")) : null,
      ehr: String(data.get("ehr") || "").trim(),
      org_type: String(data.get("org_type") || "").trim(),
      prompt_now: String(data.get("prompt_now") || "").trim(),
      primary_concern: String(data.get("primary_concern") || "").trim(),
      timing: String(data.get("timing") || "").trim(),
      investment: String(data.get("investment") || "").trim(),
    };

    try {
      const { data: res, error: invokeError } = await supabase.functions.invoke(
        "submit-waitlist-application",
        { body: payload },
      );
      if (invokeError) throw invokeError;
      if (res && (res as any).error) throw new Error(typeof (res as any).error === "string" ? (res as any).error : "Submission failed");
      trackAnonEvent("waitlist_applied", { org_type: payload.org_type, timing: payload.timing });
      navigate("/waitlist/thank-you", { replace: true });
    } catch (err: any) {
      console.error("waitlist submit failed", err);
      setError(err?.message ?? "Something went wrong. Please try again or email hello@measurewise.org.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mw-waitlist">
      <SEO
        title="MeasureWise Waitlist Application"
        description="Apply for the MeasureWise consulting waitlist for FQHC quality, PDSA, UDS, HRSA, and operational readiness support."
        canonical="https://measurewise.org/waitlist/apply"
      />

      <header className="mw-header">
        <div className="mw-container mw-nav">
          <BrandMark />
          <Link className="mw-btn-secondary" to="/waitlist">Back to overview</Link>
        </div>
      </header>

      <main id="main" className="mw-container" style={{ padding: "var(--space-10) 0 var(--space-16)" }}>
        <div style={{ display: "grid", gap: "var(--space-8)", gridTemplateColumns: "1fr", alignItems: "start" }}>
          <section>
            <p className="mw-eyebrow">Application</p>
            <h1>Apply for the next MeasureWise consulting sprint.</h1>
            <p className="mw-lede">
              This waitlist is built for health center leaders who need structure, accountability, and operational clarity around
              PDSA execution, UDS performance, audit readiness, and workflow repair. The form is intentionally short, but serious
              enough to prioritize organizations that are ready to act.
            </p>
          </section>

          <section className="mw-form-panel" aria-labelledby="form-title">
            <div className="mw-form-header">
              <h2 id="form-title">Waitlist application</h2>
              <p>Complete this short application to be considered for a current or upcoming opening. Required fields help qualify fit, timeline, and implementation readiness.</p>
            </div>

            <form className="mw-form" method="post" onSubmit={onSubmit}>
              {error && <div className="mw-error" role="alert">{error}</div>}

              <fieldset>
                <legend>Contact details</legend>
                <p className="mw-section-intro">Capture the basics first. Required fields are marked.</p>
                <div className="mw-form-grid">
                  <div className="mw-field">
                    <label htmlFor="name">Name</label>
                    <input id="name" name="name" type="text" autoComplete="name" required placeholder="Jessica Smith" maxLength={160} />
                  </div>
                  <div className="mw-field">
                    <label htmlFor="title">Title</label>
                    <input id="title" name="title" type="text" autoComplete="organization-title" required minLength={2} placeholder="Quality Director" maxLength={160} />
                  </div>
                  <div className="mw-field">
                    <label htmlFor="organization">Organization</label>
                    <input id="organization" name="organization" type="text" autoComplete="organization" required minLength={2} placeholder="Organization name" maxLength={200} />
                  </div>
                  <div className="mw-field">
                    <label htmlFor="state">State</label>
                    <input id="state" name="state" type="text" autoComplete="address-level1" required minLength={2} placeholder="Mississippi" maxLength={80} />
                  </div>
                  <div className="mw-field">
                    <label htmlFor="email">Email</label>
                    <input id="email" name="email" type="email" autoComplete="email" required placeholder="name@organization.org" maxLength={255} />
                  </div>
                  <div className="mw-field">
                    <label htmlFor="phone">Phone</label>
                    <input id="phone" name="phone" type="tel" autoComplete="tel" required minLength={7} placeholder="(555) 555-5555" maxLength={40} />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend>Organization profile</legend>
                <p className="mw-section-intro">Minimum operational context to route applications.</p>
                <div className="mw-form-grid">
                  <div className="mw-field">
                    <label htmlFor="sites">Number of sites</label>
                    <input id="sites" name="sites" type="number" min={1} inputMode="numeric" placeholder="4" />
                  </div>
                  <div className="mw-field">
                    <label htmlFor="ehr">EHR system</label>
                    <input id="ehr" name="ehr" type="text" placeholder="athenaOne, eClinicalWorks, NextGen" maxLength={120} />
                  </div>
                  <div className="mw-full">
                    <label htmlFor="org-type">Are you an FQHC, Look-Alike, RHC, or other?</label>
                    <select id="org-type" name="org_type" required defaultValue="">
                      <option value="" disabled>Select organization type</option>
                      {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend>Need and urgency</legend>
                <p className="mw-section-intro">What is driving this request right now?</p>
                <div className="mw-full">
                  <label htmlFor="prompt">What prompted you to seek support now?</label>
                  <textarea id="prompt" name="prompt_now" required minLength={10} maxLength={4000} placeholder="Describe the trigger, pressure point, or leadership concern driving this request." />
                </div>
              </fieldset>

              <fieldset>
                <legend>Primary concern</legend>
                <p className="mw-section-intro">Pick the area where you most need cleaner systems.</p>
                <div className="mw-choice-grid" role="radiogroup" aria-labelledby="concern-label">
                  <span id="concern-label" className="sr-only">Primary concern</span>
                  {CONCERNS.map((c, i) => (
                    <div className="mw-choice" key={c}>
                      <input id={`concern-${i}`} type="radio" name="primary_concern" value={c} defaultChecked={i === 0} />
                      <label htmlFor={`concern-${i}`}>{c}</label>
                    </div>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend>Timing & readiness</legend>
                <p className="mw-section-intro">When would your team realistically start, and is a premium consulting investment possible this quarter?</p>
                <div className="mw-form-grid">
                  <div className="mw-full">
                    <label htmlFor="timing">When would you like to start?</label>
                    <select id="timing" name="timing" required defaultValue="">
                      <option value="" disabled>Select a timeframe</option>
                      {TIMING.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="mw-full">
                    <label htmlFor="investment">Investment readiness</label>
                    <select id="investment" name="investment" required defaultValue="">
                      <option value="" disabled>Select investment readiness</option>
                      {INVESTMENT.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <p className="mw-hint">Sprints are premium engagements. This helps prioritize organizations ready to act.</p>
                  </div>
                </div>
              </fieldset>

              <div className="mw-actions">
                <p className="mw-microcopy">
                  Submitting puts you on the waitlist. We review every application manually for fit, urgency, and readiness.
                </p>
                <button className="mw-btn" type="submit" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit application"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>

      <footer className="mw-footer">
        <div className="mw-container mw-footer-bar">
          <p>Questions before applying? Email hello@measurewise.org.</p>
          <p><Link to="/" style={{ textDecoration: "underline", textUnderlineOffset: "2px" }}>← MeasureWise home</Link></p>
        </div>
      </footer>
    </div>
  );
}
