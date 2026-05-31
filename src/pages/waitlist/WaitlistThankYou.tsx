import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import "./waitlist.css";

export default function WaitlistThankYou() {
  return (
    <div className="mw-waitlist">
      <SEO
        title="Application Received — MeasureWise Waitlist"
        description="Your MeasureWise HRSA Audit-Ready PDSA Sprint application has been received."
        canonical="https://measurewise.org/waitlist/thank-you"
      />

      <main className="mw-thanks-shell">
        <Link to="/waitlist" className="mw-brand" aria-label="MeasureWise" style={{ marginBottom: "var(--space-12)" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="26" height="26" rx="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 20 L7 14 L11 18 L14 10 L17 16 L21 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="mw-brand-name">MeasureWise</span>
        </Link>

        <article className="mw-thanks-card" aria-labelledby="confirmation-heading">
          <div className="mw-check-wrap" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <p className="mw-sub-headline">Application Received</p>
          <h1 className="mw-headline" id="confirmation-heading">You're on the waiting list.</h1>

          <p className="mw-body-copy">
            Your application has been received for the <strong>MeasureWise HRSA Audit-Ready PDSA Sprint</strong>.
          </p>
          <p className="mw-body-copy">
            I review each application manually because fit matters. When space opens, selected organizations will be contacted first with the next available start date.
          </p>
          <p className="mw-body-copy">
            While you wait, I'll send a small number of practical resources to help your team tighten up PDSA tracking, audit evidence, and quality measure documentation.
          </p>

          <div className="mw-divider" role="separator" />

          <p className="mw-body-copy" style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text)", marginBottom: "var(--space-5)" }}>
            What happens next
          </p>

          <div className="mw-next-steps" role="list">
            <div className="mw-step" role="listitem">
              <span className="mw-step-num">01</span>
              <p className="mw-step-text"><strong>Check your inbox.</strong> A confirmation will arrive shortly. Your first resource email follows within a few days.</p>
            </div>
            <div className="mw-step" role="listitem">
              <span className="mw-step-num">02</span>
              <p className="mw-step-text"><strong>I'll review your application.</strong> I look at fit, urgency, and readiness — not just availability — before reaching out.</p>
            </div>
            <div className="mw-step" role="listitem">
              <span className="mw-step-num">03</span>
              <p className="mw-step-text"><strong>Selected organizations are contacted first.</strong> If your timeline changes or a priority need comes up, reply to any email from me directly.</p>
            </div>
          </div>

          <footer className="mw-footer-note">
            Questions? Reply to your confirmation email or reach out at{" "}
            <a href="mailto:hello@measurewise.org">hello@measurewise.org</a>.
            The sprint is capped at 4 clients per quarter.
            <br />
            <Link to="/" style={{ display: "inline-block", marginTop: "var(--space-3)" }}>← Back to MeasureWise</Link>
          </footer>
        </article>
      </main>
    </div>
  );
}
