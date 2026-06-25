// @ts-nocheck
/// <reference path="../deno-env.d.ts" />
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@19.1.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ── CORS: validate Origin against allowlist ────────────────────────────────
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map(s => s.trim()).filter(Boolean);

function buildCors(origin: string | null): Record<string, string> {
  const allowed = origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))
    ? origin : ALLOWED_ORIGINS[0] ?? "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

function ok(data: unknown, cors: Record<string, string>) {
  return new Response(JSON.stringify({ code: "SUCCESS", data }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...cors },
  });
}
function fail(msg: string, cors: Record<string, string>, status = 400) {
  return new Response(JSON.stringify({ code: "FAIL", message: msg }), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = buildCors(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return fail("Method not allowed", cors, 405);

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return fail("STRIPE_SECRET_KEY not configured", cors, 500);

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return fail("Unauthorized", cors, 401);

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return fail("Unauthorized", cors, 401);

    // ── Rate limiting: max 5 checkout attempts per hour ──────────────────────
    const windowStart = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await supabase
      .from("paywall_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("event_type", "checkout_attempt")
      .gte("created_at", windowStart);
    if ((count ?? 0) >= 5) {
      return fail("Too many checkout attempts. Please wait before trying again.", cors, 429);
    }
    await supabase.from("paywall_events").insert({
      user_id: user.id,
      event_type: "checkout_attempt",
    });

    const body = await req.json().catch(() => ({}));
    const plan = typeof body.plan === "string" ? body.plan.toLowerCase() : "";
    const source = typeof body.source === "string" ? body.source : undefined;
    if (plan !== "monthly" && plan !== "yearly") return fail("Invalid plan", cors);

    const priceEnvName = plan === "monthly"
      ? "STRIPE_MONTHLY_PRICE_ID"
      : "STRIPE_YEARLY_PRICE_ID";
    const priceId = Deno.env.get(priceEnvName);
    if (!priceId) return fail(`Price ID not configured for plan: ${plan}`, cors, 500);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" as "2024-06-20" });

    const price = await stripe.prices.retrieve(priceId).catch((err) => {
      console.error("create-checkout price validation failed", { priceId, plan, error: err });
      return null;
    });
    if (!price || !price.id || price.type !== "recurring" || !price.active) {
      return fail(
        `Stripe price ID is invalid. Confirm ${priceEnvName} is set to an active recurring price in the same Stripe account as STRIPE_SECRET_KEY.`,
        cors,
        500,
      );
    }

    if (!user.email) {
      return fail("Authenticated user has no email address", cors, 500);
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = sub?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    const reqOrigin = req.headers.get("origin") || "https://app.kraitin.com";

    // Route success/cancel back to the calling surface
    const isOnboarding = source === "onboarding";
    const successUrl = isOnboarding
      ? `${reqOrigin}/onboarding?status=success&step=11`
      : `${reqOrigin}/billing?session_id={CHECKOUT_SESSION_ID}&status=success`;
    const cancelUrl = isOnboarding
      ? `${reqOrigin}/onboarding?step=10`
      : `${reqOrigin}/billing?status=cancelled`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { user_id: user.id },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: { user_id: user.id },
    });

    if (!sub?.stripe_customer_id) {
      await supabase.from("subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
      }, { onConflict: "user_id" });
    }

    return ok({ url: session.url, sessionId: session.id }, cors);
  } catch (err) {
    console.error("create-checkout error:", err);
    return fail(err instanceof Error ? err.message : "Checkout failed", cors, 500);
  }
});
