import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import "./waitlist.css";

const BrandMark = () => (
  <Link to="/waitlist" className="mw-brand" aria-label="MeasureWise home">
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="26" height="26" rx="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 20 L7 14 L11 18 L14 10 L17 16 L21 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span className="mw-brand-name">MeasureWise</span>
  </Link>
);

export default function WaitlistLanding() {
  return (
    <div className="mw-waitlist">
      <SEO
        title="MeasureWise Waitlist — HRSA Audit-Ready PDSA Sprint"
        description="Apply for the MeasureWise HRSA Audit-Ready PDSA Sprint. Built for FQHCs, Look-Alikes, and rural teams that need clearer PDSA tracking, audit evidence, and quality documentation."
        canonical="https://measurewise.org/waitlist"
      />

      <header className="mw-header">
        <div className="mw-container mw-nav">
          <BrandMark />
          <div>
            <Link className="mw-btn" to="/waitlist/apply">Join the waitlist</Link>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="mw-hero" id="top">
          <div className="mw-container mw-hero-grid">
            <div>
              <p className="mw-eyebrow">HRSA Audit-Ready PDSA Sprint</p>
              <h1>Get your PDSA work clear enough to defend.</h1>
              <p className="mw-lede">
                MeasureWise helps FQHCs and similar organizations clean up the part of quality work that breaks under pressure:
                inconsistent tracking, scattered evidence, unclear ownership, and improvement activity that makes sense only when
                someone is in the room to explain it.
              </p>
              <p className="mw-lede">
                This sprint is built for teams that need a tighter system for PDSA tracking, audit evidence, leadership reporting,
                and quality measure follow-through before the next scramble starts.
              </p>
              <div className="mw-hero-actions">
                <Link className="mw-btn" to="/waitlist/apply">Apply for the waitlist</Link>
                <a className="mw-btn-secondary" href="#fit">See who this is for</a>
              </div>
              <p className="mw-hero-note">
                Capped at 4 clients per quarter so each selected organization receives actual review and build support.
              </p>
            </div>

            <aside className="mw-hero-card" aria-label="Sprint snapshot">
              <p className="mw-micro-label">What this fixes</p>
              <div className="mw-metric">From scattered proof to a defensible trail.</div>
              <p className="mw-metric-copy">
                Built for quality leaders who are carrying too much risk across spreadsheets, notes, screenshots, and memory.
              </p>
              <div className="mw-stack">
                <div className="mw-stack-item">
                  <strong>PDSA tracking</strong>
                  <span>Clarify goals, owners, interventions, results, and next actions.</span>
                </div>
                <div className="mw-stack-item">
                  <strong>Audit evidence</strong>
                  <span>Reduce reconstruction work when HRSA, OSV, or leadership asks for proof.</span>
                </div>
                <div className="mw-stack-item">
                  <strong>Leadership visibility</strong>
                  <span>Make it easier to see what moved, what stalled, and where workflow is breaking.</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section>
          <div className="mw-container">
            <div className="mw-section-head mw-narrow">
              <h2>The problem MeasureWise is designed to solve</h2>
              <p>Most PDSAs do not fail because the team did not care. They fail because the work cannot be proven clearly when someone needs to review it fast.</p>
            </div>
            <div className="mw-grid-3">
              <article className="mw-panel">
                <h3>The story is incomplete</h3>
                <p>The goal was vague, the owner was unclear, the intervention changed, or the review date disappeared. By the time someone asks for the evidence, the team is reconstructing the timeline from memory.</p>
              </article>
              <article className="mw-panel">
                <h3>The evidence is scattered</h3>
                <p>Baselines, screenshots, meeting notes, tracker updates, and leadership summaries live in different places. That creates unnecessary risk during audits, OSV preparation, and internal reporting.</p>
              </article>
              <article className="mw-panel">
                <h3>The tracker creates more questions</h3>
                <p>If leadership cannot quickly see ownership, dates, results, and next steps, the system is not supporting the work. It is slowing it down.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="fit">
          <div className="mw-container">
            <div className="mw-section-head mw-narrow">
              <h2>Who this sprint is for</h2>
              <p>This is a strong fit for organizations that already know they have a real operational problem and need a cleaner, audit-ready way to manage improvement work.</p>
            </div>
            <div className="mw-grid-2">
              <article className="mw-panel">
                <h3>Best fit organizations</h3>
                <p>FQHCs, Look-Alikes, RHCs, and similar care organizations that need support with current PDSA tracking, UDS measure performance, HRSA audit readiness, OSV preparation, evidence packets, staff accountability, workflow breakdowns, or leadership reporting.</p>
              </article>
              <article className="mw-panel">
                <h3>What makes an application strong</h3>
                <p>A real quality or audit-readiness problem, a leadership team willing to act, and a clear timeline. The sprint works best when the organization is ready to fix the system, not just collect another template.</p>
              </article>
            </div>
          </div>
        </section>

        <section>
          <div className="mw-container">
            <div className="mw-section-head mw-narrow">
              <h2>What happens after you apply</h2>
              <p>The application is intentionally short, but the review is not automated. Each submission is reviewed manually for fit, urgency, and readiness.</p>
            </div>
            <div className="mw-process">
              {[
                { n: "01", h: "Submit the short application", p: "Share your organization details, biggest concern, current tracker reality, timing, and whether a premium consulting investment is possible this quarter." },
                { n: "02", h: "Applications are reviewed manually", p: "Selected organizations are contacted first when a sprint opening becomes available. Priority is based on fit, not on who clicked the form the fastest." },
                { n: "03", h: "Resources are sent while you wait", p: "You will receive a small number of practical emails focused on tightening PDSA tracking, audit evidence, and quality documentation without inbox clutter." },
              ].map((step) => (
                <article className="mw-process-step" key={step.n}>
                  <div className="mw-process-num">{step.n}</div>
                  <div>
                    <h3>{step.h}</h3>
                    <p>{step.p}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="apply">
          <div className="mw-container">
            <div className="mw-cta-wrap">
              <h2>Join the waitlist</h2>
              <p>
                If your team needs a clearer system before the next UDS push, audit cycle, or leadership review, apply for the
                MeasureWise HRSA Audit-Ready PDSA Sprint. Openings are limited so selected organizations receive actual build
                support, not just general advice.
              </p>
              <div className="mw-hero-actions">
                <Link className="mw-btn" to="/waitlist/apply">Open the application form</Link>
                <a className="mw-btn-secondary" href="mailto:hello@measurewise.org">Email MeasureWise</a>
              </div>
              <p className="mw-cta-meta">Selected organizations are contacted first with the next available start date.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mw-footer">
        <div className="mw-container mw-footer-bar">
          <p>MeasureWise helps health centers turn improvement work into a cleaner operational system.</p>
          <p>
            <Link to="/" style={{ textDecoration: "underline", textUnderlineOffset: "2px" }}>← Back to MeasureWise</Link>
            {" · "}hello@measurewise.org
          </p>
        </div>
      </footer>
    </div>
  );
}
