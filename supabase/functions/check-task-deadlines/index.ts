import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { logEmailAttempt } from "../_shared/log-email-attempt.ts";
import { taskDeadlineEmail } from "../_shared/email-templates.ts";
import { verifyCronSecret } from "../_shared/verify-cron.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!(await verifyCronSecret(req, supabase))) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const today = new Date().toISOString().split("T")[0];

    const { data: urgentTasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, due_date, status, assigned_role, organization_id, pdsa_cycles(title)")
      .in("status", ["pending", "in_progress"])
      .not("due_date", "is", null)
      .lte("due_date", twoDaysFromNow.toISOString().split("T")[0])
      .order("due_date", { ascending: true });

    if (tasksError) throw new Error(`Tasks query error: ${tasksError.message}`);
    if (!urgentTasks || urgentTasks.length === 0) {
      return new Response(JSON.stringify({ message: "No urgent tasks found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tasksByOrg: Record<string, typeof urgentTasks> = {};
    for (const task of urgentTasks) {
      if (!tasksByOrg[task.organization_id]) tasksByOrg[task.organization_id] = [];
      tasksByOrg[task.organization_id].push(task);
    }

    let emailsSent = 0;

    for (const [orgId, orgTasks] of Object.entries(tasksByOrg)) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, organization_id")
        .eq("organization_id", orgId)
        .eq("staff_role", "QI Manager");

      if (!profiles || profiles.length === 0) continue;

      for (const profile of profiles) {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
        if (!authUser?.user?.email) continue;

        const formattedTasks = orgTasks.map((t) => ({
          title: t.title,
          dueDate: t.due_date!,
          status: t.due_date! < today ? "overdue" : "due soon",
          cycleName: (t as any).pdsa_cycles?.title,
        }));

        const email = taskDeadlineEmail(profile.full_name || "", formattedTasks);

        const response = await fetch(`${GATEWAY_URL}/emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
          },
          body: JSON.stringify({
            from: "MeasureWise <hello@measurewise.org>",
            to: [authUser.user.email],
            subject: email.subject,
            html: email.html,
          }),
        });

        const rawBody = await response.text();
        await logEmailAttempt({
          supabase,
          messageId: `task-deadline-${profile.id}-${today}`,
          templateName: "task-deadline-reminder",
          recipient: authUser.user.email,
          resendResponse: response,
          resendBody: rawBody,
          metadata: { profile_id: profile.id, task_count: formattedTasks.length },
        });

        if (response.ok) emailsSent++;
        else console.error(`Failed to send deadline email:`, rawBody);
      }
    }

    return new Response(JSON.stringify({ success: true, emailsSent }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Task deadline check error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
