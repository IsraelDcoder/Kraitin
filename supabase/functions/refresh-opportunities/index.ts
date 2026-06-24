import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map(s => s.trim()).filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))
    ? origin : ALLOWED_ORIGINS[0] ?? "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Vary": "Origin",
  };
}

function errJson(msg: string, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify({ error: msg }), {
    status, headers: { "Content-Type": "application/json", ...cors },
  });
}

const CATEGORIES = ["AI", "Health", "Education", "Productivity", "B2B SaaS", "Consumer", "Mobile Apps"];

const PROMPT = (category: string) => `You are a startup market analyst with access to real-time data. Research and identify the TOP 15 highest-potential startup opportunities in the "${category}" category RIGHT NOW in ${new Date().getFullYear()}.

For each opportunity, provide REAL market data based on current trends, App Store/Google Play rankings, industry reports, and news.

Return ONLY a valid JSON array (no markdown, no explanation) with exactly 15 objects, each with these fields:
- title: string (specific, descriptive opportunity name, 4-10 words)
- description: string (2 sentences max, specific market insight with real context)
- revenue_estimate: string (realistic MRR range like "$3k–$18k MRR" or "$20k–$120k MRR")
- downloads: string (monthly estimate like "50k+/mo" or "5k+/mo")
- market_size: string (TAM like "$2.4B" or "$850M")
- growth_percent: number (YoY growth % as integer, 15–120)
- competition_score: number (1–100, lower = less competition)
- opportunity_score: number (1–100, higher = better opportunity)
- growth_velocity: string (must be one of: "Explosive", "Rising", "Stable")
- is_hidden_gem: boolean (true if underserved, niche, or overlooked)
- tags: array of 3-4 lowercase strings

Base your data on REAL signals: trending searches, App Store rankings, recent funding rounds, market reports, and news from the past 3 months. Be specific and accurate.`;

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return errJson("Method Not Allowed", 405, cors);

  // Auth check
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) return errJson("Unauthorized", 401, cors);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  // Use platform gateway (same as ai-search) — INTEGRATIONS_API_KEY injected automatically
  const integrationsKey = Deno.env.get("INTEGRATIONS_API_KEY")!;
  const gatewayUrl = "https://app-ciobakqmqcjl-api-zYm4ze3j7XvL.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:generateContent";

  // Verify user
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return errJson("Unauthorized", 401, cors);

  const adminClient = createClient(supabaseUrl, serviceKey);

  let { category } = await req.json().catch(() => ({}));
  if (!category || !CATEGORIES.includes(category)) {
    category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  }

  // Call Gemini via platform gateway (no direct API key needed)
  const geminiRes = await fetch(gatewayUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${integrationsKey}`,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: PROMPT(category) }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    }),
  });

  if (!geminiRes.ok) {
    const err = await geminiRes.text();
    console.error(`Gemini error ${geminiRes.status}:`, err.slice(0, 500));
    return errJson(`AI service error: ${geminiRes.status}`, 502, cors);
  }

  const geminiData = await geminiRes.json();
  const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Parse JSON from response (strip any markdown fencing)
  let opportunities: Record<string, unknown>[] = [];
  try {
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found");
    opportunities = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Parse error:", e, "Raw:", rawText.slice(0, 500));
    return errJson("Failed to parse AI response", 500, cors);
  }

  // Validate + clean each opportunity
  const cleaned = opportunities
    .filter((o) => typeof o.title === "string" && o.title.length > 2)
    .map((o) => ({
      title: String(o.title).slice(0, 120),
      category,
      description: String(o.description ?? "").slice(0, 500),
      revenue_estimate: String(o.revenue_estimate ?? "$1k–$10k MRR"),
      downloads: String(o.downloads ?? "1k+/mo"),
      market_size: String(o.market_size ?? "$500M"),
      growth_percent: Math.min(200, Math.max(5, Number(o.growth_percent) || 30)),
      competition_score: Math.min(100, Math.max(1, Number(o.competition_score) || 50)),
      opportunity_score: Math.min(100, Math.max(1, Number(o.opportunity_score) || 60)),
      growth_velocity: ["Explosive", "Rising", "Stable"].includes(String(o.growth_velocity))
        ? String(o.growth_velocity) : "Rising",
      is_hidden_gem: Boolean(o.is_hidden_gem),
      tags: Array.isArray(o.tags) ? o.tags.slice(0, 5).map(String) : [category.toLowerCase()],
      created_at: new Date().toISOString(),
    }));

  if (cleaned.length === 0) return errJson("No valid opportunities returned", 500, cors);

  // Delete old data for this category and insert fresh
  await adminClient.from("opportunities").delete().eq("category", category);
  const { error: insertErr } = await adminClient.from("opportunities").insert(cleaned);

  if (insertErr) {
    console.error("Insert error:", insertErr);
    return errJson("Database insert failed", 500, cors);
  }

  return new Response(
    JSON.stringify({ success: true, category, count: cleaned.length }),
    { status: 200, headers: { "Content-Type": "application/json", ...cors } },
  );
});
