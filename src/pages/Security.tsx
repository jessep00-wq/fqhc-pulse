import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Database, Users, Server, AlertTriangle, FileCheck } from "lucide-react";
import { SEO } from "@/components/SEO";
import {
  ENCRYPTION_AT_REST,
  PHI_BOUNDARY_SECURITY_PARAGRAPH,
  TLS_IN_TRANSIT,
  VENDOR_SOC2,
} from "@/lib/siteContent";

const sections = [
  {
    icon: Lock,
    title: "Encryption in transit and at rest",
    body: `All traffic to MeasureWise is encrypted with ${TLS_IN_TRANSIT}. Data at rest uses ${ENCRYPTION_AT_REST} on managed Postgres infrastructure (AWS us-east). Database backups are encrypted using the same standard.`,
  },
  {
    icon: Database,
    title: "Tenant isolation (Row-Level Security)",
    body: "Every table that holds organization data has Postgres Row-Level Security policies scoped by organization_id. Users cannot read, write, or even count rows belonging to another health center — enforced at the database layer, not just in application code.",
  },
  {
    icon: Shield,
    title: "Data boundary: no PHI",
    body: PHI_BOUNDARY_SECURITY_PARAGRAPH,
  },
  {
    icon: Users,
    title: "Authentication and access control",
    body: "Email verification is required before sign-in. Passwords must meet complexity requirements and are checked against the Have I Been Pwned database. Optional Google SSO is available. Inside each organization, access is governed by role-based access controls (org admin, standard user).",
  },
  {
    icon: Server,
    title: "Hosting and backups",
    body: `${VENDOR_SOC2.enabled ? `${VENDOR_SOC2.label}. ` : ""}MeasureWise itself does not hold a SOC 2 certification. The database is backed up automatically every day with 7-day point-in-time recovery, and backups are stored encrypted.`,
  },
  {
    icon: FileCheck,
    title: "Subprocessors",
    body: "Managed Postgres and authentication hosting, Stripe (payments), Resend (transactional email), and Lovable AI Gateway (AI Quality Assistant). We do not sell or share your data with third parties for marketing.",
  },
  {
    icon: AlertTriangle,
    title: "Incident reporting",
    body: "If you believe you've found a security issue, email hello@measurewise.org with the subject line \"Security\". We acknowledge security reports within 1 business day.",
  },
];


export default function Security() {
  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <SEO
        title="Security & Data Handling | MeasureWise"
        description="How MeasureWise protects FQHC quality data: TLS 1.2+ in transit, AES-256 at rest, Row-Level Security tenant isolation, and a no-PHI data boundary."
        canonical="https://measurewise.org/security"
      />
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" asChild className="mb-8">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Security &amp; Compliance</h1>
        <p className="text-sm text-muted-foreground mb-8">
          How we protect your health center's quality-improvement data.
        </p>

        <div className="space-y-6">
          {sections.map((s) => (
            <div key={s.title} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <s.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1.5">{s.title}</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm">{s.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-primary/20 bg-primary/5 p-5 text-sm text-foreground">
          <p className="font-semibold mb-1">Security questions or vendor-review questionnaires?</p>
          <p className="text-muted-foreground">
            Email{" "}
            <a href="mailto:hello@measurewise.org" className="text-primary hover:underline">
              hello@measurewise.org
            </a>{" "}
            and we'll respond within 1 business day.
          </p>
        </div>
      </div>
    </div>
  );
}
