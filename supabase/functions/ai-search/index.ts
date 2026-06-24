import { createClient } from "jsr:@supabase/supabase-js@2";

// ── CORS: validate Origin against allowlist ────────────────────────────────
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map(s => s.trim()).filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))
    ? origin
    : ALLOWED_ORIGINS[0] ?? "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Vary": "Origin",
  };
}

function errJson(msg: string, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

const GATEWAY_URL =
  "https://app-ciobakqmqcjl-api-zYm4ze3j7XvL.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return errJson("Method Not Allowed", 405, cors);
  }

  // ── 1. Verify user JWT ─────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) return errJson("Unauthorized", 401, cors);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !user) return errJson("Unauthorized", 401, cors);

  // ── 2. Verify premium subscription (tier !== 'free') ──────────────────────
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("tier, credits_remaining, monthly_credits")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sub || sub.tier === "free" || sub.tier == null) {
    return errJson("Upgrade to Pro to access AI agents.", 403, cors);
  }

  // ── 2b. Check credit balance ───────────────────────────────────────────────
  // credits field is passed in the request body alongside contents
  let parsedBody: { contents?: unknown[]; credits?: number } = {};
  try { parsedBody = await req.clone().json(); } catch { /* default */ }
  const creditsRequired = typeof parsedBody.credits === "number" ? parsedBody.credits : 5;
  if ((sub.credits_remaining ?? 0) < creditsRequired) {
    return errJson("Insufficient credits. Your credits reset on your next billing date.", 402, cors);
  }

  // ── 3. Parse request body ──────────────────────────────────────────────────
  let contents: unknown[];
  try {
    const body = parsedBody.contents ? parsedBody : await req.json();
    contents = body.contents;
    if (!Array.isArray(contents) || contents.length === 0) {
      throw new Error("Missing or empty contents array");
    }
  } catch {
    return errJson("Invalid request body", 400, cors);
  }

  // ── 4. Rate limiting: max 20 AI requests per user per hour ────────────────
  const windowStart = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase
    .from("paywall_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_type", "ai_request")
    .gte("created_at", windowStart);

  if ((count ?? 0) >= 20) {
    return errJson("Rate limit exceeded. Max 20 AI requests per hour.", 429, cors);
  }

  await supabase.from("paywall_events").insert({
    user_id: user.id,
    event_type: "ai_request",
    feature: "ai-search",
  });

  // ── 5. Forward to platform gateway using INTEGRATIONS_API_KEY ─────────────
  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  if (!apiKey) return errJson("Server configuration error: INTEGRATIONS_API_KEY not set", 500, cors);

  const upstream = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ contents }),
  });

  if (upstream.status === 429 || upstream.status === 402) {
    const errText = await upstream.text();
    return new Response(errText, {
      status: upstream.status,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  if (!upstream.ok || !upstream.body) {
    return errJson(`Upstream error: ${upstream.status}`, 502, cors);
  }

  // ── 6. Deduct credits (fire-and-forget, don't block stream) ───────────────
  supabase.from("subscriptions")
    .update({
      credits_remaining: Math.max(0, (sub.credits_remaining ?? 0) - creditsRequired),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .then(() => { /* best-effort */ });

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
      ...cors,
    },
  });
});
