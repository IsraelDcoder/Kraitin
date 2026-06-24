import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { supabase } from '@/db/supabase';
import type { Opportunity, Subscription } from '@/types/types';
import { cn } from '@/lib/utils';
import { slugify } from '@/lib/slugify';
import PageMeta from '@/components/common/PageMeta';
import { toast } from 'sonner';
import {
  TrendingUp, ArrowUpRight, Bookmark, BookmarkX,
  Zap, Users, BarChart2, Activity, Target,
  RefreshCw, ChevronRight, Flame, AlertCircle, Coins,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

/* ── Types ─────────────────────────────────────────────────── */
interface CompetitorAlert {
  id: string;
  name: string;
  category: string | null;
  growth_percent: number | null;
  ad_spend_estimate: string | null;
  created_at: string;
}

interface SavedItem {
  id: string;
  item_id: string;
  created_at: string;
  opportunity?: Opportunity;
}

interface MarketSegment {
  subject: string;
  growth: number;
  demand: number;
  competition: number;
}

/* ── Helpers ────────────────────────────────────────────────── */
function scoreColor(s: number) {
  if (s >= 85) return 'text-[#C5FF00]';
  if (s >= 70) return 'text-emerald-400';
  if (s >= 55) return 'text-amber-400';
  return 'text-red-400';
}

function fmtGrowth(v: number | null) {
  if (!v) return null;
  return v > 0 ? `+${v}%` : `${v}%`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

/* ── Section Header ─────────────────────────────────────────── */
function SectionHeader({
  icon: Icon,
  title,
  action,
  onAction,
  iconColor = 'text-white/40',
}: {
  icon: typeof Zap;
  title: string;
  action?: string;
  onAction?: () => void;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className={cn('w-4 h-4 shrink-0', iconColor)} />
        <h2 className="text-sm font-semibold text-white/80 tracking-wide">{title}</h2>
      </div>
      {action && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          {action} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

/* ── Skeleton Loader ─────────────────────────────────────────── */
function BlockSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 bg-white/[0.04] rounded-lg" />
      ))}
    </div>
  );
}

/* ── Empty State ─────────────────────────────────────────────── */
function EmptyState({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <AlertCircle className="w-5 h-5 text-white/15" />
      <p className="text-sm text-white/30 font-medium">{label}</p>
      <p className="text-xs text-white/20">{sub}</p>
    </div>
  );
}

/* ── Auto-refresh hook ────────────────────────────────────────
   Calls `fetcher` immediately, then every `intervalMs`.
   Returns { secondsLeft, forceRefresh, lastUpdated }.
   `lastUpdated` is a Date set after each successful fetch.
══════════════════════════════════════════════════════════════ */
const REFRESH_MS = 20 * 60 * 1000; // 20 minutes

function useAutoRefresh(fetcher: () => Promise<void>, intervalMs = REFRESH_MS) {
  const [secondsLeft, setSecondsLeft] = useState(intervalMs / 1000);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = useCallback(async () => {
    await fetcher();
    setLastUpdated(new Date());
    setSecondsLeft(intervalMs / 1000);
  }, [fetcher, intervalMs]);

  useEffect(() => {
    run();
    timerRef.current  = setInterval(run, intervalMs);
    countRef.current  = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => {
      if (timerRef.current)  clearInterval(timerRef.current);
      if (countRef.current)  clearInterval(countRef.current);
    };
  }, [run, intervalMs]);

  const forceRefresh = useCallback(() => {
    if (timerRef.current)  clearInterval(timerRef.current);
    if (countRef.current)  clearInterval(countRef.current);
    run();
    timerRef.current  = setInterval(run, intervalMs);
    countRef.current  = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
  }, [run, intervalMs]);

  return { secondsLeft, forceRefresh, lastUpdated };
}

function fmtCountdown(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function fmtLastUpdated(d: Date | null) {
  if (!d) return null;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  return `${m}m ago`;
}

/* ── Refresh bar shared UI ────────────────────────────────────── */
function RefreshBar({
  secondsLeft,
  lastUpdated,
  loading,
  onRefresh,
}: {
  secondsLeft: number;
  lastUpdated: Date | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.04]">
      <div className="flex-1 h-0.5 rounded-full bg-white/[0.05] overflow-hidden">
        <div
          className="h-full bg-white/20 rounded-full transition-all duration-1000"
          style={{ width: `${((REFRESH_MS / 1000 - secondsLeft) / (REFRESH_MS / 1000)) * 100}%` }}
        />
      </div>
      <span className="text-[10px] text-white/20 tabular-nums shrink-0">
        {lastUpdated ? `Updated ${fmtLastUpdated(lastUpdated)} · next in ${fmtCountdown(secondsLeft)}` : 'Loading…'}
      </span>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="p-1 rounded-md text-white/20 hover:text-white/50 transition-colors disabled:opacity-30"
        title="Refresh now"
      >
        <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT 1 — Today's Opportunities
   Respects the user's saved opportunity_prefs:
   - scoreThreshold: minimum opportunity_score
   - priorityCats:   show these categories first
   - hideCats:       exclude these categories
   - growthFilter:   minimum growth_percent
═══════════════════════════════════════════════════════════════ */
function TodaysOpportunities() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // Parse user's saved feed prefs
  const prefs = (profile as any)?.opportunity_prefs ?? {};
  const minScore: number = prefs.scoreThreshold?.[0] ?? 0;
  const hideCats: string[] = prefs.hideCats ?? [];
  const priorityCats: string[] = prefs.priorityCats ?? [];
  const growthFilter: string = prefs.growthFilter ?? 'Any';

  const minGrowth = growthFilter === 'Any' ? null
    : growthFilter === '+10%'  ? 10
    : growthFilter === '+25%'  ? 25
    : growthFilter === '+50%'  ? 50
    : growthFilter === '+100%' ? 100
    : null;

  // Each refresh fetches 80 rows, applies prefs client-side, shuffles, takes 6
  const fetchOpps = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('opportunities')
      .select('id,title,category,opportunity_score,growth_percent,revenue_estimate,competition_score')
      .not('opportunity_score', 'is', null)
      .order('opportunity_score', { ascending: false })
      .limit(80);

    if (minScore > 0) q = q.gte('opportunity_score', minScore);
    if (minGrowth !== null) q = q.gte('growth_percent', minGrowth);

    const { data } = await q;

    if (Array.isArray(data) && data.length > 0) {
      let arr = (data as Opportunity[]).filter(
        (o) => !hideCats.includes(o.category ?? '')
      );

      // Separate priority vs the rest
      const priority = arr.filter((o) => priorityCats.includes(o.category ?? ''));
      const rest = arr.filter((o) => !priorityCats.includes(o.category ?? ''));

      // Shuffle each group
      const shuffle = <T,>(a: T[]) => {
        const r = [...a];
        for (let i = r.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [r[i], r[j]] = [r[j], r[i]];
        }
        return r;
      };

      arr = [...shuffle(priority), ...shuffle(rest)].slice(0, 6);
      setItems(arr);
    } else {
      setItems([]);
    }
    setLoading(false);
  }, [minScore, minGrowth, hideCats.join(','), priorityCats.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const { secondsLeft, forceRefresh, lastUpdated } = useAutoRefresh(fetchOpps);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <SectionHeader
        icon={Zap}
        title="Today's Opportunities"
        action="View all"
        onAction={() => navigate('/opportunities')}
        iconColor="text-[#C5FF00]"
      />
      {loading ? (
        <BlockSkeleton rows={5} />
      ) : items.length === 0 ? (
        <EmptyState label="No opportunities yet" sub="Check back soon for new data" />
      ) : (
        <div className="space-y-2">
          {items.map((opp) => (
            <button
              key={opp.id}
              onClick={() => navigate(`/opportunity/${slugify(opp.title)}`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 text-white/30" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/80 truncate group-hover:text-white transition-colors">
                  {opp.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-white/30">{opp.category}</span>
                  {opp.revenue_estimate && (
                    <span className="text-xs text-white/20">{opp.revenue_estimate}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {opp.growth_percent != null && (
                  <span className={cn('text-xs font-medium tabular-nums', opp.growth_percent > 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {fmtGrowth(opp.growth_percent)}
                  </span>
                )}
                {opp.opportunity_score != null && (
                  <span className={cn('text-sm font-bold tabular-nums', scoreColor(opp.opportunity_score))}>
                    {opp.opportunity_score}
                  </span>
                )}
                <ArrowUpRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
      <RefreshBar secondsLeft={secondsLeft} lastUpdated={lastUpdated} loading={loading} onRefresh={forceRefresh} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT 2 — Competitor Alerts
═══════════════════════════════════════════════════════════════ */
function CompetitorAlerts() {
  const navigate = useNavigate();
  const { premiumAccess } = useAuth();
  const [items, setItems] = useState<CompetitorAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const alertTypes = ['New Feature', 'Funding Round', 'Ad Push', 'Expansion', 'Partnership'];

  // Each refresh rotates through competitors with a random shuffle
  const fetchCompetitors = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('competitors')
      .select('id,name,category,growth_percent,ad_spend_estimate,created_at')
      .order('created_at', { ascending: false })
      .limit(30);
    if (Array.isArray(data) && data.length > 0) {
      const arr = [...data] as CompetitorAlert[];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setItems(arr.slice(0, 5));
    } else {
      setItems([]);
    }
    setLoading(false);
  }, []);

  const { secondsLeft, forceRefresh, lastUpdated } = useAutoRefresh(fetchCompetitors);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <SectionHeader
        icon={Users}
        title="Competitor Analysis"
        action="Full analysis"
        onAction={() => navigate('/competitors')}
        iconColor="text-amber-400"
      />
      {loading ? (
        <BlockSkeleton rows={4} />
      ) : items.length === 0 ? (
        <EmptyState label="No competitor data" sub="Run competitor analysis to populate alerts" />
      ) : (
        <div className="space-y-2">
          {items.map((c, i) => {
            const alertType = alertTypes[i % alertTypes.length];
            return (
              <button
                key={c.id}
                onClick={() => navigate(
                  premiumAccess
                    ? `/competitors/intelligence?q=${encodeURIComponent(c.name)}`
                    : `/competitors?q=${encodeURIComponent(c.name)}`
                )}
                className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.05] transition-colors text-left group cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-amber-400/60 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{c.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400/80 border border-amber-400/20">
                      {alertType}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-white/30">{c.category}</span>
                    {c.growth_percent != null && (
                      <span className={cn('text-xs tabular-nums', c.growth_percent > 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {fmtGrowth(c.growth_percent)}
                      </span>
                    )}
                    {c.ad_spend_estimate && (
                      <span className="text-xs text-white/25">Ad: {c.ad_spend_estimate}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-white/20">{timeAgo(c.created_at)}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/20 group-hover:text-amber-400/60 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}
      <RefreshBar secondsLeft={secondsLeft} lastUpdated={lastUpdated} loading={loading} onRefresh={forceRefresh} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT 3 — Trending Keywords
═══════════════════════════════════════════════════════════════ */

const STATIC_KEYWORDS = [
  { keyword: 'AI Companion', category: 'AI', delta: 42, trend: 'up' },
  { keyword: 'AI Diet Coach', category: 'Health', delta: 38, trend: 'up' },
  { keyword: 'Study Assistant', category: 'Education', delta: 31, trend: 'up' },
  { keyword: 'Voice Agent API', category: 'Developer', delta: 29, trend: 'up' },
  { keyword: 'Legal AI', category: 'Legal', delta: 27, trend: 'up' },
  { keyword: 'Micro SaaS', category: 'B2B SaaS', delta: 24, trend: 'up' },
  { keyword: 'Solo Founder Tools', category: 'Productivity', delta: 18, trend: 'up' },
  { keyword: 'AI Video Editor', category: 'Creator', delta: 15, trend: 'up' },
];

function TrendingKeywords() {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <SectionHeader
        icon={Flame}
        title="Trending Keywords"
        action="Explore"
        onAction={() => navigate('/research')}
        iconColor="text-orange-400"
      />
      <div className="flex flex-wrap gap-2">
        {STATIC_KEYWORDS.map(({ keyword, category, delta }) => (
          <button
            key={keyword}
            onClick={() => navigate(`/research?q=${encodeURIComponent(keyword)}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.05] transition-all group"
          >
            <TrendingUp className="w-3 h-3 text-orange-400/60 group-hover:text-orange-400 transition-colors shrink-0" />
            <span className="text-xs font-medium text-white/60 group-hover:text-white/90 transition-colors">{keyword}</span>
            <span className="text-[10px] text-white/25 ml-0.5">{category}</span>
            <span className="text-[10px] text-emerald-400 tabular-nums ml-1">+{delta}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT 4 — Market Radar
═══════════════════════════════════════════════════════════════ */

const RADAR_DATA: MarketSegment[] = [
  { subject: 'AI',          growth: 92, demand: 88, competition: 75 },
  { subject: 'Health',      growth: 78, demand: 82, competition: 55 },
  { subject: 'Education',   growth: 65, demand: 70, competition: 50 },
  { subject: 'B2B SaaS',    growth: 72, demand: 65, competition: 80 },
  { subject: 'Consumer',    growth: 60, demand: 72, competition: 68 },
  { subject: 'Legal',       growth: 58, demand: 60, competition: 35 },
  { subject: 'Productivity',growth: 70, demand: 75, competition: 62 },
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0F172A] border border-white/[0.08] rounded-lg p-2.5 text-xs">
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="text-white/40">{p.name}:</span>
          <span className="text-white font-medium tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function MarketRadar() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <SectionHeader
        icon={Activity}
        title="Market Radar"
        action="Full analysis"
        onAction={() => navigate('/opportunities')}
        iconColor="text-blue-400"
      />

      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Radar Chart */}
        <div className="w-full md:w-56 h-52 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={RADAR_DATA} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
              />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Radar name="Growth" dataKey="growth" stroke="#C5FF00" fill="#C5FF00" fillOpacity={0.08} strokeWidth={1.5} />
              <Radar name="Demand" dataKey="demand" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.06} strokeWidth={1.5} />
              <Radar name="Competition" dataKey="competition" stroke="#f97316" fill="#f97316" fillOpacity={0.05} strokeWidth={1} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Segment list */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {RADAR_DATA.map(({ subject, growth, demand, competition }) => (
            <button
              key={subject}
              onMouseEnter={() => setHovered(subject)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => navigate(`/opportunities?cat=${subject}`)}
              className={cn(
                'w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left',
                hovered === subject ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'
              )}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#C5FF00]/60 shrink-0" />
              <span className="text-xs font-medium text-white/70 w-20 shrink-0">{subject}</span>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#C5FF00]/50 rounded-full transition-all duration-500"
                    style={{ width: `${growth}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/30 tabular-nums w-8 shrink-0">{growth}%</span>
                <span className={cn('text-[10px] tabular-nums shrink-0', competition < 50 ? 'text-emerald-400' : competition < 70 ? 'text-amber-400' : 'text-red-400')}>
                  {competition < 50 ? 'Low comp.' : competition < 70 ? 'Med. comp.' : 'High comp.'}
                </span>
              </div>
            </button>
          ))}
          {/* Legend */}
          <div className="flex items-center gap-4 pt-2 pl-2">
            {[{ color: 'bg-[#C5FF00]/60', label: 'Growth' }, { color: 'bg-blue-400/60', label: 'Demand' }, { color: 'bg-orange-400/60', label: 'Competition' }].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={cn('w-2 h-2 rounded-full shrink-0', color)} />
                <span className="text-[10px] text-white/30">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT 5 — Saved Opportunities
═══════════════════════════════════════════════════════════════ */
function SavedOpportunities() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const { data: saved } = await supabase
      .from('saved_items')
      .select('id, item_id, created_at')
      .eq('user_id', user.id)
      .eq('item_type', 'opportunity')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!saved?.length) { setItems([]); setLoading(false); return; }

    const ids = saved.map((s) => s.item_id);
    const { data: opps } = await supabase
      .from('opportunities')
      .select('id,title,category,opportunity_score,growth_percent')
      .in('id', ids);

    const oppMap = Object.fromEntries((opps ?? []).map((o) => [o.id, o]));
    setItems(saved.map((s) => ({ ...s, opportunity: oppMap[s.item_id] })));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from('saved_items').delete().eq('id', id);
    if (error) { toast.error('Failed to remove'); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success('Removed from watchlist');
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <SectionHeader
        icon={Bookmark}
        title="Saved Opportunities"
        action="View all"
        onAction={() => navigate('/watchlist')}
        iconColor="text-violet-400"
      />
      {loading ? (
        <BlockSkeleton rows={3} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Bookmark className="w-5 h-5 text-white/10" />
          <p className="text-sm text-white/30">No saved opportunities yet</p>
          <button
            onClick={() => navigate('/opportunities')}
            className="text-xs text-[#C5FF00]/60 hover:text-[#C5FF00] transition-colors mt-1"
          >
            Browse opportunities →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const opp = item.opportunity;
            return (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group">
                <button
                  className="flex-1 min-w-0 text-left"
                  onClick={() => opp && navigate(`/opportunity/${slugify(opp.title)}`)}
                >
                  <p className="text-sm font-medium text-white/70 truncate group-hover:text-white/90 transition-colors">
                    {opp?.title ?? item.item_id.slice(0, 16) + '…'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-white/25">{opp?.category}</span>
                    <span className="text-xs text-white/20">{timeAgo(item.created_at)}</span>
                    {opp?.growth_percent != null && (
                      <span className={cn('text-xs tabular-nums', opp.growth_percent > 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {fmtGrowth(opp.growth_percent)}
                      </span>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  {opp?.opportunity_score != null && (
                    <span className={cn('text-sm font-bold tabular-nums', scoreColor(opp.opportunity_score))}>
                      {opp.opportunity_score}
                    </span>
                  )}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                    title="Remove"
                  >
                    <BookmarkX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN DASHBOARD HOME PAGE
═══════════════════════════════════════════════════════════════ */
export default function DashboardHomePage() {
  const { user, subscription, premiumAccess } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, [user, navigate]);

  return (
    <AppLayout>
      <PageMeta
        title="Command Center — Kraitin"
        description="Your personal startup intelligence dashboard. Today's opportunities, competitor alerts, trending keywords, and market radar — all in one place."
        noIndex
      />
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">

        {/* ── Page header ─────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-sm text-white/30 mb-1">{greeting}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white text-balance">
              Founder Command Center
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Your daily briefing on opportunities, competitors, and market signals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!premiumAccess && (
              <button
                onClick={() => navigate('/billing')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 text-[#C5FF00] text-sm font-medium hover:bg-[#C5FF00]/15 transition-all"
              >
                <Zap className="w-3.5 h-3.5" /> Upgrade To Pro
              </button>
            )}
            <button
              onClick={() => navigate('/opportunities')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/[0.08] text-white/50 text-sm hover:border-white/20 hover:text-white/80 transition-all"
            >
              <Target className="w-3.5 h-3.5" /> All Opportunities
            </button>
          </div>
        </div>

        {/* ── Quick stats row ──────────────────────────────────── */}
        <QuickStats />

        {/* ── Main 2-column grid ───────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-5">
          <TodaysOpportunities />
          <CompetitorAlerts />
        </div>

        {/* ── Full-width Market Radar ──────────────────────────── */}
        <MarketRadar />

        {/* ── Bottom grid: credits (pro) + trending + saved ────── */}
        <div className="grid md:grid-cols-2 gap-5">
          <TrendingKeywords />
          <SavedOpportunities />
        </div>

        {/* ── Credits Overview (Pro users only) ───────────────── */}
        {premiumAccess && subscription && (
          <CreditsOverview subscription={subscription} onManage={() => navigate('/billing')} />
        )}

      </div>
    </AppLayout>
  );
}

/* ── Quick Stats ─────────────────────────────────────────────── */
function QuickStats() {
  const navigate = useNavigate();
  const [kpi, setKpi] = useState({ total: 0, gems: 0, avgScore: 0, trending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('opportunities').select('*', { count: 'exact', head: true }),
      supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('is_hidden_gem', true),
      supabase.from('opportunities').select('opportunity_score').not('opportunity_score', 'is', null),
      supabase.from('opportunities').select('*', { count: 'exact', head: true }).gte('growth_percent', 50),
    ]).then(([total, gems, scores, trending]) => {
      const avg = scores.data?.length
        ? Math.round((scores.data as Array<{ opportunity_score: number }>).reduce((a, b) => a + b.opportunity_score, 0) / scores.data.length)
        : 0;
      setKpi({
        total: total.count ?? 0,
        gems: gems.count ?? 0,
        avgScore: avg,
        trending: trending.count ?? 0,
      });
      setLoading(false);
    });
  }, []);

  const stats = [
    { label: 'Total Opportunities', value: kpi.total.toLocaleString(), icon: Target, color: 'text-[#C5FF00]', onClick: () => navigate('/opportunities') },
    { label: 'Hidden Gems', value: kpi.gems.toLocaleString(), icon: Flame, color: 'text-orange-400', onClick: () => navigate('/opportunities?filter=gems') },
    { label: 'Avg. Score', value: kpi.avgScore ? `${kpi.avgScore}/100` : '—', icon: BarChart2, color: 'text-blue-400', onClick: undefined },
    { label: 'High Growth (>50%)', value: kpi.trending.toLocaleString(), icon: TrendingUp, color: 'text-emerald-400', onClick: () => navigate('/opportunities?filter=trending') },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon, color, onClick }) => (
        <button
          key={label}
          onClick={onClick}
          disabled={!onClick}
          className={cn(
            'flex flex-col gap-2 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-left transition-all',
            onClick && 'hover:border-white/[0.12] hover:bg-white/[0.04] cursor-pointer',
            !onClick && 'cursor-default'
          )}
        >
          <Icon className={cn('w-4 h-4', color)} />
          {loading ? (
            <Skeleton className="h-6 w-16 bg-white/[0.06]" />
          ) : (
            <span className="text-xl font-bold text-white tabular-nums">{value}</span>
          )}
          <span className="text-xs text-white/30 leading-tight">{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Credits Overview Widget ─────────────────────────────────── */
function CreditsOverview({ subscription, onManage }: { subscription: Subscription; onManage: () => void }) {
  const creditsRemaining = subscription.credits_remaining ?? 0;
  const monthlyCredits   = subscription.credits_limit ?? subscription.monthly_credits ?? 500;
  const creditsUsed      = monthlyCredits - creditsRemaining;
  const creditsPct       = monthlyCredits > 0 ? Math.round((creditsRemaining / monthlyCredits) * 100) : 0;
  const isLow            = creditsPct < 20;
  const resetDate        = subscription.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

  const usageBreakdown = [
    { label: 'Research Reports',   cost: 5,  icon: BarChart2,    color: 'text-blue-400' },
    { label: 'Validation Reports', cost: 10, icon: Activity,     color: 'text-emerald-400' },
    { label: 'Competitor Intel',   cost: 10, icon: Users,        color: 'text-purple-400' },
    { label: 'MVP Plans',          cost: 10, icon: Target,       color: 'text-amber-400' },
    { label: 'Launch Plans',       cost: 10, icon: Flame,        color: 'text-orange-400' },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-[#C5FF00]" />
          <h3 className="text-sm font-semibold text-white">Credits Overview</h3>
          {isLow && (
            <span className="text-[10px] font-bold text-amber-400 border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
              Low Credits
            </span>
          )}
        </div>
        <button onClick={onManage} className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
          Manage <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Main bar + numbers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/40">Credits remaining</span>
          <span className="font-mono font-bold">
            <span className={isLow ? 'text-amber-400' : 'text-white'}>{creditsRemaining}</span>
            <span className="text-white/30"> / {monthlyCredits}</span>
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', isLow ? 'bg-amber-400' : 'bg-[#C5FF00]')}
            style={{ width: `${creditsPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-white/25">
          <span>{creditsUsed} credits used this cycle</span>
          <span>Resets {resetDate}</span>
        </div>
      </div>

      {/* Usage breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {usageBreakdown.map(({ label, cost, icon: Icon, color }) => (
          <div key={label} className="flex flex-col gap-1.5 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <Icon className={cn('w-3.5 h-3.5', color)} />
            <span className="text-[10px] text-white/30 leading-tight">{label}</span>
            <span className="text-xs font-bold text-white/60">{cost} cr</span>
          </div>
        ))}
      </div>
    </div>
  );
}
