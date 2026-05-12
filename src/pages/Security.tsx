import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Database, Users, Server, AlertTriangle, FileCheck } from "lucide-react";
import { SEO } from "@/components/SEO";

const sections = [
  {
    icon: Lock,
    title: "Encryption in transit and at rest",
    body: "All traffic to MeasureWise is encrypted with TLS 1.2+. Data at rest is encrypted with AES-256 on managed Postgres infrastructure (AWS us-east via Supabase). Database backups are encrypted using the same standard.",
  },
  {
    icon: Database,
    title: "Tenant isolation (Row-Level Security)",
    body: "Every table that holds organization data has Postgres Row-Level Security policies scoped by organization_id. Users cannot read, write, or even count rows belonging to another health center — enforced at the database layer, not just in application code.",
  },
  {
    icon: Shield,
    title: "PHI posture: aggregate UDS data only",
    body: "MeasureWise stores aggregate UDS measure values, PDSA cycle notes, and quality-improvement workflow data. We do not store patient-level Protected Health Information (PHI) — no MRNs, no patient names, no clinical details about identifiable individuals. Because we do not handle PHI, MeasureWise does not require a HIPAA Business Associate Agreement (BAA) for standard use.",
  },
  {
    icon: Users,
    title: "Authentication and access control",
    body: "Email verification is required before sign-in. Passwords must meet complexity requirements and are checked against the Have I Been Pwned database. Optional Google SSO is available. Inside each organization, access is governed by role-based permissions (org admin, standard user).",
  },
  {
    icon: Server,
    title: "Backups and recovery",
    body: "The database is backed up automatically every day with 7-day point-in-time recovery. Backups are stored encrypted in a separate region.",
  },
  {
    icon: FileCheck,
    title: "Subprocessors",
    body: "Supabase (database, auth, storage), Stripe (payments), Resend (transactional email), Lovable AI Gateway (AI Quality Assistant). We do not sell or share your data with third parties for marketing.",
  },
  {
    icon: AlertTriangle,
    title: "Incident reporting",
    body: "If you believe you've found a security issue, email support@measurewise.org with the subject line \"Security\". We acknowledge security reports within 1 business day.",
  },
];

export default function Security() {
  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <SEO
        title="Security & Compliance — MeasureWise"
        description="How MeasureWise protects FQHC quality data: TLS 1.2+, AES-256, Row-Level Security tenant isolation, aggregate UDS data only (no PHI)."
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
            <a href="mailto:support@measurewise.org" className="text-primary hover:underline">
              support@measurewise.org
            </a>{" "}
            and we'll respond within 1 business day.
          </p>
        </div>
      </div>
    </div>
  );
}
