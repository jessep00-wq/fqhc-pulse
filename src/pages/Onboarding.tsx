import { useState, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { Loader2, Building2, ShieldCheck, FlaskConical, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { readPlanIntent, clearPlanIntent } from "@/lib/planIntent";
import { trackAnonEvent } from "@/lib/trackEvent";
import { getStripeEnvironment } from "@/lib/stripe";

const ORG_TYPES = ["FQHC", "FQHC Look-Alike", "RHC", "Other"];
const REPORTING_PERIODS = [
  "Calendar Year (Jan–Dec)",
  "Fiscal Year (Jul–Jun)",
  "HRSA UDS (Jan–Dec)",
];

// A small curated list — users with anything else can use "Other (UTC)".
const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Puerto_Rico",
  "UTC",
];

type DataMode = "demo" | "live";

export default function Onboarding() {
  const { user, session, loading: authLoading } = useAuth();
  const { hasOrg, loading: orgLoading } = useOrg();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — Organization Profile
  const [name, setName] = useState("");
  const [npi, setNpi] = useState("");
  const [orgType, setOrgType] = useState("");
  const [reportingPeriod, setReportingPeriod] = useState("");
  const [qualityLeadName, setQualityLeadName] = useState("");
  const [qualityLeadEmail, setQualityLeadEmail] = useState(user?.email ?? "");
  const detectedTz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; }
  }, []);
  const [timezone, setTimezone] = useState(
    TIMEZONES.includes(detectedTz) ? detectedTz : "UTC"
  );

  // Step 2 — Data Governance
  const [dataMode, setDataMode] = useState<DataMode>("demo");
  const [acknowledged, setAcknowledged] = useState(false);

  if (authLoading || orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  // Audit fix 21: onboarding lives at a public route — explicitly bounce
  // unauthenticated visitors to /auth instead of silently no-op'ing on submit.
  if (!session) return <Navigate to="/auth" replace />;
  if (hasOrg) return <Navigate to="/dashboard" replace />;

  const step1Valid =
    name.trim().length > 0 &&
    orgType !== "" &&
    reportingPeriod !== "" &&
    qualityLeadName.trim().length > 0 &&
    qualityLeadEmail.trim().length > 0 &&
    timezone !== "";

  const step2Valid = acknowledged;

  const handleSubmit = async () => {
    if (!user || !step1Valid || !step2Valid) return;
    setLoading(true);
    try {
      const orgId = crypto.randomUUID();

      const { error: orgError } = await supabase.from("organizations").insert({
        id: orgId,
        name: name.trim(),
        npi: npi.trim() || null,
        owner_id: user.id,
        org_type: orgType,
        reporting_period: reportingPeriod,
        quality_lead_name: qualityLeadName.trim(),
        quality_lead_email: qualityLeadEmail.trim(),
        timezone,
        data_mode: dataMode,
      });
      if (orgError) throw orgError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ organization_id: orgId })
        .eq("id", user.id);
      if (profileError) {
        // Audit fix 26: roll back the orphan org row so the user can retry
        // without colliding with their own per-owner cap (item 14).
        await supabase.from("organizations").delete().eq("id", orgId);
        throw profileError;
      }

      if (dataMode === "demo") {
        await supabase.rpc("seed_demo_data", { org_id: orgId });
      }

      const intent = readPlanIntent();
      trackAnonEvent("onboarding_completed", {
        organization_id: orgId,
        priceId: intent?.priceId,
      });

      // If the user came from /pricing with a plan intent, kick straight
      // into Stripe checkout instead of the dashboard onboarding checklist.
      if (intent?.priceId) {
        try {
          const { data, error } = await supabase.functions.invoke(
            "create-subscription-checkout",
            { body: { priceId: intent.priceId, environment: getStripeEnvironment() } }
          );
          if (error) throw error;
          if (data?.url) {
            trackAnonEvent("checkout_started", {
              priceId: intent.priceId,
              organization_id: orgId,
            });
            clearPlanIntent();
            window.location.href = data.url as string;
            return;
          }
          throw new Error("No checkout URL returned");
        } catch (e) {
          console.warn("Checkout launch failed; falling back to dashboard", e);
          clearPlanIntent();
          toast.error("Couldn't launch checkout — opening your dashboard instead.");
        }
      }

      toast.success(
        dataMode === "demo"
          ? "Demo workspace ready! Redirecting…"
          : "Live workspace created. Redirecting…"
      );
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      console.error("Onboarding error:", err);
      toast.error((err as { message?: string })?.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-3">
          <Logo size="md" className="justify-center" />
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                  toast.error(error.message);
                  return;
                }
                navigate("/auth", { replace: true });
              }}
              className="text-primary hover:text-primary/80 underline font-medium"
            >
              Sign in
            </button>
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className={step === 1 ? "font-semibold text-primary" : ""}>1 · Organization Profile</span>
            <span>›</span>
            <span className={step === 2 ? "font-semibold text-primary" : ""}>2 · Data Governance</span>
          </div>
          <CardTitle className="text-xl">
            {step === 1 ? "Tell us about your health center" : "Choose how you'll start"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "We use these details to align reporting periods, time zones, and accountability."
              : "Demo Mode seeds sample data for evaluation. Live Mode starts with an empty, production-grade workspace."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 ? (
            <form
              onSubmit={(e) => { e.preventDefault(); if (step1Valid) setStep(2); }}
              className="space-y-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name *</Label>
                  <Input
                    id="org-name"
                    placeholder="e.g., Springfield Community Health"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-npi">NPI (optional)</Label>
                  <Input
                    id="org-npi"
                    placeholder="10-digit NPI"
                    value={npi}
                    onChange={(e) => setNpi(e.target.value)}
                    maxLength={10}
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Organization Type *</Label>
                  <Select value={orgType} onValueChange={setOrgType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {ORG_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reporting Period *</Label>
                  <Select value={reportingPeriod} onValueChange={setReportingPeriod}>
                    <SelectTrigger><SelectValue placeholder="Select reporting period" /></SelectTrigger>
                    <SelectContent>
                      {REPORTING_PERIODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ql-name">Primary Quality Lead *</Label>
                  <Input
                    id="ql-name"
                    placeholder="Full name"
                    value={qualityLeadName}
                    onChange={(e) => setQualityLeadName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ql-email">Quality Lead Email *</Label>
                  <Input
                    id="ql-email"
                    type="email"
                    placeholder="lead@yourchc.org"
                    value={qualityLeadEmail}
                    onChange={(e) => setQualityLeadEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Timezone *</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Detected: {detectedTz}</p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={!step1Valid}>
                  Continue <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <RadioGroup
                value={dataMode}
                onValueChange={(v) => setDataMode(v as DataMode)}
                className="grid gap-3"
              >
                <label
                  htmlFor="mode-demo"
                  className={`flex gap-3 rounded-md border p-4 cursor-pointer transition ${
                    dataMode === "demo" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <RadioGroupItem value="demo" id="mode-demo" className="mt-1" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-semibold">
                      <FlaskConical className="h-4 w-4 text-amber-600" />
                      Demo Mode
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded">
                        Recommended for evaluation
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Seeds fictional UDS trends, PDSA cycles, and tasks so you can explore every feature. Dashboards display a "DEMO" watermark and exports require confirmation.
                    </p>
                  </div>
                </label>
                <label
                  htmlFor="mode-live"
                  className={`flex gap-3 rounded-md border p-4 cursor-pointer transition ${
                    dataMode === "live" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <RadioGroupItem value="live" id="mode-live" className="mt-1" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-semibold">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Live Mode
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Starts with an empty workspace ready for real HRSA-grade data. No sample records, no watermarks, exports are submission-ready.
                    </p>
                  </div>
                </label>
              </RadioGroup>

              {dataMode === "demo" && (
                <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>
                    Demo data is for evaluation only. You can switch this workspace to Live Mode at any time in <strong>Settings → Facility</strong>.
                  </p>
                </div>
              )}

              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={acknowledged}
                  onCheckedChange={(v) => setAcknowledged(v === true)}
                  className="mt-0.5"
                />
                <span>
                  I understand that demo data is for evaluation only and must not be used for HRSA submissions, board reporting, or any external use.
                </span>
              </label>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={handleSubmit} disabled={!step2Valid || loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</>
                  ) : (
                    <><Building2 className="h-4 w-4 mr-2" />Create Workspace</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
