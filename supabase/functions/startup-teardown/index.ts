import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map(s => s.trim()).filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))
      ? origin
      : ALLOWED_ORIGINS[0] ?? "*";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Vary": "Origin",
  };
}

function buildPrompt(company: string): string {
  return `You are Kraitin's Startup Teardown Engine. Analyze "${company}" and return ONLY a single valid JSON object. No markdown fences, no explanation, no text outside the JSON.

Fill every field with real data about "${company}". Be specific and data-driven.

{
  "company": "${company}",
  "tagline": "one sharp sentence describing what the company does",
  "score": 88,
  "marketPosition": "Dominant",
  "growthStatus": "Hypergrowth",
  "businessModel": "Subscription",
  "replicability": "High",
  "overview": {
    "revenue": "$700M+",
    "users": "100M+",
    "funding": "Public / $521M",
    "market": "Language Learning",
    "employees": "1,000+",
    "founded": "2011",
    "mrr": "$58M+",
    "valuation": "$7B+"
  },
  "scores": {
    "product": 95,
    "distribution": 92,
    "monetization": 88,
    "retention": 97,
    "virality": 84,
    "brand": 90
  },
  "timeline": [
    { "year": "2011", "event": "Founded", "milestone": true },
    { "year": "2013", "event": "Mobile launch", "milestone": false },
    { "year": "2021", "event": "IPO on NASDAQ", "milestone": true },
    { "year": "2025", "event": "100M daily users", "milestone": true }
  ],
  "revenueStreams": [
    { "name": "Subscriptions", "percentage": 82 },
    { "name": "Advertising", "percentage": 11 },
    { "name": "Test Center", "percentage": 7 }
  ],
  "revenueExplanation": "Two to three sentences explaining the revenue model and why it works well for this company.",
  "productFlow": [
    { "step": "Onboarding", "description": "Brief description" },
    { "step": "Core Loop", "description": "Brief description" },
    { "step": "Engagement Hook", "description": "Brief description" },
    { "step": "Monetization", "description": "Brief description" },
    { "step": "Retention", "description": "Brief description" }
  ],
  "contentChannels": [
    { "channel": "TikTok", "stars": 5 },
    { "channel": "Instagram", "stars": 4 },
    { "channel": "YouTube", "stars": 4 },
    { "channel": "SEO", "stars": 5 }
  ],
  "contentThemes": ["Theme 1", "Theme 2", "Theme 3", "Theme 4", "Theme 5"],
  "viralHooks": [
    { "hook": "Specific viral hook text", "views": "2.4M", "why": "Why it works" },
    { "hook": "Specific viral hook text", "views": "1.8M", "why": "Why it works" },
    { "hook": "Specific viral hook text", "views": "3.1M", "why": "Why it works" }
  ],
  "postingFrequency": [
    { "platform": "TikTok", "frequency": "5x daily" },
    { "platform": "Instagram", "frequency": "3x daily" },
    { "platform": "YouTube", "frequency": "2x weekly" }
  ],
  "adIntelligence": {
    "activeAds": "187",
    "winningHook": "Fear of losing streak",
    "primaryCTA": "Start Learning Free",
    "offer": "Freemium with premium upsell",
    "primaryPlatform": "Meta"
  },
  "competitors": [
    { "name": "${company}", "revenue": "A+", "growth": "A+", "rating": 94, "position": "Leader" },
    { "name": "Competitor B", "revenue": "A", "growth": "B", "rating": 78, "position": "Strong" },
    { "name": "Competitor C", "revenue": "B+", "growth": "B", "rating": 71, "position": "Mid" },
    { "name": "Competitor D", "revenue": "B", "growth": "C+", "rating": 58, "position": "Weak" }
  ],
  "moat": {
    "strength": 94,
    "networkEffects": false,
    "brand": true,
    "dataAdvantage": true,
    "habitFormation": "Extreme",
    "switchingCost": "Medium",
    "explanation": "Two sentences on what makes this company truly defensible."
  },
  "weaknesses": [
    { "title": "Specific weakness", "description": "Detailed description of this weakness", "severity": "High" },
    { "title": "Specific weakness", "description": "Detailed description of this weakness", "severity": "Medium" },
    { "title": "Specific weakness", "description": "Detailed description of this weakness", "severity": "Medium" }
  ],
  "opportunities": [
    { "title": "Opportunity title", "potential": 91, "difficulty": "Medium", "description": "Specific opportunity description" },
    { "title": "Opportunity title", "potential": 87, "difficulty": "Low", "description": "Specific opportunity description" },
    { "title": "Opportunity title", "potential": 82, "difficulty": "High", "description": "Specific opportunity description" }
  ],
  "blueprint": {
    "buildCost": "$8,000 - $25,000",
    "buildTime": "8-12 weeks",
    "complexity": "Medium",
    "techStack": ["Next.js", "Supabase", "OpenAI", "Stripe"],
    "monetization": "Freemium to Subscription",
    "launchChannel": "TikTok",
    "wedge": "The single most exploitable entry angle for a new competitor today",
    "mvpFeatures": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"]
  },
  "verdict": {
    "score": 94,
    "headline": "One bold headline sentence about the real reason for success.",
    "insight": "1-2 sentences on what the real moat is.",
    "founderTakeaway": "The single most important insight for a founder studying this company."
  }
}

Return ONLY the JSON. Adapt every value for "${company}".`;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey    = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const apiKey     = Deno.env.get("INTEGRATIONS_API_KEY")!;

  // ── Auth: verify JWT via anon client ──────────────────────────────────────
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json", ...cors },
    });
  }

  // ── Credit check: requires pro tier + 15 credits ──────────────────────────
  const CREDITS_COST = 15;
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: sub } = await adminClient
    .from("subscriptions")
    .select("tier, credits_remaining")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sub || sub.tier !== "pro") {
    return new Response(
      JSON.stringify({ error: "Upgrade to Pro to access Startup Teardown." }),
      { status: 403, headers: { "Content-Type": "application/json", ...cors } },
    );
  }
  if ((sub.credits_remaining ?? 0) < CREDITS_COST) {
    return new Response(
      JSON.stringify({ error: "Insufficient credits. Your 500 credits reset on your next billing date." }),
      { status: 402, headers: { "Content-Type": "application/json", ...cors } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const { company } = body as { company: string };
  if (!company?.trim()) {
    return new Response(JSON.stringify({ error: "Missing company name" }), {
      status: 400, headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const prompt = buildPrompt(company.trim());

  const upstream = await fetch(
    "https://app-ciobakqmqcjl-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 8000 },
        },
      }),
      signal: AbortSignal.timeout(180_000),
    }
  );

  if (!upstream.ok) {
    const errText = await upstream.text();
    return new Response(errText, {
      status: upstream.status, headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const geminiResp = await upstream.json();
  const rawText: string = geminiResp?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Strip markdown fences if present
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: cleaned.slice(0, 500) }), {
      status: 502, headers: { "Content-Type": "application/json", ...cors },
    });
  }

  // ── Deduct credits (fire-and-forget, don't block response) ───────────────
  adminClient.from("subscriptions")
    .update({
      credits_remaining: Math.max(0, (sub.credits_remaining ?? 0) - CREDITS_COST),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .then(() => { /* best-effort */ });

  return new Response(JSON.stringify(parsed), {
    headers: { "Content-Type": "application/json", ...cors },
  });
});
