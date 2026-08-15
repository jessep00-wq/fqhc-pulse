import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { BRAND, fromAddress } from "../_shared/brand.ts";
import { teamInviteEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = (await req.json()) as { action?: string; email?: string; token?: string };
    const action = body.action ?? "send";

    // ---------------------------------------------------------------- SEND
    if (action === "send") {
      const email = (body.email ?? "").trim().toLowerCase();
      if (!email || !email.includes("@") || email.length > 320) {
        return json({ error: "A valid email address is required" }, 400);
      }

      const { data: profile } = await admin
        .from("profiles")
        .select("organization_id, full_name")
        .eq("id", user.id)
        .maybeSingle();

      const orgId = profile?.organization_id;
      if (!orgId) return json({ error: "You must belong to a workspace to invite people" }, 403);

      const { data: isAdmin } = await admin.rpc("is_org_admin", { _user_id: user.id });
      if (!isAdmin) return json({ error: "Only a workspace admin can invite team members" }, 403);

      const { data: org } = await admin
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .maybeSingle();

      // Reuse a live pending invite, otherwise create one.
      const { data: existing } = await admin
        .from("team_invitations")
        .select("id, token, expires_at, status")
        .eq("organization_id", orgId)
        .eq("email", email)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      let token = existing?.token as string | undefined;
      let inviteId = existing?.id as string | undefined;

      if (!inviteId) {
        const { data: created, error: insErr } = await admin
          .from("team_invitations")
          .insert({ organization_id: orgId, email, invited_by: user.id, status: "pending" })
          .select("id, token")
          .single();
        if (insErr) return json({ error: insErr.message }, 400);
        token = created.token;
        inviteId = created.id;
      }

      const acceptUrl = `${BRAND.url}/invite/${token}`;
      const { subject, html } = teamInviteEmail(
        org?.name ?? "your health center",
        profile?.full_name ?? "",
        acceptUrl,
      );

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (!LOVABLE_API_KEY || !RESEND_API_KEY) return json({ error: "Email is not configured" }, 500);

      const res = await fetch(`${GATEWAY_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({ from: fromAddress("hello"), to: [email], subject, html }),
      });
      const sendData = await res.json();
      if (!res.ok) {
        console.error("team-invite send failed", res.status, sendData);
        return json({ error: "Invitation saved, but the email could not be sent." }, 502);
      }

      await admin
        .from("team_invitations")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", inviteId);

      return json({ success: true, acceptUrl });
    }

    // -------------------------------------------------------------- ACCEPT
    if (action === "accept") {
      const token = (body.token ?? "").trim();
      if (!token) return json({ error: "Missing invitation token" }, 400);

      const { data: invite } = await admin
        .from("team_invitations")
        .select("id, organization_id, email, expires_at, accepted_at")
        .eq("token", token)
        .maybeSingle();

      if (!invite) return json({ error: "This invitation link is not valid." }, 404);
      if (invite.accepted_at) return json({ error: "This invitation has already been used." }, 409);
      if (new Date(invite.expires_at) < new Date()) {
        return json({ error: "This invitation has expired. Ask for a new one." }, 410);
      }
      if ((user.email ?? "").toLowerCase() !== invite.email.toLowerCase()) {
        return json(
          { error: `This invitation was sent to ${invite.email}. Sign in with that address to accept.` },
          403,
        );
      }

      const { data: profile } = await admin
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.organization_id && profile.organization_id !== invite.organization_id) {
        return json({ error: "You already belong to another workspace." }, 409);
      }

      if (!profile?.organization_id) {
        const { error: updErr } = await admin
          .from("profiles")
          .update({ organization_id: invite.organization_id })
          .eq("id", user.id);
        if (updErr) return json({ error: updErr.message }, 400);
      }

      await admin
        .from("team_invitations")
        .update({ status: "accepted", accepted_at: new Date().toISOString(), accepted_by: user.id })
        .eq("id", invite.id);

      return json({ success: true, organizationId: invite.organization_id });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("team-invite error", err);
    return json({ error: "Unexpected error" }, 500);
  }
});
