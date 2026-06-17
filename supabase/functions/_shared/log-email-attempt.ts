// Shared helper to record a Resend send attempt into `email_send_log`.
// Service-role policy on the table allows inserts from edge functions only.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type LogArgs = {
  supabase: SupabaseClient;
  messageId: string;
  templateName: string;
  recipient: string;
  resendResponse: Response;
  resendBody: string;
  metadata?: Record<string, unknown>;
};

/**
 * Logs one Resend send attempt. Best-effort — never throws.
 * Status is "sent" on 2xx, "failed" otherwise.
 */
export async function logEmailAttempt({
  supabase,
  messageId,
  templateName,
  recipient,
  resendResponse,
  resendBody,
  metadata = {},
}: LogArgs): Promise<void> {
  try {
    const ok = resendResponse.ok;
    let parsed: Record<string, unknown> | null = null;
    try { parsed = resendBody ? JSON.parse(resendBody) : null; } catch { /* keep raw */ }

    const resendId = parsed && typeof parsed === "object" && "id" in parsed
      ? String((parsed as { id?: unknown }).id ?? "")
      : "";

    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: recipient,
      status: ok ? "sent" : "failed",
      error_message: ok ? null : `Resend ${resendResponse.status}: ${resendBody.slice(0, 1000)}`,
      metadata: {
        ...metadata,
        resend_status: resendResponse.status,
        resend_id: resendId || null,
        resend_body: parsed ?? resendBody.slice(0, 2000),
      },
    });
  } catch (err) {
    console.error("logEmailAttempt failed (non-blocking)", err);
  }
}

export async function logEmailException({
  supabase,
  messageId,
  templateName,
  recipient,
  error,
  metadata = {},
}: {
  supabase: SupabaseClient;
  messageId: string;
  templateName: string;
  recipient: string;
  error: unknown;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: recipient,
      status: "failed",
      error_message: `Exception: ${(error as Error)?.message ?? String(error)}`.slice(0, 1000),
      metadata: { ...metadata, exception: true },
    });
  } catch (err) {
    console.error("logEmailException failed (non-blocking)", err);
  }
}
