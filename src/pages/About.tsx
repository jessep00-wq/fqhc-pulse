import { Link } from "react-router-dom";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, GraduationCap, Stethoscope, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

const focusAreas = [
  "UDS measure performance and data integrity",
  "HRSA audit readiness and documentation support",
  "AthenaOne workflow optimization",
  "Population health and care gap workflows",
  "Provider and staff education",
  "Risk management and patient safety",
  "Clinical quality reporting",
  "Chronic disease measure improvement",
  "PDSA cycle structure and accountability",
  "Operational dashboards and executive reporting",
];

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Jessica Smith",
  jobTitle: "FQHC Quality, Clinical Operations, Risk Management, and Data Integrity Leader",
  honorificSuffix: "RN, BSN",
  url: "https://measurewise.org/about",
  worksFor: { "@type": "Organization", name: "MeasureWise" },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "Bevill State Community College" },
    { "@type": "CollegeOrUniversity", name: "Itawamba Community College" },
  ],
  knowsAbout: focusAreas,
};

export default function About() {
  return (
    <PublicPageLayout>
      <SEO
        title="About Jessica Smith, RN — Founder of MeasureWise"
        description="Jessica Smith, RN, BSN — FQHC Quality, Risk, and Data Integrity leader and founder of MeasureWise. Building QI systems that work in real clinic life."
        canonical="https://measurewise.org/about"
        jsonLd={personJsonLd}
      />

      <section className="py-16 px-6 border-b border-border bg-card/30">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">About the Author</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Jessica Smith, RN, BSN
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            FQHC Quality, Clinical Operations, Risk Management, and Data Integrity Leader
          </p>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto space-y-6 text-foreground/90 leading-relaxed">
          <p>
            Jessica Smith is a Registered Nurse and healthcare operations strategist with deep experience in
            Federally Qualified Health Centers, clinical quality improvement, population health workflows, risk
            management, and frontline care delivery. Her work sits at the place where clinical reality meets
            reporting accountability: UDS measures, documentation integrity, patient follow-up, care gaps, risk
            reduction, staff training, and the everyday workflows that determine whether quality work actually
            counts.
          </p>
          <p>
            Jessica brings a practical, clinic-tested perspective to FQHC performance improvement. She has worked
            inside rural and community-based care settings where teams are expected to deliver high-quality care
            while also managing federal reporting, payer requirements, staffing pressure, documentation burden, and
            constant operational change. That background shapes her approach: quality improvement should not live
            in a spreadsheet after the work is done. It should be built into the way care happens.
          </p>
        </div>
      </section>

      <section className="py-12 px-6 bg-card/30 border-y border-border">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Stethoscope className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Professional Background</h2>
          </div>
          <div className="space-y-4 text-foreground/90 leading-relaxed">
            <p>
              Her professional background includes nursing leadership, chronic disease care support, referrals,
              immunizations, CLIA-waived testing, infection control, care coordination, hospice case management,
              medication reconciliation, wound care, discharge planning, and provider support. Earlier in her
              career, she served as a nurse at Access Family Health, where her duties included triage, labs, EKGs,
              sports and DOT physicals, Vaccines for Children coordination, sample and supply management, referral
              tracking, CLIA-waived controls, medication and injection administration, wound care, and patient
              follow-up.
            </p>
            <p>
              Jessica's experience also includes work with LifeCore Health Group, Mantachie Rural Health Care,
              North Mississippi Medical Center, and Kindred Hospice. Across these roles, she developed a broad
              operational view of care delivery, from mobile clinic workflows and chronic condition support to
              hospice case management, care planning, provider collaboration, and clinical documentation.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Credentials &amp; Professional Training</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold text-foreground">Education</h3>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  Associate Degree in Nursing — Bevill State Community College (December 2019). Licensed Practical
                  Nursing training (2009). Surgical Technology Program — Itawamba Community College (2003).
                  Certifications and training in TB, X-ray, diabetic foot care, and CLIA-waived testing.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold text-foreground">Continuing Education &amp; Certifications</h3>
                <ul className="text-sm text-foreground/90 leading-relaxed space-y-2 list-disc pl-4">
                  <li>CHCAMS Spring Clinical Conference — <em>Diabetes Models of Care to Improve Patient Outcomes</em> (3 nursing contact hours, listed as Clinical Nurse Manager)</li>
                  <li>CDC training — Vaccines for Children Program (1 contact hour)</li>
                  <li>The Joint Commission — <em>Aligning Patient Safety Event Reporting: 2025 Updates to Sentinel Events and Serious Reportable Events</em> (1.25 CE/CME hours)</li>
                  <li>FTCA risk management training through ECRI, including cultivating staff capacity for patient safety and the attorney perspective on risk management</li>
                  <li>Basic Life Support — American Heart Association (issued April 22, 2026; renewal due April 2028)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 px-6 bg-card/30 border-y border-border">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">FQHC Quality Leadership</h2>
          </div>
          <div className="space-y-4 text-foreground/90 leading-relaxed max-w-3xl">
            <p>
              Jessica's FQHC leadership is grounded in the work most health centers struggle to make visible:
              closing care gaps, improving documentation accuracy, aligning workflows with quality measures, and
              helping clinical teams understand how their daily work connects to UDS, compliance, reimbursement,
              and audit readiness.
            </p>
            <p>
              Her quality leadership is not theoretical. It comes from years of working directly with providers,
              nurses, front office teams, referrals, lab processes, immunization workflows, chronic disease care,
              patient follow-up, and documentation systems. She understands the pressure points that create
              reporting failures: missed follow-up, inconsistent documentation, poorly defined task ownership,
              untracked referrals, incomplete measure logic, and staff who are doing the work but not capturing it
              in a way that reports correctly.
            </p>
            <p className="font-medium text-foreground">
              That is the core of her work now: helping healthcare organizations build systems that are accurate,
              usable, and defensible.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
              Practical FQHC improvement areas
            </h3>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
              {focusAreas.map((area) => (
                <li key={area} className="flex items-start gap-2 text-sm text-foreground/90">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-foreground/90 leading-relaxed max-w-3xl pt-2">
            She is especially focused on helping FQHC leaders move from reactive reporting to controlled systems.
            The goal is not more paperwork. The goal is cleaner workflows, stronger documentation, better
            visibility, and fewer surprises when the data is reviewed.
          </p>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Proof of Experience</h2>
          </div>
          <p className="text-foreground/90 leading-relaxed">
            Jessica's background reflects a rare blend of frontline nursing, clinical operations, quality
            improvement, and FQHC-specific workflow knowledge. Her resume documents direct experience in
            community health nursing, VFC coordination, CLIA-waived testing, infection control, referrals, triage,
            chronic care support, and clinical leadership functions. Her continuing education supports her focus
            on diabetes outcomes, immunization program standards, patient safety reporting, FTCA risk management,
            and clinical risk reduction.
          </p>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5 flex items-start gap-3">
              <Award className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground/90">
                Recognized as <strong>Employee of the First Quarter at Access Family Health (2019)</strong>,
                reflecting her contribution within the FQHC setting.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 px-6 bg-gradient-to-b from-card/40 to-background border-t border-border">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">Author Statement</p>
          <blockquote className="border-l-4 border-primary pl-6 space-y-4 italic text-lg text-foreground/90 leading-relaxed">
            <p>I write from the perspective of someone who has lived the operational reality of community health.</p>
            <p>
              I know what it feels like when the care is happening, but the data does not show it. I know what
              happens when providers are overwhelmed, nurses are stretched thin, front office teams are expected
              to close loops without clear systems, and quality staff are left trying to turn messy workflows
              into clean reports.
            </p>
            <p className="not-italic font-semibold text-foreground">
              That is why my work is built around one belief: quality improvement has to work in real life.
            </p>
            <ul className="not-italic space-y-1 text-base text-foreground/90 list-none pl-0">
              <li>It has to work during a busy clinic day.</li>
              <li>It has to work when staffing is short.</li>
              <li>It has to work when the report is due.</li>
              <li>It has to work when leadership needs answers.</li>
              <li>It has to work when an auditor asks, "Show me."</li>
            </ul>
            <p>
              My focus is helping FQHCs build the kind of systems that hold up under pressure: clear workflows,
              accurate documentation, accountable follow-up, practical dashboards, and quality processes that
              make sense to the people actually doing the work.
            </p>
            <p>Because strong quality leadership is not just about knowing the measure.</p>
            <p className="not-italic font-bold text-foreground text-xl">
              It is about building the system that makes the measure true.
            </p>
          </blockquote>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/auth?signup=true">Start 14-day free trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/contact">Contact Jessica</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
