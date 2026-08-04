import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send, CheckCircle } from "lucide-react";

const ROLES = [
  "Quality Director / Manager",
  "PCMH Coordinator",
  "COO / Operations",
  "CMO / Medical Director",
  "CFO / Finance",
  "CEO / Executive Director",
  "Other",
];

const FQHC_SIZES = [
  "Under 5,000 patients/yr",
  "5,000 – 15,000",
  "15,000 – 30,000",
  "30,000 – 60,000",
  "60,000+",
];

const SITE_COUNTS = ["1", "2 – 3", "4 – 10", "11+"];

const EMRS = [
  "Athenahealth",
  "Epic",
  "OCHIN Epic",
  "eClinicalWorks",
  "NextGen",
  "Cerner / Oracle Health",
  "Greenway",
  "Other",
];

const INTERESTS = [
  "UDS measure tracking",
  "PCMH evidence",
  "HRSA Audit Binder",
  "PDSA cycles",
  "SPC charts",
  "Pricing question",
  "Product demo",
];

const TIMELINES = [
  "Right now",
  "This quarter",
  "Next 6 months",
  "Just exploring",
];

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  organizationName: z.string().trim().min(1, "Organization is required").max(120),
  role: z.string().min(1, "Select your role"),
  fqhcSize: z.string().optional(),
  numberOfSites: z.string().optional(),
  emr: z.string().optional(),
  emrOther: z.string().max(80).optional(),
  interests: z.array(z.string()).optional(),
  timeline: z.string().optional(),
  message: z.string().trim().max(1500).optional(),
});

type FormState = z.infer<typeof contactSchema>;

const INITIAL: FormState = {
  name: "",
  email: "",
  organizationName: "",
  role: "",
  fqhcSize: "",
  numberOfSites: "",
  emr: "",
  emrOther: "",
  interests: [],
  timeline: "",
  message: "",
};

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleInterest = (interest: string) => {
    const current = form.interests || [];
    update(
      "interests",
      current.includes(interest)
        ? current.filter((i) => i !== interest)
        : [...current, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "Please complete the required fields.");
      return;
    }

    // Require at least a message OR an interest selection so we have context.
    if (!parsed.data.message?.trim() && (!parsed.data.interests || parsed.data.interests.length === 0)) {
      toast.error("Tell us what you're interested in or include a short message.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("contact-form", {
        body: parsed.data,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Message sent! Check your inbox for a confirmation.");
    } catch (err) {
      // Audit fix 35: dev-only logging — production should fail silently
      // to the user-facing toast below.
      if (import.meta.env.DEV) console.error("Contact form error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-8 space-y-3">
        <CheckCircle className="h-12 w-12 text-accent mx-auto" />
        <h3 className="text-xl font-semibold text-foreground">Message Sent</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Thanks — we'll reply within 1 business day. Check your email for a confirmation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name *</Label>
          <Input
            id="contact-name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Jane Smith"
            maxLength={100}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Work email *</Label>
          <Input
            id="contact-email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="jane@clinic.org"
            maxLength={255}
            required
          />
        </div>
      </div>

      {/* Organization */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact-org">Health center / Organization *</Label>
          <Input
            id="contact-org"
            value={form.organizationName}
            onChange={(e) => update("organizationName", e.target.value)}
            placeholder="Valley Community Health Center"
            maxLength={120}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-role">Your role *</Label>
          <Select name="role" value={form.role} onValueChange={(v) => update("role", v)}>
            <SelectTrigger id="contact-role">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* FQHC profile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact-size">Patient panel size</Label>
          <Select name="fqhcSize" value={form.fqhcSize} onValueChange={(v) => update("fqhcSize", v)}>
            <SelectTrigger id="contact-size">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              {FQHC_SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-sites">Number of sites</Label>
          <Select name="numberOfSites" value={form.numberOfSites} onValueChange={(v) => update("numberOfSites", v)}>
            <SelectTrigger id="contact-sites">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              {SITE_COUNTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact-emr">EMR / EHR system</Label>
          <Select name="emr" value={form.emr} onValueChange={(v) => update("emr", v)}>
            <SelectTrigger id="contact-emr">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              {EMRS.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {form.emr === "Other" && (
          <div className="space-y-2">
            <Label htmlFor="contact-emr-other">EMR name</Label>
            <Input
              id="contact-emr-other"
              value={form.emrOther}
              onChange={(e) => update("emrOther", e.target.value)}
              placeholder="Which system?"
              maxLength={80}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="contact-timeline">Timeline</Label>
          <Select name="timeline" value={form.timeline} onValueChange={(v) => update("timeline", v)}>
            <SelectTrigger id="contact-timeline">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              {TIMELINES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Interests */}
      <fieldset className="space-y-2 border-0 p-0 m-0">
        <legend className="text-sm font-medium text-foreground">
          What are you interested in? (select all that apply)
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {INTERESTS.map((interest) => {
            const id = `interest-${interest.replace(/\s+/g, "-")}`;
            const checked = form.interests?.includes(interest) ?? false;
            return (
              <label
                key={interest}
                htmlFor={id}
                className="flex items-center gap-2 text-sm text-foreground cursor-pointer rounded-md border border-border px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={() => toggleInterest(interest)}
                />
                <span>{interest}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Message */}
      <div className="space-y-2">
        <Label htmlFor="contact-message">Anything else? (optional)</Label>
        <Textarea
          id="contact-message"
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Tell us more about your QI program, current challenges, or specific questions…"
          rows={4}
          maxLength={1500}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send message
        </Button>
        <p className="text-xs text-muted-foreground">
          We reply within 1 business day. By submitting, you agree to our{" "}
          <Link to="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
