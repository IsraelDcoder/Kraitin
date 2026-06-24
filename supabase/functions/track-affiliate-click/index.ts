/**
 * track-affiliate-click
 * POST { referral_code: string }
 * Increments affiliate.total_clicks and appends a click event.
 * Idempotent per (referral_code + IP) within a 30-minute window.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS") ?? "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { referral_code } = await req.json();
    if (!referral_code || typeof referral_code !== "string") {
      return new Response(JSON.stringify({ error: "referral_code required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const code = referral_code.trim().toUpperCase();

    // Look up affiliate
    const { data: affiliate, error: affErr } = await supabase
      .from("affiliates")
      .select("id, status, total_clicks")
      .eq("referral_code", code)
      .single();

    if (affErr || !affiliate) {
      return new Response(JSON.stringify({ ok: false, reason: "unknown code" }), {
        status: 200, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    if (affiliate.status !== "active") {
      return new Response(JSON.stringify({ ok: false, reason: "inactive" }), {
        status: 200, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Check for recent click from same IP (simple dedup — 30 min window)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const windowStart = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recentClick } = await supabase
      .from("referral_events")
      .select("id")
      .eq("affiliate_id", affiliate.id)
      .eq("event_type", "click")
      .eq("metadata->ip", ip)
      .gte("created_at", windowStart)
      .maybeSingle();

    if (recentClick) {
      return new Response(JSON.stringify({ ok: true, deduped: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Increment click counter
    await supabase
      .from("affiliates")
      .update({
        total_clicks: affiliate.total_clicks + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", affiliate.id);

    // Record click event
    await supabase.from("referral_events").insert({
      affiliate_id: affiliate.id,
      event_type: "click",
      metadata: { ip },
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("track-affiliate-click error:", e);
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
