import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <SEO
        title="Terms of Service — MeasureWise"
        description="MeasureWise Terms of Service governing use of our FQHC quality operations platform, subscriptions, and content."
        canonical="https://measurewise.org/terms"
      />
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" asChild className="mb-8">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 31, 2026</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <section>
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using MeasureWise ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. MeasureWise is a quality improvement management platform designed for Federally Qualified Health Centers (FQHCs) and community health organizations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              MeasureWise provides tools for managing PDSA cycles, tracking UDS clinical quality measures, generating SPC analytics, and accessing quality improvement playbooks. The Service is intended for quality improvement (QI) purposes and is not a clinical decision support system or electronic health record (EHR).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Data Handling</h2>
            <p className="text-muted-foreground leading-relaxed">
              MeasureWise is designed for operational and quality-improvement workflows using aggregate, de-identified, or non-patient-identifying information. MeasureWise is not intended to collect, store, transmit, or process Protected Health Information (PHI), and a Business Associate Agreement (BAA) is not offered or required. Users must not enter patient-identifying information into the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to use the Service only for lawful purposes related to quality improvement activities. You may not use the Service to store, transmit, or process individually identifiable health information without a separate agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              MeasureWise is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service. The Service does not provide medical advice and should not be used as a substitute for professional clinical judgment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, please contact the MeasureWise team through your organization's administrator.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
