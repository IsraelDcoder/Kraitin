import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * One-click unsubscribe from daily digest emails.
 * Called via GET link in every digest email footer.
 * Validates a lightweight token (first 16 chars of service key) before updating.
 */
Deno.serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const uid   = url.searchParams.get("uid");
  const token = url.searchParams.get("token");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Simple token validation — first 16 chars of service key embedded in link
  if (!uid || !token || token !== serviceKey.slice(0, 16)) {
    return new Response(unsubHtml("Invalid or expired unsubscribe link.", false), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceKey);

  // type=weekly unsubscribes from weekly only; default unsubscribes from daily
  const isWeekly = url.searchParams.get("type") === "weekly";
  const updatePayload = isWeekly ? { weekly_digest_emails: false } : { digest_emails: false };

  const { error } = await adminClient
    .from("profiles")
    .update(updatePayload)
    .eq("id", uid);

  if (error) {
    console.error("Unsubscribe error:", error);
    return new Response(unsubHtml("Something went wrong. Please try again or manage preferences in Settings.", false), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new Response(unsubHtml("You've been unsubscribed from daily digest emails.", true), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});

function unsubHtml(message: string, success: boolean): string {
  const accent = success ? "#C5FF00" : "#f87171";
  const icon   = success ? "✓" : "✕";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Kraitin — Email Preferences</title>
<style>
  body{margin:0;background:#050507;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;}
  .card{background:#0B0F19;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 36px;max-width:420px;width:90%;text-align:center;}
  .icon{width:48px;height:48px;border-radius:50%;background:${accent}1a;border:1px solid ${accent}40;display:flex;align-items:center;justify-content:center;font-size:20px;color:${accent};margin:0 auto 20px;}
  h1{font-size:18px;font-weight:700;color:#fff;margin:0 0 10px;}
  p{font-size:13px;color:rgba(255,255,255,0.45);margin:0 0 24px;line-height:1.7;}
  a{display:inline-block;padding:10px 24px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;font-size:13px;color:rgba(255,255,255,0.6);text-decoration:none;}
  a:hover{background:rgba(255,255,255,0.08);}
</style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>Email Preferences</h1>
    <p>${message}</p>
    <a href="https://kraitin.com/settings">Manage all preferences</a>
  </div>
</body>
</html>`;
}
