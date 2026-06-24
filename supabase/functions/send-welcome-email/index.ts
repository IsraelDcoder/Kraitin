import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))
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

const welcomeHtml = (firstName: string) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Welcome to Kraitin</title>
<style>
  body { margin: 0; padding: 0; background: #050507; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { max-width: 560px; margin: 40px auto; background: #0B0F19; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; }
  .accent { height: 2px; background: linear-gradient(90deg, transparent, #C5FF00 50%, transparent); }
  .body { padding: 40px 40px 32px; }
  .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
  .logo-icon { width: 36px; height: 36px; background: rgba(197,255,0,0.1); border: 1px solid rgba(197,255,0,0.25); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .logo-text { font-size: 14px; font-weight: 900; color: #fff; letter-spacing: 0.14em; }
  h1 { font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 12px; line-height: 1.3; }
  p { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.7; margin: 0 0 20px; }
  .highlight { color: #C5FF00; }
  .cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 24px 0; }
  .card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 14px 12px; text-align: center; }
  .card-num { font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.8); margin-bottom: 4px; }
  .card-sub { font-size: 10px; color: rgba(255,255,255,0.3); line-height: 1.4; }
  .cta { display: inline-block; margin-top: 8px; padding: 12px 28px; background: #C5FF00; color: #000; font-size: 14px; font-weight: 700; border-radius: 10px; text-decoration: none; letter-spacing: 0.02em; }
  .footer { padding: 20px 40px; border-top: 1px solid rgba(255,255,255,0.05); }
  .footer p { font-size: 11px; color: rgba(255,255,255,0.2); margin: 0; line-height: 1.6; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="accent"></div>
  <div class="body">
    <div class="logo">
      <div class="logo-icon">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M13 2L4.09 12.87a1 1 0 0 0 .82 1.57H11l-1 7.53L19.91 11.13a1 1 0 0 0-.82-1.57H13l1-7.56z" stroke="#C5FF00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <span class="logo-text">KRAITIN</span>
    </div>

    <h1>Welcome aboard, ${firstName} ⚡</h1>
    <p>You just completed the Kraitin onboarding tour — you're officially set up to find your next big startup idea faster than anyone else in the room.</p>

    <div class="cards">
      <div class="card">
        <div class="card-num">500+</div>
        <div class="card-sub">Scored opportunities ready to explore</div>
      </div>
      <div class="card">
        <div class="card-num">AI Research</div>
        <div class="card-sub">Deep market analysis in 60 seconds</div>
      </div>
      <div class="card">
        <div class="card-num">Reports</div>
        <div class="card-sub">Saved and shareable research</div>
      </div>
    </div>

    <p>Here's what to do next:</p>
    <p style="color:rgba(255,255,255,0.6);">
      <strong style="color:#fff;">1.</strong> Browse the <span class="highlight">Opportunities</span> page — filter by category, score, or velocity.<br />
      <strong style="color:#fff;">2.</strong> Find an idea that sparks your interest and hit <span class="highlight">Research This</span>.<br />
      <strong style="color:#fff;">3.</strong> Read your AI-generated market report and decide if it's worth building.
    </p>

    <a href="https://kraitin.com/opportunities" class="cta">Explore Opportunities →</a>
  </div>
  <div class="footer">
    <p>You're receiving this because you just completed the Kraitin getting-started tour.<br />
    © ${new Date().getFullYear()} Kraitin. All rights reserved.</p>
  </div>
</div>
</body>
</html>`;

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return errJson("Method Not Allowed", 405, cors);

  // Auth check — must be a logged-in user
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) return errJson("Unauthorized", 401, cors);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return errJson("Unauthorized", 401, cors);

  // Idempotency: only send if this is the first completion (guide_seen just became true)
  // The caller is responsible for only calling once, but double-check here via a flag column
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: profile } = await adminClient
    .from("profiles")
    .select("guide_seen, welcome_email_sent, username, email")
    .eq("id", user.id)
    .single();

  // Skip if welcome email was already sent
  if (profile?.welcome_email_sent) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const toEmail = profile?.email || user.email || "";
  if (!toEmail) return errJson("No email address found", 400, cors);

  const firstName = (profile?.username || toEmail.split("@")[0] || "Founder")
    .replace(/_/g, " ")
    .split(" ")[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  if (!resendKey) {
    console.error("RESEND_API_KEY not set — welcome email skipped");
    return new Response(JSON.stringify({ ok: false, error: "Email service not configured" }), {
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: "Kraitin <onboarding@resend.dev>",
      to: [toEmail],
      subject: `Welcome to Kraitin, ${displayName} ⚡`,
      html: welcomeHtml(displayName),
    }),
  });

  if (!emailRes.ok) {
    const errText = await emailRes.text();
    console.error(`Resend error ${emailRes.status}:`, errText);
    return errJson("Failed to send email", 502, cors);
  }

  // Mark welcome_email_sent so we never send twice
  await adminClient
    .from("profiles")
    .update({ welcome_email_sent: true })
    .eq("id", user.id);

  console.log(`Welcome email sent to ${toEmail}`);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json", ...cors },
  });
});
