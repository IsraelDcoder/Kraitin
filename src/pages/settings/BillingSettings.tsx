import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { ExternalLink, Zap, Calendar, CreditCard, Loader2, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/settings/SettingsAtoms';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active:     { label: 'Active',    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  past_due:   { label: 'Past Due',  color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  cancelled:  { label: 'Cancelled', color: 'text-white/35 bg-white/[0.04] border-white/10' },
  expired:    { label: 'Inactive',  color: 'text-white/35 bg-white/[0.04] border-white/10' },
  incomplete: { label: 'Inactive',  color: 'text-white/35 bg-white/[0.04] border-white/10' },
};

export default function BillingSettings() {
  const { subscription } = useAuth();
  const navigate = useNavigate();
  const [portalLoading, setPortalLoading] = useState(false);

  const isActive = subscription?.status === 'active';
  const statusInfo = STATUS_CONFIG[subscription?.status ?? 'expired'] ?? STATUS_CONFIG['expired'];
  const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end;

  const planLabel = subscription?.tier === 'pro'
    ? 'Kraitin Pro'
    : null;

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
      toast.error(err instanceof Error ? err.message : 'Could not open billing portal.');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-black text-white tracking-tight">Billing</h1>
        <p className="text-[13px] text-white/35 mt-1">Manage your subscription and payment details.</p>
      </div>

      <div className="space-y-4">

        {/* ── No subscription state ── */}
        {!subscription || !isActive ? (
          <Card className="flex flex-col items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white/30" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">No active subscription</p>
              <p className="text-[12px] text-white/35 mt-1">
                Subscribe to unlock the full Kraitin platform — unlimited reports, AI agents, and competitor intelligence.
              </p>
            </div>
            <button
              onClick={() => navigate('/billing')}
              className="h-9 px-4 rounded-xl bg-[#C5FF00]/90 text-black text-[12px] font-bold hover:bg-[#C5FF00] transition-colors"
            >
              View Plans
            </button>
          </Card>
        ) : (
          <>
            {/* ── Active subscription card ── */}
            <Card className="border-white/[0.07]">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-1.5">Current Plan</p>
                  <p className="text-base font-black text-white">{planLabel ?? 'Kraitin Pro'}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', statusInfo.color)}>
                      {statusInfo.label}
                    </span>
                    {cancelAtPeriodEnd && (
                      <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full font-semibold">
                        Cancels at period end
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="h-8 px-3 rounded-lg border border-white/[0.08] text-white/50 text-[11px] font-semibold hover:border-white/20 hover:text-white/80 transition-all shrink-0 flex items-center gap-1.5 disabled:opacity-40"
                >
                  {portalLoading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <ExternalLink className="w-3 h-3" />}
                  Manage
                </button>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/[0.05]">
                {periodEnd && (
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-3.5 h-3.5 text-white/20 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-white/25 mb-0.5">
                        {cancelAtPeriodEnd ? 'Access until' : 'Next renewal'}
                      </p>
                      <p className="text-[12px] font-semibold text-white/65">
                        {periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}
                {subscription.stripe_customer_id && (
                  <div className="flex items-start gap-2.5">
                    <CreditCard className="w-3.5 h-3.5 text-white/20 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-white/25 mb-0.5">Payment method</p>
                      <button
                        onClick={openPortal}
                        className="text-[12px] font-semibold text-white/45 hover:text-white/70 transition-colors flex items-center gap-1"
                      >
                        Manage in Stripe <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Past due warning */}
              {subscription.status === 'past_due' && (
                <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-amber-400/[0.06] border border-amber-400/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[12px] text-amber-400/80">
                    Payment failed. Please update your payment method to avoid losing access.
                  </p>
                </div>
              )}
            </Card>

            {/* ── Invoices via Stripe Portal ── */}
            <Card>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-3">Invoices & Receipts</p>
              <p className="text-[12px] text-white/35 mb-4">
                All your invoices and receipts are available in the Stripe billing portal.
              </p>
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="h-9 px-4 rounded-xl border border-white/[0.08] text-white/50 text-[12px] font-semibold hover:border-white/20 hover:text-white/75 transition-all flex items-center gap-2 disabled:opacity-40"
              >
                {portalLoading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <ExternalLink className="w-3.5 h-3.5" />}
                Open Billing Portal
              </button>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
