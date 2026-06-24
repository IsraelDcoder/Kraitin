import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@19.1.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// stripe-webhook only accepts POST from Stripe servers — no CORS needed,
// but we keep a minimal header for 200 responses.
const baseHeaders = { "Content-Type": "application/json" };

function ok(data: unknown) {
  return new Response(JSON.stringify({ code: "SUCCESS", data }), { status: 200, headers: baseHeaders });
}
function fail(msg: string, status = 400) {
  return new Response(JSON.stringify({ code: "FAIL", message: msg }), { status, headers: baseHeaders });
}

async function sendWelcomeEmail(
  stripe: Stripe,
  userId: string,
  customerId: string,
): Promise<void> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.warn("RESEND_API_KEY not set — welcome email skipped");
    return;
  }

  // Idempotency: skip if already sent
  const { data: profile } = await supabase
    .from("profiles")
    .select("welcome_email_sent, username, email")
    .eq("id", userId)
    .single();

  if (profile?.welcome_email_sent) return;

  // Get email: prefer profile record, fall back to Stripe customer
  let toEmail = profile?.email ?? "";
  if (!toEmail) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted && customer.email) toEmail = customer.email;
    } catch (_e) { /* ignore */ }
  }
  if (!toEmail) { console.warn("No email for welcome email, userId:", userId); return; }

  const rawName = profile?.username || toEmail.split("@")[0] || "Founder";
  const firstName = rawName.replace(/_/g, " ").split(" ")[0];
  const name = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Welcome to Kraitin Pro</title>
<style>
  body{margin:0;padding:0;background:#050507;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  .wrap{max-width:560px;margin:40px auto;background:#0B0F19;border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden}
  .top{height:2px;background:linear-gradient(90deg,transparent,#C5FF00 50%,transparent)}
  .body{padding:40px 40px 32px}
  .logo{display:flex;align-items:center;gap:10px;margin-bottom:32px}
  .logo-icon{width:36px;height:36px;background:rgba(197,255,0,.1);border:1px solid rgba(197,255,0,.25);border-radius:10px;display:flex;align-items:center;justify-content:center}
  .logo-text{font-size:14px;font-weight:900;color:#fff;letter-spacing:.14em}
  h1{font-size:22px;font-weight:700;color:#fff;margin:0 0 12px;line-height:1.3}
  p{font-size:14px;color:rgba(255,255,255,.5);line-height:1.7;margin:0 0 20px}
  .hl{color:#C5FF00}
  .cards{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:24px 0}
  .card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:14px 12px;text-align:center}
  .card-num{font-size:15px;font-weight:700;color:rgba(255,255,255,.8);margin-bottom:4px}
  .card-sub{font-size:10px;color:rgba(255,255,255,.3);line-height:1.4}
  .cta{display:inline-block;margin-top:8px;padding:12px 28px;background:#C5FF00;color:#000;font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;letter-spacing:.02em}
  .foot{padding:20px 40px;border-top:1px solid rgba(255,255,255,.05)}
  .foot p{font-size:11px;color:rgba(255,255,255,.2);margin:0;line-height:1.6}
</style>
</head>
<body>
<div class="wrap">
  <div class="top"></div>
  <div class="body">
    <div class="logo">
      <div class="logo-icon">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path d="M13 2L4.09 12.87a1 1 0 0 0 .82 1.57H11l-1 7.53L19.91 11.13a1 1 0 0 0-.82-1.57H13l1-7.56z" stroke="#C5FF00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="logo-text">KRAITIN</span>
    </div>
    <h1>You're now on Pro, ${name} ⚡</h1>
    <p>Your subscription is active. You have <strong style="color:#fff">500 AI credits</strong> ready to burn — here's how to get the most out of them.</p>
    <div class="cards">
      <div class="card">
        <div class="card-num">500</div>
        <div class="card-sub">Credits reset every billing cycle</div>
      </div>
      <div class="card">
        <div class="card-num">7 Agents</div>
        <div class="card-sub">Research, Validate, Teardown & more</div>
      </div>
      <div class="card">
        <div class="card-num">Blueprints</div>
        <div class="card-sub">Full MVP plans in minutes</div>
      </div>
    </div>
    <p style="color:rgba(255,255,255,.6)">
      <strong style="color:#fff">1.</strong> Browse <span class="hl">Opportunities</span> and pick an idea that resonates.<br/>
      <strong style="color:#fff">2.</strong> Run a <span class="hl">Research Agent</span> for deep market analysis (5 credits).<br/>
      <strong style="color:#fff">3.</strong> Follow with <span class="hl">Validation</span> and <span class="hl">Startup Teardown</span> — know your risks before you build.
    </p>
    <a href="https://kraitin.com/opportunities" class="cta">Start Exploring →</a>
  </div>
  <div class="foot">
    <p>You're receiving this because your Kraitin Pro subscription just activated.<br/>
    &copy; ${new Date().getFullYear()} Kraitin. All rights reserved.</p>
  </div>
</div>
</body>
</html>`;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
    body: JSON.stringify({
      from: "Kraitin <onboarding@resend.dev>",
      to: [toEmail],
      subject: `You're on Kraitin Pro, ${name} ⚡`,
      html,
    }),
  });

  if (!resp.ok) {
    console.error("Resend error:", resp.status, await resp.text());
    return;
  }

  // Mark sent so we never send twice
  await supabase
    .from("profiles")
    .update({ welcome_email_sent: true })
    .eq("id", userId);

  console.log(`Welcome email sent → ${toEmail}`);
}

async function sendRenewalEmail(
  stripe: Stripe,
  customerId: string,
  periodEnd: string,
): Promise<void> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) { console.warn("RESEND_API_KEY not set — renewal email skipped"); return; }

  // Resolve user from customer id
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();
  if (!sub?.user_id) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, email")
    .eq("id", sub.user_id)
    .single();

  let toEmail = profile?.email ?? "";
  if (!toEmail) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted && customer.email) toEmail = customer.email;
    } catch (_e) { /* ignore */ }
  }
  if (!toEmail) { console.warn("No email for renewal, customerId:", customerId); return; }

  const rawName = profile?.username || toEmail.split("@")[0] || "Founder";
  const firstName = rawName.replace(/_/g, " ").split(" ")[0];
  const name = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  // Format the next renewal date
  const renewalDate = new Date(periodEnd).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Your 500 credits just reset</title>
<style>
  body{margin:0;padding:0;background:#050507;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  .wrap{max-width:560px;margin:40px auto;background:#0B0F19;border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden}
  .top{height:2px;background:linear-gradient(90deg,transparent,#C5FF00 50%,transparent)}
  .body{padding:40px 40px 32px}
  .logo{display:flex;align-items:center;gap:10px;margin-bottom:32px}
  .logo-icon{width:36px;height:36px;background:rgba(197,255,0,.1);border:1px solid rgba(197,255,0,.25);border-radius:10px;display:flex;align-items:center;justify-content:center}
  .logo-text{font-size:14px;font-weight:900;color:#fff;letter-spacing:.14em}
  h1{font-size:22px;font-weight:700;color:#fff;margin:0 0 12px;line-height:1.3}
  p{font-size:14px;color:rgba(255,255,255,.5);line-height:1.7;margin:0 0 20px}
  .hl{color:#C5FF00}
  .credit-box{background:rgba(197,255,0,.05);border:1px solid rgba(197,255,0,.2);border-radius:12px;padding:20px 24px;margin:20px 0;text-align:center}
  .credit-num{font-size:42px;font-weight:900;color:#C5FF00;line-height:1}
  .credit-label{font-size:13px;color:rgba(255,255,255,.4);margin-top:6px}
  .meta{font-size:12px;color:rgba(255,255,255,.25);margin-top:8px}
  .cta{display:inline-block;margin-top:8px;padding:12px 28px;background:#C5FF00;color:#000;font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;letter-spacing:.02em}
  .foot{padding:20px 40px;border-top:1px solid rgba(255,255,255,.05)}
  .foot p{font-size:11px;color:rgba(255,255,255,.2);margin:0;line-height:1.6}
</style>
</head>
<body>
<div class="wrap">
  <div class="top"></div>
  <div class="body">
    <div class="logo">
      <div class="logo-icon">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path d="M13 2L4.09 12.87a1 1 0 0 0 .82 1.57H11l-1 7.53L19.91 11.13a1 1 0 0 0-.82-1.57H13l1-7.56z" stroke="#C5FF00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="logo-text">KRAITIN</span>
    </div>
    <h1>Your credits just reset, ${name} ⚡</h1>
    <p>Your Kraitin Pro subscription has renewed. A fresh batch of AI credits is ready and waiting.</p>
    <div class="credit-box">
      <div class="credit-num">500</div>
      <div class="credit-label">AI Credits restored</div>
      <div class="meta">Next reset: ${renewalDate}</div>
    </div>
    <p style="color:rgba(255,255,255,.6)">
      Put them to work:<br/>
      <span class="hl">Research Agent</span> (5 cr) &mdash; deep market dives<br/>
      <span class="hl">Validation Agent</span> (10 cr) &mdash; stress-test your idea<br/>
      <span class="hl">Startup Teardown</span> (15 cr) &mdash; risk &amp; blind-spot audit<br/>
      <span class="hl">Complete Blueprint</span> (25 cr) &mdash; full MVP plan in minutes
    </p>
    <a href="https://kraitin.com/opportunities" class="cta">Start Exploring →</a>
  </div>
  <div class="foot">
    <p>You're receiving this because your Kraitin Pro subscription just renewed.<br/>
    &copy; ${new Date().getFullYear()} Kraitin. All rights reserved.</p>
  </div>
</div>
</body>
</html>`;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
    body: JSON.stringify({
      from: "Kraitin <onboarding@resend.dev>",
      to: [toEmail],
      subject: `Your 500 Kraitin credits just reset, ${name} ⚡`,
      html,
    }),
  });

  if (!resp.ok) {
    console.error("Resend renewal error:", resp.status, await resp.text());
    return;
  }
  console.log(`Renewal email sent → ${toEmail}`);
}

async function sendCancellationEmail(
  stripe: Stripe,
  customerId: string,
): Promise<void> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) { console.warn("RESEND_API_KEY not set — cancellation email skipped"); return; }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();
  if (!sub?.user_id) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, email")
    .eq("id", sub.user_id)
    .single();

  let toEmail = profile?.email ?? "";
  if (!toEmail) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted && customer.email) toEmail = customer.email;
    } catch (_e) { /* ignore */ }
  }
  if (!toEmail) { console.warn("No email for cancellation, customerId:", customerId); return; }

  const rawName = profile?.username || toEmail.split("@")[0] || "Founder";
  const firstName = rawName.replace(/_/g, " ").split(" ")[0];
  const name = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Your Kraitin Pro subscription has been cancelled</title>
<style>
  body{margin:0;padding:0;background:#050507;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  .wrap{max-width:560px;margin:40px auto;background:#0B0F19;border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden}
  .top{height:2px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15) 50%,transparent)}
  .body{padding:40px 40px 32px}
  .logo{display:flex;align-items:center;gap:10px;margin-bottom:32px}
  .logo-icon{width:36px;height:36px;background:rgba(197,255,0,.1);border:1px solid rgba(197,255,0,.25);border-radius:10px;display:flex;align-items:center;justify-content:center}
  .logo-text{font-size:14px;font-weight:900;color:#fff;letter-spacing:.14em}
  h1{font-size:22px;font-weight:700;color:#fff;margin:0 0 12px;line-height:1.3}
  p{font-size:14px;color:rgba(255,255,255,.5);line-height:1.7;margin:0 0 20px}
  .hl{color:#C5FF00}
  .info-box{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:20px 24px;margin:20px 0}
  .info-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)}
  .info-row:last-child{border-bottom:none}
  .info-label{font-size:13px;color:rgba(255,255,255,.3)}
  .info-val{font-size:13px;color:rgba(255,255,255,.7);font-weight:600}
  .cta{display:inline-block;margin-top:8px;padding:12px 28px;background:#C5FF00;color:#000;font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;letter-spacing:.02em}
  .foot{padding:20px 40px;border-top:1px solid rgba(255,255,255,.05)}
  .foot p{font-size:11px;color:rgba(255,255,255,.2);margin:0;line-height:1.6}
</style>
</head>
<body>
<div class="wrap">
  <div class="top"></div>
  <div class="body">
    <div class="logo">
      <div class="logo-icon">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path d="M13 2L4.09 12.87a1 1 0 0 0 .82 1.57H11l-1 7.53L19.91 11.13a1 1 0 0 0-.82-1.57H13l1-7.56z" stroke="#C5FF00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="logo-text">KRAITIN</span>
    </div>
    <h1>Your Pro subscription is cancelled, ${name}</h1>
    <p>We've received your cancellation. Your account has been moved to the Free plan — no further charges will be made.</p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Plan</span>
        <span class="info-val">Free (downgraded from Pro)</span>
      </div>
      <div class="info-row">
        <span class="info-label">AI Credits</span>
        <span class="info-val">Not included on Free</span>
      </div>
      <div class="info-row">
        <span class="info-label">Opportunity Database</span>
        <span class="info-val">Still available</span>
      </div>
    </div>
    <p style="color:rgba(255,255,255,.6)">
      You still have full access to the <span class="hl">Opportunities</span> database, trending scores, and search.<br/>
      Whenever you're ready to build again, your AI Cofounder will be here.
    </p>
    <a href="https://kraitin.com/billing" class="cta">Reactivate Pro →</a>
  </div>
  <div class="foot">
    <p>You're receiving this because your Kraitin Pro subscription was cancelled.<br/>
    &copy; ${new Date().getFullYear()} Kraitin. All rights reserved.</p>
  </div>
</div>
</body>
</html>`;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
    body: JSON.stringify({
      from: "Kraitin <onboarding@resend.dev>",
      to: [toEmail],
      subject: `Your Kraitin Pro subscription has been cancelled`,
      html,
    }),
  });

  if (!resp.ok) {
    console.error("Resend cancellation error:", resp.status, await resp.text());
    return;
  }
  console.log(`Cancellation email sent → ${toEmail}`);
}

const COMMISSION_RATE = 0.30;

/**
 * processAffiliateCommission
 * Called on every successful invoice.paid event.
 * - Looks up who referred the customer via profiles.referred_by
 * - Finds the affiliate record for that referral code
 * - Prevents self-referral and duplicate commissions (idempotency via stripe_invoice_id)
 * - Records a 'paid' referral_event and updates affiliate stats
 */
async function processAffiliateCommission(
  customerId: string,
  invoiceId: string,
  amountPaid: number, // in cents
): Promise<void> {
  // 1. Find the Supabase user from stripe_customer_id
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();
  if (!sub?.user_id) return;

  const userId = sub.user_id;

  // 2. Look up who referred this user
  const { data: profile } = await supabase
    .from("profiles")
    .select("referred_by")
    .eq("id", userId)
    .single();
  if (!profile?.referred_by) return; // not a referred user

  const referralCode = profile.referred_by;

  // 3. Look up the affiliate record
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, user_id, status")
    .eq("referral_code", referralCode)
    .single();
  if (!affiliate || affiliate.status !== "active") return;

  // 4. Fraud: no self-referral
  if (affiliate.user_id === userId) {
    console.warn(`Self-referral blocked: user ${userId} referred_by own code ${referralCode}`);
    return;
  }

  // 5. Idempotency: skip if this invoice already generated a commission
  const { data: existing } = await supabase
    .from("referral_events")
    .select("id")
    .eq("stripe_invoice_id", invoiceId)
    .eq("event_type", "paid")
    .maybeSingle();
  if (existing) {
    console.log(`Commission already recorded for invoice ${invoiceId} — skipping`);
    return;
  }

  // 6. Calculate commission (30% of invoice amount)
  const commissionAmount = parseFloat(((amountPaid / 100) * COMMISSION_RATE).toFixed(2));

  // 7. Insert commission event
  await supabase.from("referral_events").insert({
    affiliate_id: affiliate.id,
    event_type: "paid",
    referred_user: userId,
    amount: commissionAmount,
    stripe_invoice_id: invoiceId,
    metadata: { stripe_customer_id: customerId, invoice_id: invoiceId, amount_paid_cents: amountPaid },
  });

  // 8. Update affiliate counters atomically
  const { data: current } = await supabase
    .from("affiliates")
    .select("total_commission, lifetime_earnings, pending_earnings, mrr_generated")
    .eq("id", affiliate.id)
    .single();

  if (current) {
    await supabase.from("affiliates").update({
      total_commission:  Number(current.total_commission)  + commissionAmount,
      pending_earnings:  Number(current.pending_earnings)  + commissionAmount,
      lifetime_earnings: Number(current.lifetime_earnings) + commissionAmount,
      mrr_generated:     Number(current.mrr_generated)     + amountPaid / 100,
      updated_at: new Date().toISOString(),
    }).eq("id", affiliate.id);
  }

  console.log(`Commission $${commissionAmount} recorded for affiliate ${referralCode} (invoice ${invoiceId})`);
}

/**
 * recordAffiliateSignup
 * Called after checkout.session.completed for a referred user.
 * Increments total_signups and total_paid counters on the affiliate.
 */
async function recordAffiliateSignup(userId: string): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("referred_by")
    .eq("id", userId)
    .single();
  if (!profile?.referred_by) return;

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, total_signups, total_paid, conversion_rate, total_clicks")
    .eq("referral_code", profile.referred_by)
    .single();
  if (!affiliate) return;

  const newSignups = affiliate.total_signups + 1;
  const newPaid    = affiliate.total_paid + 1;
  const convRate   = affiliate.total_clicks > 0
    ? parseFloat(((newPaid / affiliate.total_clicks) * 100).toFixed(1))
    : 0;

  await supabase.from("affiliates").update({
    total_signups: newSignups,
    total_paid:    newPaid,
    conversion_rate: convRate,
    updated_at: new Date().toISOString(),
  }).eq("id", affiliate.id);

  // Record signup event (idempotency: one signup event per referred_user)
  const { data: existingSignup } = await supabase
    .from("referral_events")
    .select("id")
    .eq("affiliate_id", affiliate.id)
    .eq("referred_user", userId)
    .eq("event_type", "signup")
    .maybeSingle();

  if (!existingSignup) {
    await supabase.from("referral_events").insert({
      affiliate_id: affiliate.id,
      event_type: "signup",
      referred_user: userId,
    });
  }
}

async function syncSubscription(stripe: Stripe, stripeSubId: string, userId?: string) {
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
  const uid = userId || (stripeSub.metadata?.user_id as string);
  if (!uid) return;

  const isActive = stripeSub.status === "active";
  const tier = isActive ? "pro" : "free";
  const periodStart = new Date(stripeSub.current_period_start * 1000).toISOString();
  const periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();

  await supabase.from("subscriptions").upsert({
    user_id: uid,
    stripe_subscription_id: stripeSubId,
    stripe_customer_id: typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer.id,
    stripe_price_id: stripeSub.items.data[0]?.price.id,
    tier,
    status: isActive ? "active" : (stripeSub.status === "canceled" ? "cancelled" : "past_due"),
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cancel_at_period_end: stripeSub.cancel_at_period_end,
    // Credits set when subscription becomes active or renews (handled in invoice.paid)
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: baseHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey || !webhookSecret) return fail("Stripe not configured", 500);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" as "2024-06-20" });

    const sig = req.headers.get("stripe-signature");
    if (!sig) return fail("Missing stripe-signature", 400);

    const body = await req.text();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch {
      return fail("Invalid webhook signature", 400);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        const userId = session.metadata?.user_id;
        if (subId) await syncSubscription(stripe, subId, userId);
        // Fire-and-forget welcome email on first successful payment
        if (userId && session.customer) {
          const custId = typeof session.customer === "string" ? session.customer : session.customer.id;
          sendWelcomeEmail(stripe, userId, custId).catch((e) =>
            console.error("Welcome email error:", e)
          );
          // Record affiliate signup attribution (non-blocking)
          recordAffiliateSignup(userId).catch((e) =>
            console.error("Affiliate signup record error:", e)
          );
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(stripe, sub.id);
        // If cancelled/deleted → downgrade to free with no credits + send cancellation email
        if (sub.status === "canceled" || event.type === "customer.subscription.deleted") {
          const custId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
          if (custId) {
            await supabase.from("subscriptions")
              .update({
                tier: "free",
                credits_remaining: 0,
                credits_limit: 0,
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_customer_id", custId);
            // Fire-and-forget cancellation confirmation email
            sendCancellationEmail(stripe, custId).catch((e) =>
              console.error("Cancellation email error:", e)
            );
          }
        }
        break;
      }
      // invoice.paid fires on new subscriptions; invoice.payment_succeeded fires on renewals.
      // Handle both to ensure credits always reset on any successful charge.
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const inv = event.data.object as Stripe.Invoice;
        const subId = typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id;
        if (subId) {
          // Sync subscription state first
          await syncSubscription(stripe, subId);
          // Then reset credits to 500 for the new billing cycle
          const custId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
          if (custId) {
            const stripeSub = await stripe.subscriptions.retrieve(subId);
            const periodStart = new Date(stripeSub.current_period_start * 1000).toISOString();
            const periodEnd   = new Date(stripeSub.current_period_end   * 1000).toISOString();
            await supabase.from("subscriptions")
              .update({
                credits_remaining: 500,
                credits_limit: 500,
                current_period_start: periodStart,
                current_period_end: periodEnd,
                tier: "pro",
                status: "active",
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_customer_id", custId);
            // Send credits-reset notification (fire-and-forget, non-blocking)
            sendRenewalEmail(stripe, custId, periodEnd).catch((e) =>
              console.error("Renewal email error:", e)
            );
            // Process affiliate commission for this invoice (idempotent)
            if (inv.id && inv.amount_paid) {
              processAffiliateCommission(custId, inv.id, inv.amount_paid).catch((e) =>
                console.error("Affiliate commission error:", e)
              );
            }
          }
        }
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const subId = typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id;
        if (subId) {
          const cust = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
          if (cust) {
            await supabase.from("subscriptions")
              .update({ status: "past_due", updated_at: new Date().toISOString() })
              .eq("stripe_customer_id", cust);
          }
        }
        break;
      }
    }

    return ok({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return fail(err instanceof Error ? err.message : "Webhook processing failed", 500);
  }
});
