import { useState } from "react";
import confetti from "canvas-confetti";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2, CheckCircle2 } from "lucide-react";
import { isBusinessEmail } from "@/lib/businessEmail";
import { trackEvent } from "@/lib/trackEvent";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  "QI Director",
  "Compliance / Survey Lead",
  "Operations Manager",
  "Provider",
  "Other",
] as const;

const PLAYBOOK_URL =
  "/downloads/MeasureWise_AthenaOne_Optimization_Playbook.pdf";

const Schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(120),
  work_email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .max(255)
    .refine(isBusinessEmail, "Please use your work email (no personal inboxes)"),
  health_center_name: z
    .string()
    .trim()
    .min(2, "Health center name is required")
    .max(160),
  role: z.enum(ROLE_OPTIONS),
});

type FormState = z.infer<typeof Schema>;

interface PlaybookLeadFormProps {
  variant?: "section" | "dialog" | "sidebar";
  surface: string;
  className?: string;
  onSubmitted?: () => void;
}

const SUBMITTED_KEY = "playbook_lead_submitted";

function fireConfetti() {
  const end = Date.now() + 600;
  const colors = ["#1f8a9a", "#0d5563", "#e8b84a", "#ffffff"];
  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.7 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function PlaybookLeadForm({
  variant = "section",
  surface,
  className,
  onSubmitted,
}: PlaybookLeadFormProps) {
  const [form, setForm] = useState<FormState>({
    full_name: "",
    work_email: "",
    health_center_name: "",
    role: "QI Director",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const compact = variant === "sidebar";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      const next: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormState;
        if (!next[k]) next[k] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "capture-playbook-lead",
        { body: { ...parsed.data, surface } },
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      try {
        localStorage.setItem(SUBMITTED_KEY, "1");
      } catch {
        // ignore storage failures
      }
      trackEvent("playbook_lead_submit", { surface, role: parsed.data.role });
      setSubmitted(true);
      fireConfetti();
      onSubmitted?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className={cn("space-y-4 text-center", className)}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden />
        </div>
        <div className="space-y-1.5">
          <h3 className={cn("font-bold text-foreground", compact ? "text-lg" : "text-2xl")}>
            Thank you — your playbook is ready.
          </h3>
          <p className="text-sm text-muted-foreground">
            We've also emailed a copy so you can share it with your team.
          </p>
        </div>
        <Button asChild size={compact ? "default" : "lg"} className="w-full font-semibold">
          <a href={PLAYBOOK_URL} download>
            <Download className="mr-2 h-4 w-4" /> Download Now
          </a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-3", className)} noValidate>
      <div className="space-y-1.5">
        <Label htmlFor={`pl-name-${surface}`}>Full Name</Label>
        <Input
          id={`pl-name-${surface}`}
          autoComplete="name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          aria-invalid={!!errors.full_name}
          required
        />
        {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`pl-email-${surface}`}>Work Email</Label>
        <Input
          id={`pl-email-${surface}`}
          type="email"
          autoComplete="email"
          value={form.work_email}
          onChange={(e) => setForm({ ...form, work_email: e.target.value })}
          aria-invalid={!!errors.work_email}
          required
        />
        {errors.work_email && <p className="text-xs text-destructive">{errors.work_email}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`pl-org-${surface}`}>Health Center Name</Label>
        <Input
          id={`pl-org-${surface}`}
          autoComplete="organization"
          value={form.health_center_name}
          onChange={(e) => setForm({ ...form, health_center_name: e.target.value })}
          aria-invalid={!!errors.health_center_name}
          required
        />
        {errors.health_center_name && (
          <p className="text-xs text-destructive">{errors.health_center_name}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`pl-role-${surface}`}>Role</Label>
        <Select
          name={`pl-role-${surface}`}
          value={form.role}
          onValueChange={(v) => setForm({ ...form, role: v as FormState["role"] })}
        >
          <SelectTrigger id={`pl-role-${surface}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {serverError && <p className="text-xs text-destructive">{serverError}</p>}

      <Button
        type="submit"
        size={compact ? "default" : "lg"}
        disabled={submitting}
        className="w-full font-semibold"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" /> Get the Playbook
          </>
        )}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">
        We'll email a copy. No spam — unsubscribe anytime.
      </p>
    </form>
  );
}
