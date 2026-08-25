import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <SEO
        title="Privacy Policy — MeasureWise"
        description="How MeasureWise collects, uses, and protects information. Aggregate UDS data only — no PHI stored."
        canonical="https://measurewise.org/privacy"
      />
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" asChild className="mb-8">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 31, 2026</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <section>
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              MeasureWise ("we", "our", "the Service") is committed to protecting the privacy of our users. This Privacy Policy explains how we collect, use, and safeguard information when you use our quality improvement management platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Account Information:</strong> Name, email address, staff role, and organizational affiliation provided during registration.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Quality Improvement Data:</strong> PDSA cycle details, aggregate UDS measure data, task assignments, and playbook usage. This data should be aggregate/de-identified and not contain individually identifiable patient information.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Usage Data:</strong> Log data, browser type, and feature usage analytics to improve the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. PHI Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              MeasureWise is designed for operational and quality-improvement workflows using aggregate, de-identified, or non-patient-identifying information. MeasureWise is not intended to collect, store, transmit, or process Protected Health Information (PHI) as defined by HIPAA, and a Business Associate Agreement (BAA) is not offered or required. Users must not enter patient-identifying information into the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. How We Use Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use collected information to provide and improve the Service, authenticate users, manage organizational access, and generate quality improvement analytics. We do not sell user data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures including encryption in transit (TLS), encrypted storage, role-based access controls, and regular security assessments. Data is isolated by organization to prevent cross-tenant access.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide the Service. You may request deletion of your account and associated data by contacting your organization's administrator.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify users of material changes via email or in-app notification.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related questions or data requests, please contact the MeasureWise team through your organization's administrator.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
