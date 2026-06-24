import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import {
  Check, CreditCard, Calendar, Zap, AlertTriangle, ExternalLink, Coins,
  FlaskConical, ShieldCheck, Users, Code2, Rocket, FileText,
  Bookmark, BarChart2, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FREE_FEATURES = [
  'Opportunity Database',
  'Trending & Rising Opportunities',
  'Hidden Gems',
  'AI Apps, B2B SaaS, Consumer Apps',
  'Opportunity Search & Filtering',
  'Startup Scores & Growth Metrics',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Research Agent (5 credits)',
  'Validation Agent (10 credits)',
  'Competitor Intel Agent (10 credits)',
  'Startup Teardown (15 credits)',
  'MVP Planner (10 credits)',
  'Launch Agent (10 credits)',
  'Workspace & Saved Reports',
  'Watchlists & Blueprints',
  'Export Features',
  '500 AI Credits Every Month',
];

// Map of feature names to what they unlock (used in paywall banner)
const FEATURE_PERKS: Array<{ icon: typeof Zap; label: string; sub: string }> = [
  { icon: FlaskConical, label: 'Research Agent',        sub: 'Deep-dive market research in seconds' },
  { icon: ShieldCheck,  label: 'Validation Agent',      sub: 'Validate your idea with real data' },
  { icon: Users,        label: 'Competitor Intel',       sub: 'Full AI dossiers on any competitor' },
  { icon: Code2,        label: 'MVP Planner',            sub: 'Turn ideas into technical roadmaps' },
  { icon: Rocket,       label: 'Launch Agent',           sub: 'Go-to-market plans that convert' },
  { icon: FileText,     label: 'Startup Teardown',       sub: 'Learn from what others built' },
  { icon: Bookmark,     label: 'Watchlists & Blueprints',sub: 'Save and track your best opportunities' },
  { icon: BarChart2,    label: 'Kira AI Advisor',        sub: 'Your personal AI cofounder on demand' },
  { icon: Download,     label: 'Export Reports',         sub: 'Download PDF & JSON reports' },
  { icon: Coins,        label: '500 Credits / Month',    sub: 'Run up to 50 full AI analyses monthly' },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: 'Active',    color: 'text-green-400 border-green-400/30 bg-green-400/10' },
  past_due:  { label: 'Past Due',  color: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
  cancelled: { label: 'Cancelled', color: 'text-white/40 border-white/10 bg-white/5' },
};

export default function BillingPage() {
  const { user, subscription, premiumAccess, onboardingCompleted, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Track which plan button is loading independently so only the clicked button
  // shows the spinner — the other stays interactive.
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      toast.success('Payment successful! Your Pro plan is now active.');
      refreshProfile();
      // User skipped pricing during onboarding → go to dashboard, not back to billing
      if (onboardingCompleted) {
        navigate('/opportunities', { replace: true });
      }
    } else if (status === 'cancelled') {
      toast.info('Checkout cancelled. No charges were made.');
    }
  }, [searchParams, refreshProfile, onboardingCompleted, navigate]);

  // Auto-start checkout when arriving from UpgradeModal (?plan=monthly|yearly)
  useEffect(() => {
    const planParam = searchParams.get('plan') as 'monthly' | 'yearly' | null;
    if (planParam && (planParam === 'monthly' || planParam === 'yearly') && user && !premiumAccess) {
      startCheckout(planParam);
    }
    // Only run once on mount when plan param is present
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const startCheckout = async (billingPlan: 'monthly' | 'yearly' = 'monthly') => {
    setLoadingPlan(billingPlan);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ plan: billingPlan }),
      });
      const json = await res.json();
      if (json.code !== 'SUCCESS' || !json.data?.url) throw new Error(json.message || 'Checkout failed');
      window.open(json.data.url, '_blank');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed. Check Stripe configuration.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      const json = await res.json();
      if (json.code !== 'SUCCESS' || !json.data?.url) throw new Error(json.message || 'Portal unavailable');
      window.open(json.data.url, '_blank');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open billing portal. Try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const isPro = premiumAccess;
  const statusInfo = STATUS_LABELS[subscription?.status ?? 'active'] ?? STATUS_LABELS['active'];
  const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const creditsRemaining = subscription?.credits_remaining ?? 0;
  const monthlyCredits = subscription?.credits_limit ?? subscription?.monthly_credits ?? 500;
  const creditsUsed = monthlyCredits - creditsRemaining;
  const creditsPct = monthlyCredits > 0 ? Math.round((creditsRemaining / monthlyCredits) * 100) : 0;
  const creditsLow = creditsPct < 20 && isPro;

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">

        {/* Paywall banner — shown when redirected from a gated feature */}
        {searchParams.get('reason') === 'paywall' && (
          <div className="rounded-2xl border border-[#C5FF00]/20 bg-[#C5FF00]/[0.03] p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-[#C5FF00]" />
              </div>
              <div>
                <p className="text-base font-bold text-white">Unlock Pro to continue</p>
                <p className="text-white/45 text-sm mt-0.5">
                  You tried to access a Pro-only feature. Upgrade to get full access to all AI agents and tools.
                </p>
              </div>
            </div>
            {/* Feature grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {FEATURE_PERKS.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="w-7 h-7 rounded-lg bg-[#C5FF00]/10 border border-[#C5FF00]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-[#C5FF00]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/80 text-balance">{label}</p>
                    <p className="text-xs text-white/35 mt-0.5 text-pretty">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* CTA */}
            <p className="text-xs text-white/30 text-center">
              Choose a plan below to get started — cancel anytime.
            </p>
          </div>
        )}

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5 text-white/60" />
            </div>
            <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
          </div>
          <p className="text-white/40 text-sm">Manage your plan and payment details.</p>
        </div>

        {/* Current plan card — Pro */}
        {isPro && subscription && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-white/40 text-xs uppercase tracking-wider">Current Plan</p>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">Pro Plan</h2>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', statusInfo.color)}>
                    {statusInfo.label}
                  </span>
                </div>
                <p className="text-white/40 text-sm">$49/month or $490/year</p>
              </div>
              <div className="space-y-1.5 text-sm text-white/50">
                {periodEnd && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white/30" />
                    <span>Renews {periodEnd.toLocaleDateString()}</span>
                  </div>
                )}
                {subscription.cancel_at_period_end && (
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Cancels at period end</span>
                  </div>
                )}
              </div>
            </div>

            {/* Credits bar */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#C5FF00]" />
                  <span className="text-sm font-medium text-white">Monthly Credits</span>
                  {creditsLow && (
                    <span className="text-[10px] font-bold text-amber-400 border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                      Low Credits
                    </span>
                  )}
                </div>
                <span className="text-sm font-mono text-white/60">
                  <span className={cn('font-bold', creditsLow ? 'text-amber-400' : 'text-white')}>{creditsRemaining}</span>
                  <span className="text-white/30"> / {monthlyCredits}</span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', creditsLow ? 'bg-amber-400' : 'bg-[#C5FF00]')}
                  style={{ width: `${creditsPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-white/30">
                <span>{creditsUsed} used this month</span>
                <span>Resets on renewal</span>
              </div>
            </div>
          </div>
        )}

        {/* Pricing — shown to free users */}
        {!isPro && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2 text-balance">Choose Your Plan</h2>
              <p className="text-white/40 text-sm">Instant access after payment. Cancel anytime.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">

              {/* Free */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 flex flex-col h-full">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Free</p>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-4xl font-black text-white">$0</span>
                  <span className="text-white/40 text-sm">/month</span>
                </div>
                <ul className="space-y-2.5 flex-1 mb-7">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/50">
                      <Check className="w-3.5 h-3.5 text-white/30 shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <div className="w-full py-3 rounded-xl border border-white/[0.08] text-white/30 text-sm font-medium text-center">
                  Current Plan
                </div>
              </div>

              {/* Pro — highlighted */}
              <div className="relative rounded-2xl border border-[#C5FF00]/30 bg-[#C5FF00]/[0.03] p-7 flex flex-col h-full">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black text-black bg-[#C5FF00] px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                  Most Popular
                </span>
                <p className="text-[#C5FF00] text-xs uppercase tracking-wider mb-3">Pro</p>

                {/* Monthly option */}
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-black text-white">$49</span>
                  <span className="text-white/40 text-sm">/month</span>
                </div>
                <p className="text-white/30 text-xs mb-1">or $490/year <span className="text-[#C5FF00]/60">— save 17%</span></p>
                <p className="text-white/30 text-xs mb-5">500 AI credits included monthly</p>
                <ul className="space-y-2.5 flex-1 mb-7">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <Check className="w-3.5 h-3.5 text-[#C5FF00] shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <button
                    disabled={loadingPlan !== null}
                    onClick={() => startCheckout('monthly')}
                    className="w-full py-3 rounded-xl bg-[#C5FF00] text-black text-sm font-black transition-all hover:bg-[#C5FF00]/90 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loadingPlan === 'monthly' ? (
                      <><span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Redirecting…</>
                    ) : 'Start Pro — $49/month'}
                  </button>
                  <button
                    disabled={loadingPlan !== null}
                    onClick={() => startCheckout('yearly')}
                    className="w-full py-2.5 rounded-xl border border-[#C5FF00]/30 text-[#C5FF00]/70 text-sm font-semibold transition-all hover:border-[#C5FF00]/50 hover:text-[#C5FF00] disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loadingPlan === 'yearly' ? (
                      <><span className="w-3.5 h-3.5 border-2 border-[#C5FF00]/30 border-t-[#C5FF00] rounded-full animate-spin" /> Redirecting…</>
                    ) : 'Start Pro — $490/year (save 17%)'}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-center text-white/20 text-xs mt-5">Instant access. Cancel anytime.</p>
          </div>
        )}

        {/* Manage subscription — Pro only */}
        {isPro && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Manage Subscription</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: 'Update Payment Method', icon: CreditCard },
                { label: 'View Invoices', icon: ExternalLink },
              ].map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="flex items-center gap-2.5 p-3.5 rounded-xl border border-white/[0.07] text-white/50 hover:text-white/80 hover:border-white/15 transition-all text-sm disabled:opacity-50"
                >
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="text-xs text-white/25 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {portalLoading ? 'Opening portal…' : 'Cancel subscription'}
            </button>
          </div>
        )}

        {/* Billing history placeholder */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Billing History</h3>
          <p className="text-sm text-white/30">No invoices yet. Invoices will appear here after your first payment.</p>
        </div>

      </div>
    </AppLayout>
  );
}
