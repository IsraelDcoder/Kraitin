import { createClient } from "jsr:@supabase/supabase-js@2";

// ── CORS: validate Origin against allowlist ────────────────────────────────
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map(s => s.trim()).filter(Boolean);

function buildCors(origin: string | null): Record<string, string> {
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

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const cors = buildCors(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") {
    return errJson("Method Not Allowed", 405, cors);
  }

  // ── 1. Verify user JWT ───────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) return errJson("Unauthorized", 401, cors);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !user) return errJson("Unauthorized", 401, cors);

  // ── 2. Verify active subscription ─────────────────────────────────────────
  const { data: sub, error: subErr } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subErr) return errJson("Subscription check failed", 500, cors);

  const activeStatuses = ["active"];
  if (!sub || !activeStatuses.includes(sub.status)) {
    return errJson("Subscription required. Upgrade to access news intelligence.", 403, cors);
  }

  // ── 3. Parse request body ──────────────────────────────────────────────────
  let params: Record<string, string> = {};
  try {
    const body = await req.json();
    params = { ...body };
  } catch {
    return errJson("Invalid request body", 400, cors);
  }

  // ── 4. Rate limiting: max 60 news requests per user per hour ─────────────
  const windowStart = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase
    .from("paywall_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_type", "news_request")
    .gte("created_at", windowStart);

  if ((count ?? 0) >= 60) {
    return errJson("Rate limit exceeded. Max 60 news requests per hour.", 429, cors);
  }

  // Log this request for rate limiting
  await supabase.from("paywall_events").insert({
    user_id: user.id,
    event_type: "news_request",
    metadata: { source: "all-news" },
  });

  // ── 5. Proxy to The News API directly ─────────────────────────────────────
  const newsApiKey = Deno.env.get("THE_NEWS_API_KEY") ?? "";
  if (!newsApiKey) return errJson("Server configuration error: THE_NEWS_API_KEY not set", 500, cors);
  const query = new URLSearchParams({ ...params, api_token: newsApiKey });
  const upstream = await fetch(
    `https://api.thenewsapi.com/v1/news/all?${query.toString()}`,
    {
      method: "GET",
      headers: { "Accept": "application/json" },
    }
  );

  if (upstream.status === 429 || upstream.status === 402) {
    const errText = await upstream.text();
    return new Response(errText, { status: upstream.status, headers: { "Content-Type": "application/json", ...cors } });
  }
  if (!upstream.ok) {
    return errJson(`Upstream error: ${upstream.status}`, 502, cors);
  }

  const data = await upstream.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json", ...cors },
  });
});
