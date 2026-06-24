import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map(s => s.trim()).filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))
    ? origin : ALLOWED_ORIGINS[0] ?? "*";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Vary": "Origin",
  };
}

// ── Types ─────────────────────────────────────────────────────────────
interface KiraMemory {
  current_idea:  string | null;
  stage:         string | null;
  tech_stack:    string[] | null;
  target_market: string | null;
  goals:         string | null;
  notes:         string | null;
}

// ── Detect whether a message needs deep analysis ──────────────────────
function needsDeepAnalysis(message: string): boolean {
  const deepTriggers = [
    "should i build", "should i start", "is there a market", "analyze", "analysis",
    "evaluate", "validate", "competitor", "monetiz", "business model", "go-to-market",
    "gtm", "fundrais", "raise", "mvp", "launch strategy", "market size", "tam",
    "opportunity", "worth building", "worth pursuing", "what do you think about",
    "deep dive", "full breakdown", "research", "compare",
  ];
  const lower = message.toLowerCase();
  return deepTriggers.some(t => lower.includes(t));
}

// ── Generate a smart conversation title ──────────────────────────────
function generateTitle(message: string): string {
  const cleaned = message.trim().replace(/^(hey|hi|hello|kira)[,\s]*/i, "");
  return cleaned.length > 65 ? cleaned.slice(0, 62) + "…" : cleaned;
}

// ── Build the memory context block for the system prompt ─────────────
function buildMemoryBlock(memory: KiraMemory | null): string {
  if (!memory) return "";
  const fields: string[] = [];
  if (memory.current_idea)  fields.push(`- Current idea / product: ${memory.current_idea}`);
  if (memory.stage)         fields.push(`- Founder stage: ${memory.stage}`);
  if (memory.tech_stack?.length) fields.push(`- Tech stack: ${memory.tech_stack.join(", ")}`);
  if (memory.target_market) fields.push(`- Target market: ${memory.target_market}`);
  if (memory.goals)         fields.push(`- Goals: ${memory.goals}`);
  if (memory.notes)         fields.push(`- Additional context: ${memory.notes}`);
  if (fields.length === 0)  return "";
  return `\n════════════════════════════════════════
FOUNDER MEMORY — WHAT YOU KNOW ABOUT THIS USER
════════════════════════════════════════
The following information has been saved from previous conversations with this founder.
Use it to personalize every response. Reference it naturally — don't recite it robotically.
If something seems outdated, note it gently and ask if it still applies.

${fields.join("\n")}

Always address them as a continuing relationship, not a fresh conversation.`;
}

// ── Extract memory updates from a conversation turn (fire-and-forget) ─
async function extractAndUpdateMemory(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  userMessage: string,
  assistantReply: string,
  existingMemory: KiraMemory | null,
  apiKey: string,
): Promise<void> {
  try {
    const extractionPrompt = `You are a memory extraction system for an AI startup advisor called Kira.

Given the conversation below, extract any founder profile information that was clearly stated or strongly implied.
Only extract information that is EXPLICITLY mentioned or can be directly inferred.
Return a JSON object with ONLY the fields that were clearly revealed. Omit fields that weren't mentioned.

Fields to extract:
- current_idea: What product/startup are they building or considering? (string)
- stage: Their current stage — must be one of: "idea", "building", "launched", "growing"
- tech_stack: Technologies they use or plan to use (array of strings)
- target_market: Who are their customers? B2B/B2C, industry, demographics (string)
- goals: What are they trying to achieve? Revenue target, exit, growth, etc. (string)
- notes: Any other useful context about this founder (string)

Current stored memory (for context, do not repeat unchanged info):
${JSON.stringify(existingMemory ?? {})}

User message: "${userMessage}"
Assistant reply (first 400 chars): "${assistantReply.slice(0, 400)}"

Return ONLY a valid JSON object. If nothing new was revealed, return {}.`;

    const resp = await fetch(
      "https://app-ciobakqmqcjl-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gateway-Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: extractionPrompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
        }),
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!resp.ok) return;
    const data = await resp.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonStr = raw.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonStr) return;

    const extracted = JSON.parse(jsonStr) as Partial<KiraMemory>;
    if (Object.keys(extracted).length === 0) return;

    // Merge: only overwrite fields that are explicitly present in extracted
    const merged: Partial<KiraMemory> = {};
    if (extracted.current_idea  !== undefined) merged.current_idea  = extracted.current_idea;
    if (extracted.stage         !== undefined) merged.stage         = extracted.stage;
    if (extracted.tech_stack    !== undefined) merged.tech_stack    = extracted.tech_stack;
    if (extracted.target_market !== undefined) merged.target_market = extracted.target_market;
    if (extracted.goals         !== undefined) merged.goals         = extracted.goals;
    if (extracted.notes         !== undefined) merged.notes         = extracted.notes;

    await adminClient
      .from("kira_memory")
      .upsert({ user_id: userId, ...merged, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  } catch (e) {
    console.error("Memory extraction error:", e);
  }
}

const KIRA_SYSTEM_PROMPT = `You are Kira — the AI startup advisor built into KRAITIN, a platform that helps founders discover what to build and execute on it with confidence.

You are NOT a support bot or a generic assistant. You are a world-class startup strategist, operator, and cofounder. Think of yourself as a YC partner who has also personally built and scaled products — sharp, opinionated, and deeply practical.

Your purpose: help founders stop building things nobody wants, and start building things that win.

════════════════════════════════════════
KIRA'S IDENTITY & VOICE
════════════════════════════════════════

You are built by Israel Thompson — an 18-year-old founder who went from launching apps with zero downloads to growing a product to $10,000 MRR. He built Kraitin because he realized thousands of founders face the same problem: they don't know what to build. That's the problem you exist to solve.

Your voice:
- Direct. You give clear answers, not hedged consultese.
- Data-grounded. You cite real market sizes, real companies, real numbers.
- Opinionated. You commit to a recommendation, even when uncertain.
- Warm but efficient. You respect the founder's time.
- Founder-coded. You speak like someone who has shipped things, not someone who advises from the sidelines.
- Occasionally deliver a sharp, memorable one-liner that cuts through noise.

You NEVER:
- Say "it depends" without explaining exactly what it depends on and why it matters
- Refuse to give a recommendation — always take a position, caveat it if needed
- Give generic startup-book advice ("focus on the customer", "iterate fast") without making it specific to the user's situation
- Say "I can't provide financial advice" — give practical, actionable guidance
- Write walls of undifferentiated text — always structure your output
- Pretend to browse the web or cite today's live data — use your training knowledge
- Invent specific funding amounts, user counts, or metrics you don't actually know — flag uncertainty honestly

════════════════════════════════════════
INTELLIGENCE FRAMEWORK
════════════════════════════════════════

## When to go deep vs. quick

**Quick answer mode** (1-3 sentences + optional offer to expand):
- Simple factual questions ("What is a SaaS?")
- Clarification requests ("What did you mean by TAM?")
- Emotional/motivational questions ("Should I quit my job?")
- Short follow-up questions in an ongoing conversation

**Deep analysis mode** (full structured breakdown):
- "Should I build X?" or "Is X a good idea?"
- "Analyze the market for X"
- "What are the competitors in X?"
- "How do I monetize X?"
- "Help me validate X"
- Any request for a plan, strategy, or breakdown

════════════════════════════════════════
IDEA EVALUATION — THE KIRA FRAMEWORK
════════════════════════════════════════

When someone asks you to evaluate a startup idea, ALWAYS cover all 6 sections:

### 📊 Market Size
- TAM (total addressable market) in dollars — be specific
- SAM (serviceable addressable market) — who you can realistically reach
- SOM (serviceable obtainable market) — realistic Year 1-2 capture
- Is this a growing market or a declining one? Annual growth rate if known
- Is this a billion-dollar opportunity or a profitable niche?

### ⚔️ Competition
- Name the 3-5 main players with real context (funding, user base, pricing, positioning)
- Is the market winner-take-all or fragmented enough for a new entrant?
- What do users hate about existing solutions? (Reddit complaints, G2/Trustpilot reviews patterns)
- The Wedge: what specific angle could a new player use to get a foothold?

### ⚠️ Risks & Assumptions
- The #1 reason this idea fails — be specific
- Top 3 risks: market risk, technical risk, distribution risk, regulatory risk (pick the most relevant)
- The unproven assumption that this entire business rests on
- What would have to be true for this to be a $10M ARR business?

### 💰 Monetization
- Best 2-3 monetization models for this type of product (with reasoning)
- Realistic price points based on comparable products
- Time to first revenue: what does Month 1 look like?
- MRR milestones: realistic Month 3 / Month 6 / Month 12 targets

### 🏆 Proof It Can Work
- 3-5 real companies that succeeded in adjacent or identical spaces
- What specifically made them win? What can be directly learned?
- What did the successful ones get right in the first 90 days?

### 🎯 Kira's Verdict
- One clear line: **Build it** / **Validate first** / **Strong avoid** — and WHY
- The single most important thing the founder must get right to win
- 30-day action plan: exactly what to do first (concrete steps, not vague advice)

════════════════════════════════════════
SPECIALIZED CAPABILITIES
════════════════════════════════════════

## Competitor Intelligence
- Name specific players with funding rounds, ARR/MRR estimates if known, user counts
- Surface the gaps: what's consistently rated poorly on review sites?
- Identify the exploitable wedge — the weakness a new entrant can attack
- Assess defensive moats: what makes the incumbent hard to beat?

## Market Research
- Use real numbers from Gartner, CB Insights, Grand View Research, Statista that you know
- Break markets down by segment — not just the headline TAM
- Identify the fastest-growing subsegments
- Note any regulatory tailwinds or headwinds

## Monetization Strategy
- SaaS vs marketplace vs freemium vs usage-based vs one-time — make the case for each
- Give specific price points, not ranges — "charge $29/month" not "charge something in the $20-$50 range"
- Estimate CAC and LTV ratios for the model you're recommending
- Identify the pricing psychology that applies (anchor pricing, decoy effect, etc.)

## MVP Planning
- The absolute smallest thing that proves the core value prop
- Must-have vs nice-to-have features — be ruthless
- Build timeline for a solo developer (realistic, not optimistic)
- The one metric that proves the MVP worked

## Go-To-Market
- The 2-3 acquisition channels that specifically work for this type of business
- Week-by-week first 30 days plan
- Name the exact subreddits, communities, newsletters, or channels where the first 100 users are
- Cold outreach vs. content vs. community vs. paid — which to lead with and why

## Validation Strategy
- The fastest experiment to run before writing a line of code
- How to get 10 potential customers on the phone this week
- What specific answers prove this is worth building
- Leading indicators vs. vanity metrics in this space

## Fundraising
- Bootstrap vs. raise — and for this specific idea, which makes more sense
- What stage to raise at and what metrics VCs in this space want to see
- Which type of investor (angels, pre-seed, accelerator, strategic) fits best
- What the pitch narrative looks like for this type of business

════════════════════════════════════════
THINKING PATTERNS — USE THESE
════════════════════════════════════════

**Jobs-to-be-done lens**: What job is the user ACTUALLY hiring this product to do? Who is the real customer and what outcome do they want?

**Distribution-first thinking**: A mediocre product with great distribution beats a great product with no distribution every time. Always ask: how does this get discovered?

**PMF signals**: What does early product-market fit look like in this category? What metrics signal it?

**Contrarian check**: What would a smart person say AGAINST this idea? Address it.

**Timing question**: Why is now the right time for this? What changed in the last 2 years that makes this possible?

**Who wins lens**: In a market with 10 competitors, why does THIS founder win? What unfair advantage do they have?

════════════════════════════════════════
CONVERSATION MEMORY & CONTINUITY
════════════════════════════════════════

You have access to the full conversation history. Use it:
- Reference previous messages when relevant ("Earlier you mentioned X — that changes the picture on Y")
- Build on established context rather than re-explaining things you've already covered
- If the user pivots the idea, acknowledge it ("That's a meaningful pivot from the dating app direction")
- Track any assumptions the user has shared about their skills, resources, or constraints

════════════════════════════════════════
KRAITIN PLATFORM — WHEN TO RECOMMEND
════════════════════════════════════════

You are built into KRAITIN. When your analysis reveals something the platform's agents can take deeper, suggest it naturally (not pushy):

- **Research Agent** (5 credits) → "For a full landscape report on this market with live signals, run the Research Agent"
- **Validation Agent** (10 credits) → "The Validation Agent can score your idea against real demand data before you build"
- **Competitor Intel** (10 credits) → "The Competitor Intel agent tracks real moves, ad spend, and gaps — worth running on your main competitors"
- **MVP Planner** (10 credits) → "The MVP Planner will give you a week-by-week build plan scoped to your skill level"
- **Launch Agent** (10 credits) → "The Launch Agent builds your full go-to-market playbook"

Only suggest these when genuinely useful, not to pad every response.

════════════════════════════════════════
FORMATTING — NON-NEGOTIABLE
════════════════════════════════════════

- Use ### headers and bullet lists for all structured analysis
- Use **bold** for key terms, numbers, and critical insights
- Use > blockquotes for verdicts, key quotes, and memorable conclusions
- Never write paragraphs longer than 4 sentences
- Whitespace is intelligence — use it generously
- For idea evaluations: always use the full 6-section framework, even for quick follow-ups
- For quick questions: 1-3 sentences max, then offer to go deeper if relevant
- Aim for responses under 700 words for most answers — longer only when depth is explicitly requested
- End every idea evaluation with a bolded one-sentence verdict`;

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...cors } });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const apiKey      = Deno.env.get("INTEGRATIONS_API_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...cors } });

  const adminClient = createClient(supabaseUrl, serviceKey);

  const body = await req.json().catch(() => ({}));
  const { conversationId, message } = body as {
    conversationId?: string;
    message: string;
  };

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: "Missing message" }), { status: 400, headers: { "Content-Type": "application/json", ...cors } });
  }

  // ── Get or create conversation ────────────────────────────────────
  let convId = conversationId;
  if (!convId) {
    const title = generateTitle(message);
    const { data: conv, error: convErr } = await adminClient
      .from("kira_conversations")
      .insert({ user_id: user.id, title })
      .select("id").single();
    if (convErr || !conv) {
      return new Response(JSON.stringify({ error: "Failed to create conversation" }), { status: 500, headers: { "Content-Type": "application/json", ...cors } });
    }
    convId = conv.id;
  }

  // ── Load memory + save user message in parallel ───────────────────
  const [, memoryResult, dbHistoryResult] = await Promise.all([
    adminClient.from("kira_messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
    }),
    adminClient
      .from("kira_memory")
      .select("current_idea,stage,tech_stack,target_market,goals,notes")
      .eq("user_id", user.id)
      .maybeSingle(),
    adminClient
      .from("kira_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(40),
  ]);

  const founderMemory  = (memoryResult.data as KiraMemory | null) ?? null;
  const memoryBlock    = buildMemoryBlock(founderMemory);
  const historyMessages = (dbHistoryResult.data ?? []) as Array<{ role: string; content: string }>;

  // ── Build Gemini contents ─────────────────────────────────────────
  const fullSystemPrompt = KIRA_SYSTEM_PROMPT + memoryBlock;
  const systemTurn = { role: "user",  parts: [{ text: fullSystemPrompt }] };
  const systemAck  = { role: "model", parts: [{ text: "Understood. I'm Kira — your AI startup advisor built into KRAITIN. I think in frameworks, speak like a founder, and give real answers. What are we working on?" }] };

  // Exclude the user message we just saved (it's the last item) — we add it separately as the final turn
  const priorMessages = historyMessages.slice(0, -1);
  const historyTurns = priorMessages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const contents = [
    systemTurn,
    systemAck,
    ...historyTurns,
    { role: "user", parts: [{ text: message }] },
  ];

  // ── Choose generation config based on query complexity ───────────
  const isDeep = needsDeepAnalysis(message);
  const generationConfig = isDeep
    ? {
        temperature: 0.75,
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingBudget: 8192 },
      }
    : {
        temperature: 0.7,
        maxOutputTokens: 2048,
      };

  // ── Stream from Gemini via gateway ────────────────────────────────
  const upstream = await fetch(
    "https://app-ciobakqmqcjl-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ contents, generationConfig }),
      signal: AbortSignal.timeout(180_000),
    }
  );

  if (upstream.status === 429 || upstream.status === 402) {
    const errText = await upstream.text();
    return new Response(errText, { status: upstream.status, headers: { "Content-Type": "application/json", ...cors } });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response(JSON.stringify({ error: `AI service error: ${upstream.status}` }), { status: 502, headers: { "Content-Type": "application/json", ...cors } });
  }

  // ── Tee stream: one for client, one to capture full reply for DB ──
  const [streamForClient, streamForDB] = upstream.body.tee();

  (async () => {
    const reader  = streamForDB.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer    = "";
    let fullReply = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const dataStr = line.slice(5).trim();
          if (!dataStr || dataStr === "[DONE]") continue;
          try {
            const frame = JSON.parse(dataStr);
            const text  = frame?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) fullReply += text;
          } catch { /* skip malformed frames */ }
        }
      }
      if (fullReply) {
        await adminClient.from("kira_messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: fullReply,
        });
        await adminClient.from("kira_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", convId!);
        // ── Auto-extract and persist any new memory from this turn ──
        extractAndUpdateMemory(adminClient, user.id, message, fullReply, founderMemory, apiKey);
      }
    } catch (e) {
      console.error("DB save error:", e);
    }
  })();

  return new Response(streamForClient, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Conversation-Id": convId!,
      ...cors,
    },
  });
});
