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

function buildPrompt(company: string, blueprint: Record<string, unknown>, scores: Record<string, number>, wedge: string): string {
  return `You are Kraitin's Full Blueprint Engine. A founder wants to build a startup inspired by "${company}".

Here's what we already know about the blueprint:
${JSON.stringify({ blueprint, scores, wedge }, null, 2)}

Generate a complete, actionable founder blueprint. Return ONLY a single valid JSON object — no markdown fences, no explanation.

Schema to fill:
{
  "company": "${company}",
  "headline": "One bold sentence: what you're building and why it will win",
  "summary": "2-3 sentences on the core strategy and differentiation",
  "successMetric": "The single metric that proves this is working at 6 months",

  "weeklyPlan": [
    {
      "week": "Week 1–2",
      "phase": "Foundation",
      "focus": "Short 1-line focus for this sprint",
      "tasks": ["Specific task 1", "Specific task 2", "Specific task 3"],
      "deliverable": "What exists at the end of this sprint"
    }
  ],

  "techSetup": [
    {
      "category": "Frontend",
      "items": [
        { "name": "Next.js", "purpose": "Why this tool", "setupNotes": "Quick setup note" }
      ]
    }
  ],

  "launchChecklist": [
    {
      "category": "Pre-Launch",
      "items": [
        { "task": "Specific task", "priority": "High" }
      ]
    }
  ],

  "ninetyDayPlan": {
    "day30": {
      "goal": "Clear milestone goal",
      "keyActions": ["Action 1", "Action 2", "Action 3"],
      "metric": "Specific measurable outcome"
    },
    "day60": {
      "goal": "Clear milestone goal",
      "keyActions": ["Action 1", "Action 2", "Action 3"],
      "metric": "Specific measurable outcome"
    },
    "day90": {
      "goal": "Clear milestone goal",
      "keyActions": ["Action 1", "Action 2", "Action 3"],
      "metric": "Specific measurable outcome"
    }
  },

  "acquisitionPlaybook": [
    {
      "channel": "TikTok",
      "strategy": "Specific strategy for this channel",
      "firstStep": "Exact first action to take today",
      "estimatedCost": "$0 / week",
      "expectedResult": "What to expect in 30 days"
    }
  ],

  "monetizationSteps": [
    {
      "step": 1,
      "action": "Specific monetization action",
      "timing": "Week X",
      "goal": "Revenue or conversion target"
    }
  ],

  "risks": [
    {
      "risk": "Specific risk",
      "probability": "High",
      "impact": "High",
      "mitigation": "Concrete mitigation strategy"
    }
  ],

  "founderAdvice": "One paragraph of honest, sharp founder advice — what most people building in this space get wrong, and what the winner will do differently."
}

RULES:
- weeklyPlan must cover the full build time (e.g. 8-12 weeks), with realistic sprint breakdown
- techSetup must include ALL categories needed: Frontend, Backend, Database, Auth, Payments, Analytics, Infra
- launchChecklist must include Pre-Launch, Launch Day, Post-Launch categories with 4-6 items each
- acquisitionPlaybook: include 3-4 channels specific to this type of startup
- monetizationSteps: 4-6 concrete steps from $0 to first $1k MRR
- risks: 3-4 real risks with honest probability/impact assessment
- Be specific to "${company}" — not generic startup advice
- Return ONLY the JSON object`;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...cors } });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey    = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const apiKey     = Deno.env.get("INTEGRATIONS_API_KEY")!;

  // ── Auth: verify JWT via anon client ──────────────────────────────────────
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...cors } });

  // ── Credit check: requires pro tier + 25 credits ──────────────────────────
  const CREDITS_COST = 25;
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: sub } = await adminClient
    .from("subscriptions")
    .select("tier, credits_remaining")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sub || sub.tier !== "pro") {
    return new Response(
      JSON.stringify({ error: "Upgrade to Pro to generate a Complete Blueprint." }),
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
  const { company, blueprint, scores, wedge } = body as {
    company: string;
    blueprint: Record<string, unknown>;
    scores: Record<string, number>;
    wedge: string;
  };

  if (!company?.trim()) return new Response(JSON.stringify({ error: "Missing company" }), { status: 400, headers: { "Content-Type": "application/json", ...cors } });

  const prompt = buildPrompt(company.trim(), blueprint ?? {}, scores ?? {}, wedge ?? "");

  const upstream = await fetch(
    "https://app-ciobakqmqcjl-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Gateway-Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 6000 },
        },
      }),
      signal: AbortSignal.timeout(180_000),
    }
  );

  if (!upstream.ok) {
    const t = await upstream.text();
    return new Response(t, { status: upstream.status, headers: { "Content-Type": "application/json", ...cors } });
  }

  const geminiResp = await upstream.json();
  const rawText: string = geminiResp?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  let parsed: unknown;
  try { parsed = JSON.parse(cleaned); }
  catch {
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

  return new Response(JSON.stringify(parsed), { headers: { "Content-Type": "application/json", ...cors } });
});
