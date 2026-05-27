// Stripe webhook handler. Fulfills storefront orders (single- and multi-item),
// syncs SaaS subscriptions, and sends branded confirmation emails.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  createStripeClient,
  getWebhookSecret,
  type StripeEnv,
} from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

// ─────────────────────────────  Storefront fulfillment  ─────────────────────────────

interface CartLine {
  kind: "product" | "bundle";
  slug: string;
  catalog_id: string;
  lookup_key: string;
}

async function fulfillOrder(env: StripeEnv, sessionId: string) {
  const stripe = createStripeClient(env);
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  });

  const meta = session.metadata ?? {};
  const customerEmail =
    session.customer_details?.email ?? session.customer_email ?? "";

  if (!customerEmail) {
    console.error("Missing email on session", sessionId);
    return;
  }

  // Watermarked-manual flow: provision a one-time download token instead of signed URLs.
  if (meta.delivery === "watermarked_manual") {
    await provisionManualDownload(env, session, customerEmail);
    return;
  }



  // Parse cart items (multi-item) — fall back to single-item legacy metadata.
  let cartLines: CartLine[] = [];
  if (meta.cart_items) {
    try {
      cartLines = JSON.parse(meta.cart_items as string);
    } catch (err) {
      console.warn("cart_items parse failed", err);
    }
  }
  if (cartLines.length === 0) {
    const kind = meta.kind as "product" | "bundle" | undefined;
    const catalogId = meta.catalog_id as string | undefined;
    const slug = meta.slug as string | undefined;
    const lookupKey = meta.lookup_key as string | undefined;
    if (!kind || !catalogId || !slug) {
      console.error("Missing metadata on session", sessionId, meta);
      return;
    }
    cartLines = [{ kind, slug, catalog_id: catalogId, lookup_key: lookupKey ?? "" }];
  }

  const productIds: string[] = [];
  const bundleIds: string[] = [];
  const filePaths: string[] = [];
  const displayNames: string[] = [];

  for (const line of cartLines) {
    if (line.kind === "product") {
      productIds.push(line.catalog_id);
      const { data } = await supabase
        .from("store_products")
        .select("name, included_file_paths")
        .eq("id", line.catalog_id)
        .maybeSingle();
      if (data) {
        displayNames.push(data.name as string);
        filePaths.push(...(((data.included_file_paths as string[] | null) ?? [])));
      }
    } else {
      bundleIds.push(line.catalog_id);
      const { data: bundle } = await supabase
        .from("store_bundles")
        .select("name, included_product_ids")
        .eq("id", line.catalog_id)
        .maybeSingle();
      if (bundle) {
        displayNames.push(bundle.name as string);
        const includedIds = ((bundle.included_product_ids as string[] | null) ?? []);
        if (includedIds.length) {
          const { data: products } = await supabase
            .from("store_products")
            .select("included_file_paths")
            .in("id", includedIds);
          for (const p of products ?? []) {
            filePaths.push(...(((p.included_file_paths as string[] | null) ?? [])));
          }
        }
      }
    }
  }

  // Dedupe file paths.
  const uniquePaths = Array.from(new Set(filePaths));

  const downloadLinks: Array<{ name: string; url: string; path: string }> = [];
  for (const path of uniquePaths) {
    const { data, error } = await supabase.storage
      .from("product-files")
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (data?.signedUrl) {
      downloadLinks.push({
        name: path.split("/").pop() ?? path,
        url: data.signedUrl,
        path,
      });
    } else if (error) {
      console.warn("signed url error", path, error.message);
    }
  }

  const { data: orderRow } = await supabase
    .from("orders")
    .upsert(
      {
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        customer_email: customerEmail,
        product_ids: productIds,
        bundle_ids: bundleIds,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
        status: "paid",
        download_links: downloadLinks,
        environment: env,
      },
      { onConflict: "stripe_session_id" },
    )
    .select("id, email_sent_at")
    .maybeSingle();

  if (orderRow && !orderRow.email_sent_at) {
    await sendPurchaseEmail({
      to: customerEmail,
      itemName: displayNames.join(", "),
      downloadLinks,
      sessionId: session.id,
    });
    await supabase
      .from("orders")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", orderRow.id);
  }
}

// ── Watermarked manual: one-time download provisioning ──

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// deno-lint-ignore no-explicit-any
async function provisionManualDownload(env: StripeEnv, session: any, customerEmail: string) {
  const meta = session.metadata ?? {};
  const buyerName = (meta.buyer_name as string | undefined) ?? session.customer_details?.name ?? "Customer";
  const buyerOrg = (meta.buyer_org as string | undefined) ?? "—";
  const buyerEmail = (meta.buyer_email as string | undefined) ?? customerEmail;

  // Upsert by stripe_session_id so webhook retries are idempotent.
  const { data: existing } = await supabase
    .from("manual_downloads")
    .select("id, token")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  let token: string;
  if (existing?.token) {
    token = existing.token as string;
  } else {
    token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("manual_downloads").insert({
      token,
      stripe_session_id: session.id,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      buyer_org: buyerOrg,
      expires_at: expiresAt,
    });
    if (error) {
      console.error("manual_downloads insert failed", error);
      return;
    }
  }

  const downloadUrl = `https://${Deno.env.get("SUPABASE_URL")!.replace("https://", "")}/functions/v1/download-watermarked-manual?token=${encodeURIComponent(token)}`;
  await sendManualDeliveryEmail({ to: buyerEmail, name: buyerName, org: buyerOrg, downloadUrl });
}

async function sendManualDeliveryEmail(opts: {
  to: string;
  name: string;
  org: string;
  downloadUrl: string;
}) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) return;

  const html = renderEmailShell({
    title: `Your AthenaOne Operations Manual is ready`,
    bodyHtml: `
      <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 16px">
        Thanks ${escapeHtml(opts.name)} — your personalized copy of the
        <strong>MeasureWise FQHC AthenaOne Operations Manual</strong> is ready to download.
      </p>
      <p style="margin:24px 0;text-align:center">
        <a href="${opts.downloadUrl}" style="display:inline-block;background:#1a8a9b;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px">⬇ Download your manual</a>
      </p>
      <p style="font-size:13px;color:#b45309;background:#fef3c7;border:1px solid #fcd34d;padding:10px 14px;border-radius:6px;margin:16px 0">
        ⚠ This link expires after the first successful download or 24 hours, whichever comes first. Save the PDF locally as soon as it opens.
      </p>
      <p style="font-size:13px;color:#64748b;line-height:1.6;margin-top:24px">
        Your PDF is watermarked on every page with your name and organization
        (<strong>${escapeHtml(opts.org)}</strong>) — licensed for internal use by your purchasing organization only.
      </p>
      <p style="font-size:13px;color:#475569;margin-top:24px">— The MeasureWise team</p>
    `,
  });

  await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: "MeasureWise <hello@measurewise.org>",
      to: [opts.to],
      subject: "Your AthenaOne Operations Manual — download link inside",
      html,
      tags: [{ name: "category", value: "manual_delivery" }],
    }),
  }).catch((err) => console.warn("manual delivery email failed", err));
}

async function sendPurchaseEmail(opts: {

  to: string;
  itemName: string;
  downloadLinks: Array<{ name: string; url: string }>;
  sessionId: string;
}) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
    console.error("Email skipped: missing keys");
    return;
  }

  const linksHtml = opts.downloadLinks.length
    ? opts.downloadLinks
        .map(
          (l) =>
            `<li style="margin:8px 0"><a href="${l.url}" style="color:#1a8a9b;font-weight:600">${l.name}</a></li>`,
        )
        .join("")
    : "<li>Your files will be available shortly. If you don't see them within 1 hour, reply to this email.</li>";

  const html = renderEmailShell({
    title: "Thank you for your purchase",
    bodyHtml: `
      <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 16px">Your <strong>${escapeHtml(opts.itemName)}</strong> is ready to download. Links expire in 7 days — reply to this email if you need fresh links.</p>
      <ul style="background:#f8fafc;padding:16px 24px;border-radius:8px;border:1px solid #e2e8f0;list-style:none;margin:16px 0">${linksHtml}</ul>
      <p style="color:#64748b;font-size:13px;margin-top:24px">Order reference: ${escapeHtml(opts.sessionId)}</p>
    `,
  });

  const resp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: "MeasureWise <hello@measurewise.org>",
      to: [opts.to],
      subject: `Your MeasureWise download — ${opts.itemName}`,
      html,
    }),
  });
  if (!resp.ok) console.error("Resend failed", resp.status, await resp.text());
}

async function sendSubscriptionConfirmation(opts: {
  to: string;
  plan: string;
  trialEnd: string | null;
}) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) return;

  const planLabel = opts.plan.charAt(0).toUpperCase() + opts.plan.slice(1);
  const trialLine = opts.trialEnd
    ? `Your 14-day free trial runs through <strong>${new Date(opts.trialEnd).toLocaleDateString("en-US", { dateStyle: "long" })}</strong>. You can cancel anytime before then with no charge.`
    : `Your subscription is active.`;

  const html = renderEmailShell({
    title: `Welcome to MeasureWise ${planLabel}`,
    bodyHtml: `
      <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 16px">${trialLine}</p>
      <h2 style="font-size:16px;color:#0c4a6e;margin:24px 0 12px">First 3 things to do</h2>
      <ol style="font-size:14px;line-height:1.7;color:#334155;padding-left:20px;margin:0 0 16px">
        <li>Open your <a href="https://measurewise.org/dashboard" style="color:#1a8a9b;font-weight:600">Dashboard</a> and review your starter UDS measures.</li>
        <li>Launch your first PDSA cycle from the Playbook Library — it takes under 10 minutes.</li>
        <li>Invite your QI team so accountability tasks route to the right people.</li>
      </ol>
      <p style="margin:24px 0">
        <a href="https://measurewise.org/dashboard" style="display:inline-block;background:#1a8a9b;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600;font-size:14px">Open your dashboard</a>
      </p>
      <p style="font-size:13px;color:#64748b;line-height:1.6;margin-top:24px">
        Manage your subscription anytime from <a href="https://measurewise.org/settings" style="color:#1a8a9b">Settings → Billing</a>.
        Questions? Just reply to this email — it goes straight to me.
      </p>
      <p style="font-size:13px;color:#475569;margin-top:24px">— Jessica R. Smith, BSN<br/>Founder, MeasureWise</p>
    `,
  });

  await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: "MeasureWise <jessica@measurewise.org>",
      to: [opts.to],
      subject: `You're in — welcome to MeasureWise ${planLabel}`,
      html,
      tags: [{ name: "category", value: "subscription_confirmation" }],
    }),
  }).catch((err) => console.warn("subscription confirmation email failed", err));
}

function renderEmailShell(opts: { title: string; bodyHtml: string }) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
    <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#0c4a6e 0%,#1a8a9b 100%);padding:20px 28px;color:#ffffff">
        <div style="font-size:20px;font-weight:700;letter-spacing:-0.01em">MeasureWise</div>
        <div style="font-size:12px;opacity:0.85">Quality &amp; Financial Outcomes for FQHCs</div>
      </div>
      <div style="padding:28px">
        <h1 style="font-size:22px;color:#0f172a;margin:0 0 16px;font-weight:700;letter-spacing:-0.01em">${escapeHtml(opts.title)}</h1>
        ${opts.bodyHtml}
      </div>
      <div style="background:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center">
        © ${new Date().getFullYear()} MeasureWise · Fulton, MS · <a href="https://measurewise.org" style="color:#94a3b8">measurewise.org</a>
      </div>
    </div>
  </body></html>`;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function markOrderRefunded(env: StripeEnv, paymentIntentId: string) {
  await supabase
    .from("orders")
    .update({ status: "refunded", refunded_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("environment", env);
}

// ─────────────────────────────  SaaS subscription sync  ─────────────────────────────

// deno-lint-ignore no-explicit-any
async function upsertSubscription(env: StripeEnv, sub: any) {
  const organizationId =
    sub.metadata?.organizationId ??
    (typeof sub.customer === "string" ? null : sub.customer?.metadata?.organizationId);
  if (!organizationId) {
    console.warn("subscription event missing organizationId metadata", sub.id);
    return;
  }

  const item = sub.items?.data?.[0];
  const lookupKey: string | undefined =
    item?.price?.lookup_key ?? item?.price?.metadata?.lovable_external_id ?? undefined;
  const plan =
    sub.metadata?.plan ??
    (lookupKey?.startsWith("solo")
      ? "solo"
      : lookupKey?.startsWith("multi")
        ? "multi"
        : lookupKey?.startsWith("network")
          ? "network"
          : "free");

  const periodEndUnix = item?.current_period_end ?? sub.current_period_end;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  const trialEndIso = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;

  // Detect "first time we're seeing this sub" to send confirmation email exactly once.
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, stripe_subscription_id")
    .eq("organization_id", organizationId)
    .eq("environment", env)
    .maybeSingle();
  const isNewSubscription = !existing?.stripe_subscription_id;

  await supabase.from("subscriptions").upsert(
    {
      organization_id: organizationId,
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      stripe_price_id: lookupKey ?? null,
      plan,
      status: sub.status,
      current_period_end: periodEndUnix
        ? new Date(periodEndUnix * 1000).toISOString()
        : null,
      renews_at: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
      cancel_at_period_end: !!sub.cancel_at_period_end,
      canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
      trial_end: trialEndIso,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id,environment" },
  );

  if (isNewSubscription && plan !== "free") {
    // Look up the customer email from the org owner profile.
    const { data: org } = await supabase
      .from("organizations")
      .select("owner_id")
      .eq("id", organizationId)
      .maybeSingle();
    if (org?.owner_id) {
      const { data: authUser } = await supabase.auth.admin.getUserById(org.owner_id);
      const email = authUser?.user?.email;
      if (email) {
        await sendSubscriptionConfirmation({ to: email, plan, trialEnd: trialEndIso });
      }
    }
  }
}

async function markSubscriptionDeleted(env: StripeEnv, subscriptionId: string) {
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId)
    .eq("environment", env);
}

// ─────────────────────────────  Server  ─────────────────────────────

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const env: StripeEnv = url.searchParams.get("env") === "live" ? "live" : "sandbox";

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  const secret = getWebhookSecret(env);
  const stripe = createStripeClient(env);

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("Webhook signature failed", message);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as { id: string; mode?: string; metadata?: Record<string, string> };
        if (session.mode === "subscription") break;
        await fulfillOrder(env, session.id);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
        // deno-lint-ignore no-explicit-any
        await upsertSubscription(env, event.data.object as any);
        break;
      case "customer.subscription.deleted": {
        const sub = event.data.object as { id: string };
        await markSubscriptionDeleted(env, sub.id);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as { payment_intent?: string };
        if (charge.payment_intent) await markOrderRefunded(env, charge.payment_intent);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error", err);
    return new Response("Handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
