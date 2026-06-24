import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Copy, Check, TrendingUp, Users, MousePointer,
  DollarSign, CreditCard, BarChart2, Zap, ArrowUpRight,
  ChevronRight, Clock, ExternalLink, RefreshCw,
  PlayCircle, UserCheck, AlertCircle, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getOrCreateAffiliate, getReferralEvents, getPayouts } from '@/api/affiliateApi';
import type { Affiliate, ReferralEvent, Payout } from '@/types/types';

/* ─── HELPERS ────────────────────────────────────────────── */
const COMMISSION_RATE = 0.30;
const MONTHLY_PRICE = 49;

function fmt$(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const EVENT_LABELS: Record<ReferralEvent['event_type'], string> = {
  click: 'Link Click',
  signup: 'New Signup',
  trial: 'Trial Started',
  paid: 'Paid Customer',
  churned: 'Churned',
};
const EVENT_COLORS: Record<ReferralEvent['event_type'], string> = {
  click: 'text-white/40',
  signup: 'text-blue-400',
  trial: 'text-purple-400',
  paid: 'text-[#C5FF00]',
  churned: 'text-red-400',
};
const EVENT_DOT: Record<ReferralEvent['event_type'], string> = {
  click: 'bg-white/20',
  signup: 'bg-blue-400',
  trial: 'bg-purple-400',
  paid: 'bg-[#C5FF00]',
  churned: 'bg-red-400',
};

const PAYOUT_STATUS_STYLE: Record<Payout['status'], string> = {
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  processing: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  paid: 'text-[#C5FF00] bg-[#C5FF00]/10 border-[#C5FF00]/20',
  failed: 'text-red-400 bg-red-400/10 border-red-400/20',
};

/* ─── STAT CARD ──────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, highlight = false }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 transition-colors ${highlight ? 'border-[#C5FF00]/20 bg-[#C5FF00]/[0.04]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${highlight ? 'border-[#C5FF00]/30 bg-[#C5FF00]/10' : 'border-white/[0.08] bg-white/[0.04]'}`}>
          <Icon className={`w-4 h-4 ${highlight ? 'text-[#C5FF00]' : 'text-white/50'}`} />
        </div>
      </div>
      <p className="text-white/40 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-black ${highlight ? 'text-[#C5FF00]' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-white/25 text-xs mt-1">{sub}</p>}
    </div>
  );
}

/* ─── COPY BUTTON ────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.07] text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-[#C5FF00]" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  );
}

/* ─── AFFILIATE STATUS BADGE ─────────────────────────────── */
function StatusBadge({ status }: { status: Affiliate['status'] }) {
  const map = {
    active: 'text-[#C5FF00] bg-[#C5FF00]/10 border-[#C5FF00]/20',
    pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    suspended: 'text-red-400 bg-red-400/10 border-red-400/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${map[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/* ─── EMPTY STATE ────────────────────────────────────────── */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-white/20 text-sm">{message}</p>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────── */
export default function AffiliateDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [events, setEvents] = useState<ReferralEvent[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [eventCursor, setEventCursor] = useState<string | null>(null);
  const [payoutCursor, setPayoutCursor] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMoreEvents, setLoadingMoreEvents] = useState(false);
  const [loadingMorePayouts, setLoadingMorePayouts] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'payouts'>('activity');

  // Guard: redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
  }, [authLoading, user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    const aff = await getOrCreateAffiliate(user.id);
    setAffiliate(aff);
    if (aff) {
      const [evResult, pyResult] = await Promise.all([
        getReferralEvents(aff.id),
        getPayouts(aff.id),
      ]);
      setEvents(evResult.items);
      setEventCursor(evResult.nextCursor);
      setPayouts(pyResult.items);
      setPayoutCursor(pyResult.nextCursor);
    }
    setLoadingData(false);
  }, [user]);

  useEffect(() => { if (!authLoading && user) load(); }, [authLoading, user, load]);

  const loadMoreEvents = async () => {
    if (!affiliate || !eventCursor) return;
    setLoadingMoreEvents(true);
    const result = await getReferralEvents(affiliate.id, eventCursor);
    setEvents((prev) => [...prev, ...result.items]);
    setEventCursor(result.nextCursor);
    setLoadingMoreEvents(false);
  };

  const loadMorePayouts = async () => {
    if (!affiliate || !payoutCursor) return;
    setLoadingMorePayouts(true);
    const result = await getPayouts(affiliate.id, payoutCursor);
    setPayouts((prev) => [...prev, ...result.items]);
    setPayoutCursor(result.nextCursor);
    setLoadingMorePayouts(false);
  };

  const referralUrl = affiliate
    ? `${window.location.origin}/?ref=${affiliate.referral_code}`
    : '';

  // Derived stats
  const monthlyCommission = affiliate ? affiliate.total_commission : 0;
  const pendingPayout = payouts
    .filter((p) => p.status === 'pending' || p.status === 'processing')
    .reduce((s, p) => s + p.amount, 0);

  /* ── loading / auth states ── */
  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#C5FF00] animate-spin" />
      </div>
    );
  }
  if (!user || !affiliate) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-white/60 text-sm mb-4">Unable to load your affiliate account.</p>
          <button onClick={load} className="text-[#C5FF00] text-sm font-semibold">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-montserrat">

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-40 border-b border-white/[0.06]"
        style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-[#C5FF00] flex items-center justify-center">
                <span className="text-black font-black text-sm">K</span>
              </div>
              <span className="font-bold text-white/70 text-sm">kraitin</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-white/20 shrink-0" />
            <span className="text-white/50 text-sm truncate">Affiliate Dashboard</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={affiliate.status} />
            <button
              onClick={load}
              className="p-2 rounded-lg border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
              title="Refresh data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <Link
              to="/affiliate"
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Affiliate Page
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-[#C5FF00] text-xs font-semibold uppercase tracking-widest mb-2">Your Affiliate Account</p>
              <h1 className="text-2xl md:text-3xl font-black text-balance">Affiliate Dashboard</h1>
              <p className="text-white/35 text-sm mt-1">
                Member since {fmtDate(affiliate.created_at)}
              </p>
            </div>
            {/* referral link block */}
            <div className="flex-shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 min-w-0 max-w-full md:max-w-md">
              <div className="min-w-0 flex-1">
                <p className="text-white/30 text-xs mb-1">Your Referral Link</p>
                <p className="text-white/70 text-sm font-mono truncate">{referralUrl}</p>
              </div>
              <CopyButton text={referralUrl} />
            </div>
          </div>
        </div>

        {/* ── STATS GRID ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <StatCard icon={MousePointer} label="Total Clicks" value={affiliate.total_clicks.toLocaleString()} sub="All time" />
          <StatCard icon={UserCheck} label="Signups" value={affiliate.total_signups.toLocaleString()} sub="From your link" />
          <StatCard icon={PlayCircle} label="Trials Started" value={affiliate.total_trials.toLocaleString()} sub="Active trials" />
          <StatCard icon={Users} label="Paid Customers" value={affiliate.total_paid.toLocaleString()} sub="Currently subscribed" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <StatCard icon={BarChart2} label="Conversion Rate" value={`${affiliate.conversion_rate.toFixed(1)}%`} sub="Clicks → paid" />
          <StatCard icon={TrendingUp} label="Monthly Commission" value={fmt$(monthlyCommission)} sub={`${(COMMISSION_RATE * 100).toFixed(0)}% of $${MONTHLY_PRICE}/mo`} />
          <StatCard icon={Clock} label="Pending Payout" value={fmt$(pendingPayout)} sub="Next payment" highlight={pendingPayout > 0} />
          <StatCard icon={DollarSign} label="Lifetime Earnings" value={fmt$(affiliate.lifetime_earnings)} sub="Total paid out" highlight />
        </div>

        {/* ── MONTHLY EARNINGS PREVIEW ────────────────────────── */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Earning Potential</p>
              <p className="text-white font-bold">Based on {affiliate.total_paid} active paying customers</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-white/30 text-xs">Monthly</p>
                <p className="text-xl font-black text-white">{fmt$(affiliate.total_paid * MONTHLY_PRICE * COMMISSION_RATE)}</p>
              </div>
              <div className="w-px h-8 bg-white/[0.08]" />
              <div className="text-right">
                <p className="text-white/30 text-xs">Annual Run Rate</p>
                <p className="text-xl font-black text-[#C5FF00]">{fmt$(affiliate.total_paid * MONTHLY_PRICE * COMMISSION_RATE * 12)}</p>
              </div>
            </div>
          </div>
          {/* simple bar visualization */}
          <div className="flex items-end gap-1 h-12">
            {[0.3, 0.5, 0.45, 0.65, 0.55, 0.7, 0.6, 0.8, 0.72, 0.9, 0.85, 1].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm transition-all"
                style={{
                  height: `${h * 100}%`,
                  background: i === 11 ? '#C5FF00' : `rgba(197,255,0,${0.1 + h * 0.15})`,
                }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m) => (
              <span key={m} className="text-[9px] text-white/15">{m}</span>
            ))}
          </div>
        </div>

        {/* ── TABS: ACTIVITY / PAYOUTS ────────────────────────── */}
        <div className="flex items-center gap-1 border-b border-white/[0.06] mb-6">
          {([['activity', 'Activity Feed'], ['payouts', 'Payout History']] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                activeTab === tab
                  ? 'border-[#C5FF00] text-[#C5FF00]'
                  : 'border-transparent text-white/35 hover:text-white/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── ACTIVITY FEED ───────────────────────────────────── */}
        {activeTab === 'activity' && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            {events.length === 0 ? (
              <EmptyState message="No activity yet. Share your referral link to start tracking clicks and signups." />
            ) : (
              <>
                <div className="divide-y divide-white/[0.04]">
                  {events.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${EVENT_DOT[ev.event_type]}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${EVENT_COLORS[ev.event_type]}`}>
                          {EVENT_LABELS[ev.event_type]}
                        </p>
                        {ev.amount && ev.amount > 0 && (
                          <p className="text-white/30 text-xs mt-0.5">Commission: {fmt$(ev.amount)}</p>
                        )}
                      </div>
                      <p className="text-white/25 text-xs shrink-0">{fmtShortDate(ev.created_at)}</p>
                    </div>
                  ))}
                </div>
                {eventCursor && (
                  <div className="border-t border-white/[0.06] p-4 text-center">
                    <button
                      onClick={loadMoreEvents}
                      disabled={loadingMoreEvents}
                      className="text-sm text-white/40 hover:text-white/70 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                      {loadingMoreEvents && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Load more events
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── PAYOUT HISTORY ──────────────────────────────────── */}
        {activeTab === 'payouts' && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            {payouts.length === 0 ? (
              <EmptyState message="No payouts yet. Once your commissions accumulate, payouts appear here each month." />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left px-5 py-3.5 text-xs text-white/30 font-medium whitespace-nowrap">Period</th>
                        <th className="text-right px-4 py-3.5 text-xs text-white/30 font-medium whitespace-nowrap">Amount</th>
                        <th className="text-left px-4 py-3.5 text-xs text-white/30 font-medium whitespace-nowrap">Status</th>
                        <th className="text-left px-4 py-3.5 text-xs text-white/30 font-medium whitespace-nowrap">Paid On</th>
                        <th className="text-left px-5 py-3.5 text-xs text-white/30 font-medium whitespace-nowrap">Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {payouts.map((p) => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4 text-sm text-white/70 whitespace-nowrap">
                            {fmtDate(p.period_start)} – {fmtDate(p.period_end)}
                          </td>
                          <td className="px-4 py-4 text-right font-mono font-bold text-white whitespace-nowrap">
                            {fmt$(p.amount)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${PAYOUT_STATUS_STYLE[p.status]}`}>
                              {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-white/40 whitespace-nowrap">
                            {p.paid_at ? fmtDate(p.paid_at) : '—'}
                          </td>
                          <td className="px-5 py-4 text-sm text-white/40 whitespace-nowrap">
                            {p.payment_method ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {payoutCursor && (
                  <div className="border-t border-white/[0.06] p-4 text-center">
                    <button
                      onClick={loadMorePayouts}
                      disabled={loadingMorePayouts}
                      className="text-sm text-white/40 hover:text-white/70 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                      {loadingMorePayouts && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Load more payouts
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── RESOURCES STRIP ─────────────────────────────────── */}
        <div className="mt-10 grid md:grid-cols-3 gap-3">
          {[
            { icon: Zap, title: 'Marketing Assets', desc: 'Banners, screenshots, and swipe copy', href: '/affiliate' },
            { icon: BarChart2, title: 'Earnings Calculator', desc: 'See your potential monthly revenue', href: '/affiliate#calculator' },
            { icon: CreditCard, title: 'Payout Settings', desc: 'Configure your payment method', href: '/settings' },
          ].map(({ icon: Icon, title, desc, href }) => (
            <Link
              key={title}
              to={href}
              className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all group"
            >
              <div className="w-9 h-9 rounded-lg border border-white/[0.08] bg-white/[0.04] flex items-center justify-center shrink-0 group-hover:border-[#C5FF00]/30 group-hover:bg-[#C5FF00]/[0.06] transition-all">
                <Icon className="w-4 h-4 text-white/50 group-hover:text-[#C5FF00] transition-colors" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">{title}</p>
                <p className="text-white/30 text-xs">{desc}</p>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-white/20 group-hover:text-[#C5FF00] shrink-0 transition-colors" />
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
