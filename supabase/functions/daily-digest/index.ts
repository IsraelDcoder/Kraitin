import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))
      ? origin : ALLOWED_ORIGINS[0] ?? "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Vary": "Origin",
  };
}

/* ── Velocity badge helper ─────────────────────────────────── */
function velocityColor(v: string): string {
  if (v?.toLowerCase().includes("explosive")) return "#C5FF00";
  if (v?.toLowerCase().includes("rising"))    return "#60a5fa";
  return "#94a3b8";
}

/* ── HTML email builder ────────────────────────────────────── */
function buildEmail(
  firstName: string,
  opportunities: Array<{ title: string; category: string; score: number; growth_pct: number; velocity: string; tam: string; mrr_range: string }>,
  dateStr: string,
  unsubUrl: string,
): string {
  const oppRows = opportunities.map((o, i) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:top;padding-right:12px;">
              <div style="font-size:11px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;">${o.category}</div>
              <div style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.85);margin-bottom:4px;">${i + 1}. ${o.title}</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <span style="font-size:11px;color:rgba(255,255,255,0.35);">TAM ${o.tam}</span>
                <span style="font-size:11px;color:rgba(255,255,255,0.35);">·</span>
                <span style="font-size:11px;color:rgba(255,255,255,0.35);">${o.mrr_range}/mo potential</span>
                <span style="font-size:11px;color:rgba(255,255,255,0.35);">·</span>
                <span style="font-size:11px;color:${velocityColor(o.velocity)};">${o.velocity}</span>
              </div>
            </td>
            <td style="vertical-align:top;text-align:right;white-space:nowrap;">
              <div style="font-size:22px;font-weight:800;color:#C5FF00;font-family:monospace;">${o.score}</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.25);">SCORE</div>
              <div style="font-size:12px;color:#4ade80;margin-top:2px;">+${o.growth_pct}% YoY</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Kraitin Daily Intelligence — ${dateStr}</title>
</head>
<body style="margin:0;padding:0;background:#050507;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050507;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

        <!-- Card -->
        <tr><td style="background:#0B0F19;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">

          <!-- Top accent -->
          <div style="height:2px;background:linear-gradient(90deg,transparent,#C5FF00 50%,transparent);"></div>

          <!-- Body -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:32px 32px 0;">

              <!-- Logo row -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="width:36px;height:36px;background:rgba(197,255,0,0.1);border:1px solid rgba(197,255,0,0.25);border-radius:10px;text-align:center;vertical-align:middle;padding:0;">
                    <span style="font-size:16px;line-height:36px;">⚡</span>
                  </td>
                  <td style="padding-left:10px;">
                    <div style="font-size:13px;font-weight:900;color:#fff;letter-spacing:0.14em;">KRAITIN</div>
                    <div style="font-size:10px;color:rgba(255,255,255,0.25);margin-top:1px;">Daily Intelligence</div>
                  </td>
                  <td align="right" style="vertical-align:bottom;">
                    <div style="font-size:11px;color:rgba(255,255,255,0.2);">${dateStr}</div>
                  </td>
                </tr>
              </table>

              <!-- Headline -->
              <h1 style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px;line-height:1.3;">
                Good morning, ${firstName} 👋
              </h1>
              <p style="font-size:13px;color:rgba(255,255,255,0.45);margin:0 0 24px;line-height:1.7;">
                Here are today's <strong style="color:rgba(255,255,255,0.7);">top ${opportunities.length} trending opportunities</strong> across the startup landscape — ranked by market momentum.
              </p>

              <!-- Opportunities table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                ${oppRows}
              </table>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="border-radius:10px;background:#C5FF00;">
                    <a href="https://kraitin.com/opportunities" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#000;text-decoration:none;letter-spacing:0.02em;">
                      Explore All Opportunities →
                    </a>
                  </td>
                  <td style="padding-left:12px;">
                    <a href="https://kraitin.com/research" style="display:inline-block;padding:12px 20px;font-size:13px;font-weight:600;color:rgba(255,255,255,0.55);text-decoration:none;border:1px solid rgba(255,255,255,0.1);border-radius:10px;letter-spacing:0.02em;">
                      Run AI Research
                    </a>
                  </td>
                </tr>
              </table>

            </td></tr>
          </table>

          <!-- Footer -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:16px 32px 24px;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:0;line-height:1.7;">
                You're receiving this because you signed up for Kraitin Daily Intelligence.<br/>
                <a href="${unsubUrl}" style="color:rgba(255,255,255,0.3);text-decoration:underline;">Unsubscribe</a>
                &nbsp;·&nbsp;
                <a href="https://kraitin.com/settings" style="color:rgba(255,255,255,0.3);text-decoration:underline;">Manage preferences</a>
                &nbsp;·&nbsp;© ${new Date().getFullYear()} Kraitin
              </p>
            </td></tr>
          </table>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ── Main handler ──────────────────────────────────────────── */
Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  // Accept POST from cron (service role) or admin trigger
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey   = Deno.env.get("RESEND_API_KEY") ?? "";

  if (!resendKey) {
    console.error("RESEND_API_KEY not set — digest aborted");
    return new Response(JSON.stringify({ error: "Email service not configured" }), { status: 500, headers: cors });
  }

  const adminClient = createClient(supabaseUrl, serviceKey);

  // ── 1. Fetch top 5 trending opportunities ───────────────────
  const { data: opps, error: oppErr } = await adminClient
    .from("opportunities")
    .select("title, category, score, growth_pct, velocity, tam, mrr_range")
    .gte("score", 80)
    .order("growth_pct", { ascending: false })
    .limit(5);

  if (oppErr || !opps?.length) {
    console.error("Failed to fetch opportunities:", oppErr);
    return new Response(JSON.stringify({ error: "No opportunities found" }), { status: 500, headers: cors });
  }

  // ── 2. Fetch all opted-in users ─────────────────────────────
  const { data: profiles, error: profileErr } = await adminClient
    .from("profiles")
    .select("id, email, username")
    .eq("digest_emails", true)
    .not("email", "is", null);

  if (profileErr || !profiles?.length) {
    console.log("No opted-in users found or error:", profileErr);
    return new Response(JSON.stringify({ ok: true, sent: 0 }), { headers: { "Content-Type": "application/json", ...cors } });
  }

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  // ── 3. Send emails in batches of 10 (Resend free tier limit) ─
  let sent = 0;
  let failed = 0;

  for (const profile of profiles) {
    const toEmail = profile.email;
    if (!toEmail) continue;

    const raw = profile.username || toEmail.split("@")[0] || "Founder";
    const firstName = raw.replace(/_/g, " ").split(" ")[0];
    const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

    // Build unique unsubscribe URL using user id
    const unsubUrl = `${supabaseUrl}/functions/v1/unsubscribe-digest?uid=${profile.id}&token=${serviceKey.slice(0, 16)}`;

    const html = buildEmail(displayName, opps, dateStr, unsubUrl);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Kraitin Intelligence <onboarding@resend.dev>",
        to: [toEmail],
        subject: `⚡ ${dateStr} — Today's Top Startup Opportunities`,
        html,
      }),
    });

    if (res.ok) {
      sent++;
    } else {
      failed++;
      const errText = await res.text();
      console.error(`Failed for ${toEmail} (${res.status}):`, errText);
    }

    // Small delay between sends to stay within rate limits
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`Daily digest: ${sent} sent, ${failed} failed`);
  return new Response(JSON.stringify({ ok: true, sent, failed }), {
    headers: { "Content-Type": "application/json", ...cors },
  });
});
