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

/* ── Velocity helpers ──────────────────────────────────────── */
function velocityColor(v: string): string {
  if (v?.toLowerCase().includes("explosive")) return "#C5FF00";
  if (v?.toLowerCase().includes("rising"))    return "#60a5fa";
  return "#94a3b8";
}

function velocityDot(v: string): string {
  if (v?.toLowerCase().includes("explosive")) return "#C5FF00";
  if (v?.toLowerCase().includes("rising"))    return "#60a5fa";
  return "#64748b";
}

/* ── Types ─────────────────────────────────────────────────── */
interface Opportunity {
  title: string;
  category: string;
  score: number;
  growth_pct: number;
  velocity: string;
  tam: string;
  mrr_range: string;
}

interface WatchlistItem {
  title: string;
  category: string;
  score: number;
  growth_pct: number;
  velocity: string;
}

/* ── HTML builder ──────────────────────────────────────────── */
function buildWeeklyEmail(
  firstName: string,
  opportunities: Opportunity[],
  watchlist: WatchlistItem[],
  weekStr: string,
  unsubUrl: string,
): string {
  const oppRows = opportunities.map((o, i) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:top;padding-right:14px;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <div style="width:6px;height:6px;border-radius:50%;background:${velocityDot(o.velocity)};flex-shrink:0;"></div>
                <span style="font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.1em;">${o.category}</span>
              </div>
              <div style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.85);margin-bottom:5px;">#${i + 1} — ${o.title}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.3);">
                TAM ${o.tam}&nbsp;&nbsp;·&nbsp;&nbsp;${o.mrr_range}/mo&nbsp;&nbsp;·&nbsp;&nbsp;<span style="color:${velocityColor(o.velocity)};">${o.velocity}</span>
              </div>
            </td>
            <td style="vertical-align:top;text-align:right;white-space:nowrap;padding-left:8px;">
              <div style="font-size:24px;font-weight:900;color:#C5FF00;font-family:monospace;line-height:1;">${o.score}</div>
              <div style="font-size:9px;color:rgba(255,255,255,0.2);margin-top:2px;letter-spacing:0.08em;">SCORE</div>
              <div style="font-size:12px;font-weight:600;color:#4ade80;margin-top:3px;">+${o.growth_pct}%</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join("");

  const watchlistSection = watchlist.length > 0 ? `
    <!-- Watchlist divider -->
    <tr><td style="padding:24px 0 0;">
      <div style="height:1px;background:rgba(255,255,255,0.05);margin-bottom:20px;"></div>
      <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.2);text-transform:uppercase;letter-spacing:0.13em;margin-bottom:12px;">
        📌 Your Watchlist — ${watchlist.length} saved idea${watchlist.length > 1 ? "s" : ""}
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${watchlist.slice(0, 5).map((w) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:10px;color:rgba(255,255,255,0.25);margin-bottom:2px;">${w.category}</div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.7);">${w.title}</div>
                  </td>
                  <td style="text-align:right;white-space:nowrap;padding-left:8px;">
                    <span style="font-size:13px;font-weight:700;color:#C5FF00;font-family:monospace;">${w.score}</span>
                    <span style="font-size:10px;color:rgba(255,255,255,0.25);margin-left:6px;">+${w.growth_pct}%</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `).join("")}
      </table>
      <div style="margin-top:14px;">
        <a href="https://kraitin.com/reports?tab=watchlist"
           style="font-size:12px;color:rgba(255,255,255,0.4);text-decoration:none;border-bottom:1px solid rgba(255,255,255,0.12);">
          View full watchlist →
        </a>
      </div>
    </td></tr>
  ` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Kraitin Weekly Roundup — ${weekStr}</title>
</head>
<body style="margin:0;padding:0;background:#050507;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050507;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">
        <tr><td style="background:#0B0F19;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">

          <!-- Top accent -->
          <div style="height:2px;background:linear-gradient(90deg,transparent,#C5FF00 50%,transparent);"></div>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:32px 32px 0;">

              <!-- Logo + week badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:36px;height:36px;background:rgba(197,255,0,0.1);border:1px solid rgba(197,255,0,0.25);border-radius:10px;text-align:center;vertical-align:middle;">
                          <span style="font-size:16px;">⚡</span>
                        </td>
                        <td style="padding-left:10px;">
                          <div style="font-size:13px;font-weight:900;color:#fff;letter-spacing:0.14em;">KRAITIN</div>
                          <div style="font-size:10px;color:rgba(255,255,255,0.25);margin-top:1px;">Weekly Roundup</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <div style="display:inline-block;padding:4px 10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;font-size:10px;color:rgba(255,255,255,0.3);">
                      ${weekStr}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Headline -->
              <h1 style="font-size:21px;font-weight:700;color:#fff;margin:0 0 8px;line-height:1.3;">
                Your week in startup intelligence, ${firstName} 🗓️
              </h1>
              <p style="font-size:13px;color:rgba(255,255,255,0.4);margin:0 0 24px;line-height:1.7;">
                Here's a summary of the <strong style="color:rgba(255,255,255,0.65);">top ${opportunities.length} opportunities</strong> that gained the most momentum this week${watchlist.length > 0 ? `, plus updates on your ${watchlist.length} saved idea${watchlist.length > 1 ? "s" : ""}` : ""}.
              </p>

              <!-- Stats strip -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  ${[
                    { label: "Top Score", value: String(Math.max(...opportunities.map(o => o.score))) },
                    { label: "Avg Growth", value: `+${Math.round(opportunities.reduce((s,o)=>s+o.growth_pct,0)/opportunities.length)}%` },
                    { label: "Watchlist", value: String(watchlist.length) },
                  ].map(s => `
                    <td width="33%" style="text-align:center;padding:12px 8px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;">
                      <div style="font-size:18px;font-weight:800;color:#C5FF00;font-family:monospace;">${s.value}</div>
                      <div style="font-size:10px;color:rgba(255,255,255,0.25);margin-top:3px;text-transform:uppercase;letter-spacing:0.08em;">${s.label}</div>
                    </td>
                  `).join('<td style="width:8px;"></td>')}
                </tr>
              </table>

              <!-- Opportunities -->
              <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.2);text-transform:uppercase;letter-spacing:0.13em;margin-bottom:4px;">
                🔥 This Week's Top Opportunities
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${oppRows}
              </table>

              ${watchlistSection}

              <!-- CTA row -->
              <table cellpadding="0" cellspacing="0" style="margin-top:28px;margin-bottom:28px;">
                <tr>
                  <td style="border-radius:10px;background:#C5FF00;">
                    <a href="https://kraitin.com/opportunities"
                       style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#000;text-decoration:none;letter-spacing:0.02em;">
                      Explore Opportunities →
                    </a>
                  </td>
                  <td style="padding-left:10px;">
                    <a href="https://kraitin.com/research"
                       style="display:inline-block;padding:12px 18px;font-size:13px;font-weight:600;color:rgba(255,255,255,0.5);text-decoration:none;border:1px solid rgba(255,255,255,0.1);border-radius:10px;">
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
                Weekly roundup sent every Sunday at 7 AM UTC.<br/>
                <a href="${unsubUrl}" style="color:rgba(255,255,255,0.3);text-decoration:underline;">Unsubscribe from weekly emails</a>
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

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey   = Deno.env.get("RESEND_API_KEY") ?? "";

  if (!resendKey) {
    console.error("RESEND_API_KEY not set — weekly digest aborted");
    return new Response(JSON.stringify({ error: "Email service not configured" }), { status: 500, headers: cors });
  }

  const adminClient = createClient(supabaseUrl, serviceKey);

  // ── 1. Fetch top 7 opportunities of the week (high growth, high score) ──
  const { data: opps, error: oppErr } = await adminClient
    .from("opportunities")
    .select("title, category, score, growth_pct, velocity, tam, mrr_range")
    .gte("score", 78)
    .order("growth_pct", { ascending: false })
    .limit(7);

  if (oppErr || !opps?.length) {
    console.error("Failed to fetch opportunities:", oppErr);
    return new Response(JSON.stringify({ error: "No opportunities found" }), { status: 500, headers: cors });
  }

  // ── 2. Fetch all opted-in users ─────────────────────────────
  const { data: profiles, error: profileErr } = await adminClient
    .from("profiles")
    .select("id, email, username")
    .eq("weekly_digest_emails", true)
    .not("email", "is", null);

  if (profileErr || !profiles?.length) {
    console.log("No opted-in users:", profileErr);
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  // Week range string e.g. "Jun 16 – Jun 22, 2025"
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weekStr = `${fmt(startOfWeek)} – ${fmt(now)}, ${now.getFullYear()}`;

  let sent = 0;
  let failed = 0;

  for (const profile of profiles) {
    const toEmail = profile.email;
    if (!toEmail) continue;

    // Fetch this user's watchlist items (up to 5)
    const { data: savedItems } = await adminClient
      .from("saved_items")
      .select("item_id")
      .eq("user_id", profile.id)
      .eq("item_type", "opportunity")
      .order("created_at", { ascending: false })
      .limit(5);

    let watchlist: WatchlistItem[] = [];
    if (savedItems?.length) {
      const ids = savedItems.map((s: { item_id: string }) => s.item_id);
      const { data: watchOpps } = await adminClient
        .from("opportunities")
        .select("title, category, score, growth_pct, velocity")
        .in("id", ids);
      watchlist = (watchOpps ?? []) as WatchlistItem[];
    }

    const raw = profile.username || toEmail.split("@")[0] || "Founder";
    const firstName = raw.replace(/_/g, " ").split(" ")[0];
    const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

    const unsubUrl = `${supabaseUrl}/functions/v1/unsubscribe-digest?uid=${profile.id}&token=${serviceKey.slice(0, 16)}&type=weekly`;

    const html = buildWeeklyEmail(displayName, opps, watchlist, weekStr, unsubUrl);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Kraitin Intelligence <onboarding@resend.dev>",
        to: [toEmail],
        subject: `📊 Your Kraitin Weekly Roundup — ${weekStr}`,
        html,
      }),
    });

    if (res.ok) {
      sent++;
    } else {
      failed++;
      console.error(`Failed for ${toEmail} (${res.status}):`, await res.text());
    }

    // Rate limit buffer
    await new Promise((r) => setTimeout(r, 120));
  }

  console.log(`Weekly digest: ${sent} sent, ${failed} failed`);
  return new Response(JSON.stringify({ ok: true, sent, failed }), {
    headers: { "Content-Type": "application/json", ...cors },
  });
});
