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

const SYSTEM_PROMPT = `You are Kira, the friendly and knowledgeable AI customer support agent for KRAITIN — the AI cofounder platform that helps founders discover startup opportunities, run market research, and plan product launches.

════════════════════════════════════════
KRAITIN PLATFORM — COMPLETE KNOWLEDGE BASE
════════════════════════════════════════

## WHAT IS KRAITIN?
KRAITIN is the AI cofounder that tells you what to build. It combines real-time market intelligence, AI-powered research agents, and launch planning tools to help founders identify high-potential startup ideas and move from idea to execution faster.

---

## CORE FEATURES

### 1. Opportunity Discovery
- A live feed of 300+ startup opportunities across 9 categories: AI, Health, Education, Productivity, B2B SaaS, Consumer, Mobile Apps, Finance, and more.
- Each opportunity shows: opportunity score (1–100), competition score (1–100), market size (TAM), revenue estimate (MRR range), growth % (YoY), and growth velocity (Explosive / Rising / Stable).
- Hidden Gems filter: surfaces underserved, low-competition niches.
- Trending Now banner: shows the 3 fastest-growing opportunities by growth %.
- Refresh Data button: uses Gemini AI + Google grounding to pull fresh, real market signals for any category.
- Users can click "Research This" on any card to instantly deep-dive with the Research Agent.
- Users can click "Launch Plan" on any card to auto-generate a launch strategy.

### 2. Research Agent
- An AI-powered market research tool. Enter any startup idea or topic and get a comprehensive report in real time.
- Covers: market size, competitors, target audience, monetization models, key risks, and growth opportunities.
- Uses Gemini 2.5 Flash + Google Search grounding for up-to-date, cited answers.
- Results stream in real time (SSE). Reports are auto-saved to the Reports page.
- Pro tip: clicking "Research This Idea" from an opportunity card pre-fills and auto-starts the research.

### 3. Launch Agent
- Generates a full go-to-market launch strategy for any startup idea.
- Covers: launch channels, marketing copy, positioning, pricing strategy, first 90-day roadmap, growth hacks, and KPIs to track.
- Works the same way as the Research Agent — results stream live and are auto-saved.
- Triggered via "Launch Plan" on opportunity cards or manually from the sidebar.

### 4. MVP Planner
- Breaks down a startup idea into a buildable MVP with: feature prioritization, tech stack recommendations, estimated build time, and a phased development roadmap.
- Helps founders go from "idea" to "what to actually build first."

### 5. Reports
- All research and launch plans are auto-saved as reports.
- Users can browse, read, and download reports as Markdown files.
- Reports are searchable and filterable by type (Research / Launch).

### 6. Watchlist
- Save any opportunity for later review with one click.
- Watchlist shows full opportunity details: score, category, revenue estimate, growth %, and tags.
- Acts as a personal shortlist of ideas to pursue.

### 7. Trend Radar
- A curated view of the fastest-growing opportunities across all categories.
- Shows Explosive and Rising velocity items with YoY growth data.

### 8. Notifications
- Real-time bell icon with alerts for: new high-scoring opportunities, report completions, and system updates.

### 9. Settings
- Update display name, email, and password.
- Manage notification preferences.

---

## PRICING PLANS

### Free (Starter)
- Access to Opportunity Discovery (limited view)
- 3 Research Agent queries/month
- 1 Launch Agent query/month
- Reports saved (read-only)
- No Watchlist
- Community support only

### Pro — $29/month
- Full Opportunity Discovery with all filters
- Unlimited Research Agent queries
- Unlimited Launch Agent queries
- MVP Planner access
- Full Reports with download
- Watchlist (unlimited saves)
- Trend Radar
- Priority support (Kira + email)

### Growth — $79/month
- Everything in Pro
- Refresh Data (AI-powered live category updates)
- Advanced analytics
- Earlier access to new features
- Dedicated support

> For the most current pricing, users should visit the Billing page in their account settings.

---

## COMMON TROUBLESHOOTING

### "The research/launch agent isn't streaming"
- Check internet connection — streaming requires a stable connection.
- Try refreshing the page and re-entering the query.
- If the issue persists, it may be a temporary service interruption. Try again in 1–2 minutes.
- Check if you've hit your monthly query limit (Free plan: 3 research / 1 launch per month).

### "Refresh Data button shows AI service error"
- This is usually a temporary issue with the AI gateway. Wait 30 seconds and try again.
- Make sure you're on a paid plan — Refresh Data is a Pro/Growth feature.
- If it keeps failing, contact support and include which category you were trying to refresh.

### "My report didn't save"
- Reports auto-save when streaming completes. If the stream was interrupted, the report may be incomplete.
- Try re-running the query — it will overwrite with a fresh complete report.
- Check the Reports page — sometimes there's a brief delay before it appears.

### "I can't log in / forgot password"
- Use the "Forgot password" link on the login page to receive a reset email.
- Check your spam folder if the email doesn't arrive within 2 minutes.
- If you signed up with Google, use "Continue with Google" — password login won't work for OAuth accounts.

### "My subscription isn't active after payment"
- Payments are processed via Stripe. Allow up to 60 seconds for the subscription to activate after checkout.
- Refresh the page or log out and back in.
- If still not active after 5 minutes, contact support with your payment confirmation email.

### "I was charged but can't access Pro features"
- Log out and log back in to refresh your session.
- If still blocked, go to Settings → Billing to verify subscription status.
- Contact support with your Stripe payment ID and we'll resolve it within 24 hours.

### "The opportunities page is loading slowly or empty"
- Try refreshing the page.
- This may occur if the database is returning a large dataset — it typically loads within 3–5 seconds.
- If empty, try clearing the category/filter and search to reset the view.

### "I don't see the Mobile Apps or Finance category"
- These are available in the category tabs on the Opportunities page. Scroll the tab row horizontally if on mobile.
- If counts show 0, try the Refresh Data button to populate that category with fresh AI-researched opportunities.

---

## ESCALATION GUIDELINES
- Billing issues or payment disputes → always escalate, note the user's email and issue in the report
- Account access loss → escalate immediately
- Feature not working for 24+ hours → escalate
- For all other issues: resolve conversationally, and the transcript will be automatically forwarded to the support team when the chat closes

---

## YOUR ROLE
- Answer any question about the platform using the knowledge above
- Keep replies under 100 words unless the question genuinely requires more detail
- Be warm, direct, and specific — avoid vague answers like "please contact support"
- If a user reports a bug or billing issue, acknowledge it clearly and confirm their message will reach the team
- Never invent pricing numbers beyond what's listed above — direct to Billing page for exact current prices
- Tone: friendly, confident, startup-native`;


Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return errJson("Method Not Allowed", 405, cors);

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) return errJson("Unauthorized", 401, cors);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const geminiKey = Deno.env.get("GEMINI_API_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return errJson("Unauthorized", 401, cors);

  const adminClient = createClient(supabaseUrl, serviceKey);

  const { conversationId, message, sendReport } = await req.json().catch(() => ({}));
  if (!message && !sendReport) return errJson("Missing message", 400, cors);

  // ── Send email report ────────────────────────────────────────────────
  if (sendReport && conversationId) {
    const { data: msgs } = await adminClient
      .from("support_messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    const transcript = (msgs ?? [])
      .map((m: { role: string; content: string; created_at: string }) =>
        `[${m.role.toUpperCase()}] ${m.content}`)
      .join("\n\n");

    const emailBody = `New KRAITIN Support Conversation\n\nUser: ${user.email}\nDate: ${new Date().toUTCString()}\n\nTranscript:\n${transcript}`;

    // Send via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
    if (!resendKey) {
      console.error("RESEND_API_KEY is not set — email not sent");
    } else {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: "Kira at KRAITIN <onboarding@resend.dev>",
          to: ["theonyekachithompson@gmail.com"],
          subject: `[Kraitin Support] New conversation from ${user.email}`,
          text: emailBody,
        }),
      });
      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.error(`Resend error ${emailRes.status}:`, errText);
      } else {
        console.log("Support email sent successfully to theonyekachithompson@gmail.com");
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  // ── Get or create conversation ───────────────────────────────────────
  let convId = conversationId;
  if (!convId) {
    const { data: conv, error: convErr } = await adminClient
      .from("support_conversations")
      .insert({ user_id: user.id, user_email: user.email, status: "open" })
      .select("id").single();
    if (convErr) return errJson("Failed to create conversation", 500, cors);
    convId = conv.id;
  }

  // Save user message
  await adminClient.from("support_messages").insert({
    conversation_id: convId,
    role: "user",
    content: message,
  });

  // Fetch conversation history for context
  const { data: history } = await adminClient
    .from("support_messages")
    .select("role, content")
    .eq("conversation_id", convId)
    .order("created_at", { ascending: true })
    .limit(20);

  const contents = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: "Understood. I'm Kira, KRAITIN's support assistant. I'm ready to help." }] },
    ...(history ?? []).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  ];

  // Call Gemini via Google AI directly
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.5, maxOutputTokens: 512 },
      }),
    }
  );

  if (!geminiRes.ok) {
    console.error("Gemini error:", geminiRes.status, await geminiRes.text());
    return errJson("AI service error", 502, cors);
  }

  const geminiData = await geminiRes.json();
  const reply: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "I'm sorry, I couldn't process that. Please try again.";

  // Save assistant reply
  await adminClient.from("support_messages").insert({
    conversation_id: convId,
    role: "assistant",
    content: reply,
  });

  // Update conversation updated_at
  await adminClient.from("support_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", convId);

  return new Response(JSON.stringify({ reply, conversationId: convId }), {
    headers: { "Content-Type": "application/json", ...cors },
  });
});
