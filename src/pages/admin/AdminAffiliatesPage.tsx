/**
 * /admin/affiliates — Admin panel for affiliate management.
 * Requires profile.role = 'admin'. Redirects non-admins to /.
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, DollarSign, TrendingUp, Search, Download,
  ChevronLeft, ChevronRight, Check, X, Loader2,
  RefreshCw, AlertCircle, Ban, MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';

/* ── Types ─────────────────────────────────────────────────── */
interface AffiliateRow {
  id: string;
  user_id: string;
  referral_code: string;
  status: 'pending' | 'active' | 'suspended';
  total_clicks: number;
  total_signups: number;
  total_paid: number;
  total_commission: number;
  lifetime_earnings: number;
  pending_earnings: number;
  created_at: string;
  profiles: { username: string; email: string } | null;
}

interface PayoutRow {
  id: string;
  affiliate_id: string;
  amount: number;
  status: string;
  period_start: string;
  period_end: string;
  created_at: string;
  affiliates: { referral_code: string; profiles: { username: string; email: string } | null } | null;
}

const PAGE = 25;

function fmt$(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Status badge ───────────────────────────────────────────── */
function Badge({ value }: { value: string }) {
  const map: Record<string, string> = {
    active:     'text-[#C5FF00] bg-[#C5FF00]/10 border-[#C5FF00]/20',
    pending:    'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    approved:   'text-blue-400 bg-blue-400/10 border-blue-400/20',
    processing: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    paid:       'text-[#C5FF00] bg-[#C5FF00]/10 border-[#C5FF00]/20',
    suspended:  'text-red-400 bg-red-400/10 border-red-400/20',
    rejected:   'text-red-400 bg-red-400/10 border-red-400/20',
    failed:     'text-red-400 bg-red-400/10 border-red-400/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${map[value] ?? 'text-white/40 bg-white/5 border-white/10'}`}>
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </span>
  );
}

/* ── MAIN ───────────────────────────────────────────────────── */
export default function AdminAffiliatesPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'affiliates' | 'payouts'>('affiliates');
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [payouts, setPayouts]       = useState<PayoutRow[]>([]);
  const [totalAff, setTotalAff]     = useState(0);
  const [totalPay, setTotalPay]     = useState(0);
  const [page, setPage]             = useState(0);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading]       = useState(true);
  const [actionId, setActionId]     = useState<string | null>(null);

  // Guard: admin only
  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    if (profile && profile.role !== 'admin') { navigate('/', { replace: true }); }
  }, [authLoading, user, profile, navigate]);

  /* ── Fetch affiliates ── */
  const fetchAffiliates = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('affiliates')
      .select('*, profiles(username, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE, page * PAGE + PAGE - 1);

    if (filterStatus !== 'all') q = q.eq('status', filterStatus);
    if (search) {
      q = q.or(`referral_code.ilike.%${search}%`);
    }

    const { data, count, error } = await q;
    if (!error) {
      setAffiliates((data ?? []) as AffiliateRow[]);
      setTotalAff(count ?? 0);
    } else {
      console.error('admin affiliates fetch:', error);
    }
    setLoading(false);
  }, [page, search, filterStatus]);

  /* ── Fetch payouts ── */
  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('payouts')
      .select('*, affiliates(referral_code, profiles(username, email))', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE, page * PAGE + PAGE - 1);

    if (filterStatus !== 'all') q = q.eq('status', filterStatus);

    const { data, count, error } = await q;
    if (!error) {
      setPayouts((data ?? []) as PayoutRow[]);
      setTotalPay(count ?? 0);
    }
    setLoading(false);
  }, [page, filterStatus]);

  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;
    if (tab === 'affiliates') fetchAffiliates();
    else fetchPayouts();
  }, [tab, fetchAffiliates, fetchPayouts, profile]);

  /* ── Actions ── */
  const updateAffiliateStatus = async (id: string, status: 'active' | 'suspended') => {
    setActionId(id);
    const { error } = await supabase.from('affiliates').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error('Failed to update affiliate');
    else { toast.success(`Affiliate ${status}`); fetchAffiliates(); }
    setActionId(null);
  };

  const updatePayoutStatus = async (id: string, status: 'approved' | 'paid' | 'rejected') => {
    setActionId(id);
    const updates: Record<string, string> = { status, updated_at: new Date().toISOString() };
    if (status === 'paid') updates.paid_at = new Date().toISOString();
    const { error } = await supabase.from('payouts').update(updates).eq('id', id);
    if (error) toast.error('Failed to update payout');
    else { toast.success(`Payout marked as ${status}`); fetchPayouts(); }
    setActionId(null);
  };

  /* ── CSV export ── */
  const exportCSV = () => {
    if (tab === 'affiliates') {
      const rows = [
        ['Code', 'Username', 'Email', 'Status', 'Clicks', 'Signups', 'Paid', 'Commission', 'Joined'],
        ...affiliates.map((a) => [
          a.referral_code, a.profiles?.username ?? '', a.profiles?.email ?? '',
          a.status, a.total_clicks, a.total_signups, a.total_paid,
          a.lifetime_earnings.toFixed(2), fmtDate(a.created_at),
        ]),
      ];
      const csv = rows.map((r) => r.join(',')).join('\n');
      const el = document.createElement('a');
      el.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
      el.download = `affiliates-${Date.now()}.csv`;
      el.click();
    } else {
      const rows = [
        ['Code', 'Username', 'Amount', 'Status', 'Period', 'Created'],
        ...payouts.map((p) => [
          p.affiliates?.referral_code ?? '',
          p.affiliates?.profiles?.username ?? '',
          p.amount.toFixed(2), p.status,
          `${p.period_start} - ${p.period_end}`,
          fmtDate(p.created_at),
        ]),
      ];
      const csv = rows.map((r) => r.join(',')).join('\n');
      const el = document.createElement('a');
      el.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
      el.download = `payouts-${Date.now()}.csv`;
      el.click();
    }
  };

  const totalPages = Math.ceil((tab === 'affiliates' ? totalAff : totalPay) / PAGE);
  const isAdmin = profile?.role === 'admin';

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#C5FF00] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-black text-white font-montserrat">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.06]"
        style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#C5FF00] flex items-center justify-center">
                <span className="text-black font-black text-sm">K</span>
              </div>
              <span className="font-bold text-white/60 text-sm">kraitin</span>
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white/50 text-sm">Admin</span>
            <span className="text-white/20">/</span>
            <span className="text-white text-sm font-semibold">Affiliates</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setPage(0); tab === 'affiliates' ? fetchAffiliates() : fetchPayouts(); }}
              className="p-2 rounded-lg border border-white/[0.08] text-white/40 hover:text-white/70 transition-all" title="Refresh">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20 text-xs transition-all">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[#C5FF00] text-xs font-semibold uppercase tracking-widest mb-2">Admin Panel</p>
          <h1 className="text-2xl font-black text-balance">Affiliate Management</h1>
          <p className="text-white/35 text-sm mt-1">Manage affiliates, review commissions, approve payouts.</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Users, label: 'Total Affiliates', value: totalAff.toLocaleString() },
            { icon: TrendingUp, label: 'Total Payouts', value: totalPay.toLocaleString() },
            { icon: DollarSign, label: 'Pending Approval', value: payouts.filter(p => p.status === 'pending').length.toString() },
            { icon: Check, label: 'Paid Out', value: payouts.filter(p => p.status === 'paid').length.toString() },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <Icon className="w-4 h-4 text-white/30 mb-2" />
              <p className="text-white/40 text-xs mb-1">{label}</p>
              <p className="text-xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs + filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1 border-b border-white/[0.06] md:border-none">
            {(['affiliates', 'payouts'] as const).map((t) => (
              <button key={t} onClick={() => { setTab(t); setPage(0); setFilterStatus('all'); }}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${tab === t ? 'border-[#C5FF00] text-[#C5FF00]' : 'border-transparent text-white/35 hover:text-white/60'}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {tab === 'affiliates' && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  placeholder="Search code…"
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 w-44" />
              </div>
            )}
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
              className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-white/70 focus:outline-none focus:border-white/20">
              <option value="all">All Status</option>
              {tab === 'affiliates'
                ? ['active', 'pending', 'suspended'].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)
                : ['pending', 'approved', 'paid', 'rejected'].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)
              }
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-[#C5FF00] animate-spin" />
            </div>
          ) : tab === 'affiliates' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Code', 'User', 'Status', 'Clicks', 'Signups', 'Paid', 'Earnings', 'Joined', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-white/30 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {affiliates.length === 0 ? (
                    <tr><td colSpan={9} className="py-12 text-center text-white/20 text-sm">No affiliates found</td></tr>
                  ) : affiliates.map((a) => (
                    <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-white/70 whitespace-nowrap">{a.referral_code}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm text-white">{a.profiles?.username ?? '—'}</p>
                        <p className="text-xs text-white/30">{a.profiles?.email ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge value={a.status} /></td>
                      <td className="px-4 py-3 text-sm text-white/60 whitespace-nowrap">{a.total_clicks.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-white/60 whitespace-nowrap">{a.total_signups.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-white/60 whitespace-nowrap">{a.total_paid.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-mono text-white whitespace-nowrap">{fmt$(a.lifetime_earnings)}</td>
                      <td className="px-4 py-3 text-sm text-white/40 whitespace-nowrap">{fmtDate(a.created_at)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {a.status !== 'active' && (
                            <button onClick={() => updateAffiliateStatus(a.id, 'active')} disabled={actionId === a.id}
                              className="p-1.5 rounded-lg border border-[#C5FF00]/20 text-[#C5FF00] hover:bg-[#C5FF00]/10 transition-all disabled:opacity-40" title="Activate">
                              {actionId === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          {a.status !== 'suspended' && (
                            <button onClick={() => updateAffiliateStatus(a.id, 'suspended')} disabled={actionId === a.id}
                              className="p-1.5 rounded-lg border border-red-400/20 text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-40" title="Suspend">
                              {actionId === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Affiliate', 'Amount', 'Status', 'Period', 'Created', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-white/30 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {payouts.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-white/20 text-sm">No payouts found</td></tr>
                  ) : payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm font-mono text-white/70">{p.affiliates?.referral_code ?? '—'}</p>
                        <p className="text-xs text-white/30">{p.affiliates?.profiles?.username ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono font-bold text-white whitespace-nowrap">{fmt$(p.amount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><Badge value={p.status} /></td>
                      <td className="px-4 py-3 text-sm text-white/40 whitespace-nowrap">
                        {fmtDate(p.period_start)} – {fmtDate(p.period_end)}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/40 whitespace-nowrap">{fmtDate(p.created_at)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {p.status === 'pending' && (
                            <>
                              <button onClick={() => updatePayoutStatus(p.id, 'approved')} disabled={actionId === p.id}
                                className="p-1.5 rounded-lg border border-blue-400/20 text-blue-400 hover:bg-blue-400/10 transition-all disabled:opacity-40" title="Approve">
                                {actionId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => updatePayoutStatus(p.id, 'rejected')} disabled={actionId === p.id}
                                className="p-1.5 rounded-lg border border-red-400/20 text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-40" title="Reject">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {p.status === 'approved' && (
                            <button onClick={() => updatePayoutStatus(p.id, 'paid')} disabled={actionId === p.id}
                              className="p-1.5 rounded-lg border border-[#C5FF00]/20 text-[#C5FF00] hover:bg-[#C5FF00]/10 transition-all disabled:opacity-40" title="Mark Paid">
                              {actionId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          {!['pending', 'approved'].includes(p.status) && (
                            <span className="text-white/20 text-xs px-2"><MoreHorizontal className="w-3.5 h-3.5" /></span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-white/[0.06] px-5 py-3 flex items-center justify-between">
              <p className="text-xs text-white/30">
                Page {page + 1} of {totalPages} · {tab === 'affiliates' ? totalAff : totalPay} total
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                  className="p-1.5 rounded-lg border border-white/[0.08] text-white/40 hover:text-white/70 disabled:opacity-30 transition-all">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg border border-white/[0.08] text-white/40 hover:text-white/70 disabled:opacity-30 transition-all">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Empty admin notice */}
        <div className="mt-6 rounded-xl border border-yellow-400/10 bg-yellow-400/[0.03] p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-xs text-white/40 leading-relaxed">
            Only users with <code className="text-yellow-400 bg-yellow-400/10 px-1 rounded">role = 'admin'</code> in the profiles table can access this page.
            To grant admin access, run: <code className="text-white/60 bg-white/5 px-1 rounded">UPDATE profiles SET role = 'admin' WHERE id = '...'</code>
          </p>
        </div>
      </div>
    </div>
  );
}
