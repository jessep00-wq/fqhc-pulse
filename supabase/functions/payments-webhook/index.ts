// Stripe webhook handler. Fulfills storefront orders and syncs SaaS subscriptions.
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

async function fulfillOrder(env: StripeEnv, sessionId: string) {
  const stripe = createStripeClient(env);
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  });

  const meta = session.metadata ?? {};
  const kind = meta.kind as "product" | "bundle" | undefined;
  const catalogId = meta.catalog_id as string | undefined;
  const customerEmail =
    session.customer_details?.email ?? session.customer_email ?? "";

  if (!kind || !catalogId || !customerEmail) {
    console.error("Missing metadata or email on session", sessionId, meta);
    return;
  }

  let productIds: string[] = [];
  let bundleIds: string[] = [];
  let filePaths: string[] = [];
  let displayNames: string[] = [];

  if (kind === "product") {
    productIds = [catalogId];
    const { data } = await supabase
      .from("store_products")
      .select("id, name, included_file_paths")
      .eq("id", catalogId)
      .maybeSingle();
    if (data) {
      filePaths = data.included_file_paths ?? [];
      displayNames = [data.name];
    }
  } else {
    bundleIds = [catalogId];
    const { data: bundle } = await supabase
      .from("store_bundles")
      .select("id, name, included_product_ids")
      .eq("id", catalogId)
      .maybeSingle();
    if (bundle) {
      displayNames = [bundle.name];
      const includedIds = bundle.included_product_ids ?? [];
      if (includedIds.length) {
        const { data: products } = await supabase
          .from("store_products")
          .select("id, name, included_file_paths")
          .in("id", includedIds);
        for (const p of products ?? []) {
          filePaths.push(...(p.included_file_paths ?? []));
        }
      }
    }
  }

  const downloadLinks: Array<{ name: string; url: string; path: string }> = [];
  for (const path of filePaths) {
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

  const html = `<!doctype html><html><body style="font-family:-apple-system,sans-serif;max-width:560px;margin:24px auto;padding:24px;background:#f8fafc;color:#0f172a">
    <h1 style="font-size:20px;margin:0 0 12px">Thank you for your purchase</h1>
    <p>Your <strong>${opts.itemName}</strong> is ready to download. Links expire in 7 days — if you need a fresh link, reply to this email.</p>
    <ul style="background:#fff;padding:16px 24px;border-radius:8px;border:1px solid #e2e8f0;list-style:none">${linksHtml}</ul>
    <p style="color:#64748b;font-size:13px;margin-top:24px">Order reference: ${opts.sessionId}</p>
    <p style="color:#64748b;font-size:13px">— The MeasureWise team</p>
  </body></html>`;

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
  if (!resp.ok) {
    console.error("Resend failed", resp.status, await resp.text());
  }
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
      trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      environment: env,
      updated_at: new Date().toISOString(),
    },
      { onConflict: "organization_id,environment" },
  );
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
        // Subscription mode — let customer.subscription.created handle DB sync.
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
        // Unhandled event type — return 200 so Stripe stops retrying.
        break;
    }
  } catch (err) {
    console.error("Webhook handler error", err);
    return new Response("Handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
