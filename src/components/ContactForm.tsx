import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send, CheckCircle } from "lucide-react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          to: email,
          subject: "We received your message — MeasureWise",
          html: `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8fafb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafb;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
<tr><td style="background:#1a8a8a;padding:24px 32px;"><h1 style="margin:0;color:#fff;font-size:22px;">MeasureWise™</h1></td></tr>
<tr><td style="padding:32px;">
<h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Thanks for reaching out${name ? `, ${name}` : ""}!</h2>
<p style="color:#374151;line-height:1.6;margin:0 0 16px;">We've received your message and our team will get back to you within 1 business day.</p>
<p style="color:#374151;line-height:1.6;margin:0 0 16px;">In the meantime, feel free to explore MeasureWise with a free account — no credit card required.</p>
<a href="https://measurewise.org/auth?signup=true" style="display:inline-block;background:#1a8a8a;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">Try MeasureWise Free</a>
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;"><p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} MeasureWise. All rights reserved.</p></td></tr>
</table></td></tr></table></body></html>`,
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Message sent! Check your inbox for a confirmation.");
    } catch (err) {
      console.error("Contact form error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-8 space-y-3">
        <CheckCircle className="h-12 w-12 text-accent mx-auto" />
        <h3 className="text-xl font-semibold text-foreground">Message Sent!</h3>
        <p className="text-muted-foreground text-sm">
          We'll get back to you within 1 business day. Check your email for a confirmation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            maxLength={100}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@clinic.org"
            maxLength={255}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your FQHC and what you're looking for..."
          rows={4}
          maxLength={1000}
          required
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        Send Message
      </Button>
    </form>
  );
}
