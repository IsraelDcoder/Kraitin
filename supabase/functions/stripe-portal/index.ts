import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@19.1.0";

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return fail("Unauthorized", cors, 401);

    // ── Rate limiting: max 5 portal accesses per hour ─────────────────────────
    const windowStart = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await supabase
      .from("paywall_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("event_type", "portal_access")
      .gte("created_at", windowStart);
    if ((count ?? 0) >= 5) {
      return fail("Too many portal requests. Please wait before trying again.", cors, 429);
    }
    await supabase.from("paywall_events").insert({
      user_id: user.id,
      event_type: "portal_access",
    });

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return fail("No active subscription found. Please subscribe first.", cors, 400);
    }

    const { returnUrl } = await req.json().catch(() => ({}));
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" as "2024-06-20" });

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: returnUrl || `${req.headers.get("origin") || "https://app.kraitin.com"}/billing`,
    });

    return ok({ url: session.url }, cors);
  } catch (err) {
    console.error("stripe-portal error:", err);
    return fail(err instanceof Error ? err.message : "Portal session failed", cors, 500);
  }
});
