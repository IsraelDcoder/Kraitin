import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { supabase } from '@/db/supabase';
import { slugify } from '@/lib/slugify';
import type { Opportunity } from '@/types/types';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Filter, Flame, TrendingUp, X, RefreshCw, BarChart2, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const CATEGORIES = ['All', 'AI', 'Health', 'Education', 'Productivity', 'B2B SaaS', 'Consumer', 'Mobile Apps', 'Finance'];

/* Animated shimmer skeleton card */
function CardSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0b0f] p-5 h-72 flex flex-col gap-3">
      <div className="skeleton-shimmer h-4 w-24 rounded-md" />
      <div className="skeleton-shimmer h-5 w-full rounded-md" />
      <div className="skeleton-shimmer h-4 w-3/4 rounded-md" />
      <div className="grid grid-cols-2 gap-2 mt-2">
        {[1,2,3,4].map(i => <div key={i} className="skeleton-shimmer h-12 rounded-lg" />)}
      </div>
      <div className="mt-auto skeleton-shimmer h-8 rounded-lg" />
    </div>
  );
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-mono-num text-white/30 w-6 text-right">{value}</span>
    </div>
  );
}

function OpportunityCard({ opp, onAnalyze }: { opp: Opportunity; onAnalyze: (opp: Opportunity) => void }) {
  const velocityColor = opp.growth_velocity === 'Explosive' ? 'text-[#00D97E] bg-[#00D97E]/10 border-[#00D97E]/20'
    : opp.growth_velocity === 'Rising' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
      : 'text-white/30 bg-white/[0.04] border-white/[0.08]';

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onAnalyze(opp)}
      onClick={() => onAnalyze(opp)}
      className={cn(
        'card-interactive rounded-xl p-5 border border-white/[0.07] bg-[#0a0b0f] cursor-pointer',
        'hover:border-[#C5FF00]/20 h-full flex flex-col group',
      )}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex flex-wrap gap-1.5">
          <Badge className="text-[10px] bg-white/[0.04] text-white/40 border-white/[0.08]">{opp.category}</Badge>
          {opp.is_hidden_gem && (
            <Badge className="text-[10px] bg-[#C5FF00]/10 text-[#C5FF00] border-[#C5FF00]/20">
              <Star className="w-2.5 h-2.5 mr-0.5" /> Hidden Gem
            </Badge>
          )}
        </div>
        <Badge className={cn('text-[10px] shrink-0', velocityColor)}>
          <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> {opp.growth_velocity}
        </Badge>
      </div>

      <h3 className="text-sm font-semibold text-white/80 mb-2 text-balance group-hover:text-white transition-colors">{opp.title}</h3>
      {opp.description && (
        <p className="text-xs text-white/35 mb-4 text-pretty line-clamp-2">{opp.description}</p>
      )}

      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: 'Revenue Est.', value: opp.revenue_estimate || '—', mono: true },
          { label: 'Downloads', value: opp.downloads || '—', mono: true },
          { label: 'Market Size', value: opp.market_size || '—', mono: true },
          { label: 'Growth', value: `+${opp.growth_percent}%`, mono: true, color: 'text-[#C5FF00]' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/[0.03] rounded-lg px-3 py-2">
            <p className="text-[10px] text-white/30 mb-0.5">{stat.label}</p>
            <p className={cn('text-xs font-semibold', stat.mono && 'font-mono-num', stat.color || 'text-white/70')}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2 mb-4">
        <div>
          <p className="text-[10px] text-white/30 mb-1">Opportunity Score</p>
          <ScoreBar
            value={opp.opportunity_score || 0}
            color={
              (opp.opportunity_score || 0) >= 80 ? 'bg-[#C5FF00]' :
              (opp.opportunity_score || 0) >= 60 ? 'bg-amber-400' : 'bg-red-400'
            }
          />
        </div>
        <div>
          <p className="text-[10px] text-white/30 mb-1">Competition Level</p>
          <ScoreBar
            value={opp.competition_score || 0}
            color={
              (opp.competition_score || 0) <= 40 ? 'bg-[#C5FF00]' :
              (opp.competition_score || 0) <= 65 ? 'bg-amber-400' : 'bg-red-400'
            }
          />
        </div>
      </div>

      {opp.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {opp.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-white/30 border border-white/[0.07]">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Single CTA — navigate to intelligence page */}
      <div
        className={cn(
          'btn-press btn-glow-lime mt-auto w-full h-8 text-xs rounded-lg',
          'border border-[#C5FF00]/15 text-[#C5FF00]/70 bg-[#C5FF00]/[0.04]',
          'group-hover:bg-[#C5FF00]/[0.08] group-hover:text-[#C5FF00] group-hover:border-[#C5FF00]/25',
          'flex items-center justify-center gap-1.5 font-medium pointer-events-none',
        )}
      >
        <BarChart2 className="w-3 h-3" /> Analyze Opportunity
      </div>
    </div>
  );
}

export default function OpportunitiesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [hiddenGemsOnly, setHiddenGemsOnly] = useState(false);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state from URL params on mount and when URL changes
  useEffect(() => {
    const f = searchParams.get('filter') ?? '';
    const c = searchParams.get('cat') ?? 'All';
    setHiddenGemsOnly(f === 'gems');
    setCategory(CATEGORIES.includes(c) ? c : 'All');
  }, [searchParams]);

  // Debounce search input
  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => setDebouncedSearch(search), 280);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [search]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const fetchAll = async () => {
      const PAGE = 1000;
      let all: Opportunity[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('opportunities')
          .select('*')
          .order('opportunity_score', { ascending: false })
          .range(from, from + PAGE - 1);
        if (error || !Array.isArray(data) || data.length === 0) break;
        all = [...all, ...data];
        if (data.length < PAGE) break;
        from += PAGE;
      }
      setOpportunities(all);
      setLoading(false);
    };
    fetchAll();
  }, [user, navigate]);

  const urlFilter = searchParams.get('filter') ?? '';

  const filtered = opportunities.filter((o) => {
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || o.title.toLowerCase().includes(q) || (o.description || '').toLowerCase().includes(q);
    const matchCat  = category === 'All' || o.category === category;
    const matchGem  = !hiddenGemsOnly || o.is_hidden_gem;
    const matchTrend = urlFilter !== 'trending' || (o.growth_percent ?? 0) >= 50;
    const matchRise  = urlFilter !== 'rising'   || ((o.growth_percent ?? 0) > 0 && (o.growth_percent ?? 0) < 50);
    return matchSearch && matchCat && matchGem && matchTrend && matchRise;
  });

  const filterLabel =
    urlFilter === 'trending' ? 'Trending (50%+ growth)' :
    urlFilter === 'rising'   ? 'Rising (up to 50% growth)' :
    urlFilter === 'gems'     ? 'Hidden Gems' : '';

  const handleAnalyze = (opp: Opportunity) => navigate(`/opportunity/${slugify(opp.title)}`, { state: { opp } });

  const top3 = useMemo(() =>
    [...opportunities].sort((a, b) => (b.growth_percent ?? 0) - (a.growth_percent ?? 0)).slice(0, 3),
    [opportunities]
  );

  const handleRefresh = async () => {
    if (refreshing) return;
    const targetCat = category === 'All' ? 'AI' : category;
    setRefreshing(true);
    const toastId = toast.loading(`Refreshing ${targetCat} opportunities with live data…`);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/refresh-opportunities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ category: targetCat }),
      });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      toast.success(`Loaded ${result.count} fresh ${targetCat} opportunities`, { id: toastId });
      // Reload data
      setLoading(true);
      const PAGE = 1000;
      let all: Opportunity[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('opportunities').select('*')
          .order('opportunity_score', { ascending: false })
          .range(from, from + PAGE - 1);
        if (error || !Array.isArray(data) || data.length === 0) break;
        all = [...all, ...data];
        if (data.length < PAGE) break;
        from += PAGE;
      }
      setOpportunities(all);
      setLoading(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Refresh failed', { id: toastId });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white text-balance">Opportunity Discovery</h1>
            <p className="text-white/35 mt-1 text-sm">
              Live market opportunities across {CATEGORIES.length - 1} categories — powered by AI + real market signals.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className={cn(
              'btn-press shrink-0 h-9 px-4 text-xs font-medium rounded-xl border flex items-center gap-1.5',
              'border-white/[0.08] text-white/40 bg-white/[0.02]',
              'hover:border-[#C5FF00]/25 hover:text-[#C5FF00]/70 hover:bg-[#C5FF00]/[0.04]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
            title={`Refresh ${category === 'All' ? 'AI' : category} opportunities with live data`}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            <span className="hidden md:inline">{refreshing ? 'Refreshing…' : 'Refresh Data'}</span>
          </button>
        </div>

        {/* Trending Now Banner */}
        {!loading && top3.length > 0 && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.05]">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-semibold text-white/70 tracking-wide uppercase">Trending Now</span>
              </div>
              <span className="text-[10px] text-white/25 ml-1">Top 3 fastest-growing today</span>
            </div>
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.05]">
              {top3.map((opp, i) => (
                <button
                  key={opp.id}
                  onClick={() => {
                    const p = new URLSearchParams(searchParams);
                    p.set('cat', opp.category);
                    setSearchParams(p);
                    setSearch(opp.title);
                  }}
                  className="group text-left px-4 py-3 hover:bg-white/[0.03] transition-colors flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/30 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate group-hover:text-white transition-colors text-balance">{opp.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className="text-[10px] bg-white/[0.04] text-white/35 border-white/[0.07] py-0">{opp.category}</Badge>
                        <span className="text-[11px] text-[#C5FF00]/70 font-mono-num font-semibold flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3" />+{opp.growth_percent}%
                        </span>
                        {opp.revenue_estimate && (
                          <span className="text-[10px] text-white/25 font-mono-num">{opp.revenue_estimate}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/40 shrink-0 mt-1 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search opportunities…"
              className="search-glow w-full h-10 pl-9 pr-9 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="btn-press absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-white/25 hover:text-white/60 rounded-full">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              const next = !hiddenGemsOnly;
              const p = new URLSearchParams(searchParams);
              if (next) p.set('filter', 'gems'); else p.delete('filter');
              setSearchParams(p);
            }}
            className={cn(
              'pill-press h-10 px-4 text-sm border rounded-xl flex items-center gap-1.5 font-medium',
              hiddenGemsOnly
                ? 'pill-active bg-[#C5FF00]/10 border-[#C5FF00]/25 text-[#C5FF00]'
                : 'border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/20 bg-white/[0.02]'
            )}
          >
            <Star className="w-3.5 h-3.5" /> Hidden Gems
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 whitespace-nowrap">
          {CATEGORIES.map((cat) => {
            const count = cat === 'All' ? opportunities.length : opportunities.filter(o => o.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  if (cat === 'All') p.delete('cat'); else p.set('cat', cat);
                  setSearchParams(p);
                }}
                className={cn(
                  'pill-press px-4 py-1.5 rounded-lg text-sm font-medium border shrink-0 flex items-center gap-1.5',
                  category === cat
                    ? 'pill-active bg-[#C5FF00]/10 border-[#C5FF00]/25 text-[#C5FF00]'
                    : 'bg-white/[0.02] border-white/[0.07] text-white/35 hover:text-white/70 hover:border-white/20'
                )}
              >
                {cat}
                {!loading && count > 0 && (
                  <span className={cn(
                    'text-[10px] font-mono-num rounded-full px-1.5 py-0.5 min-w-[20px] text-center',
                    category === cat ? 'bg-[#C5FF00]/20 text-[#C5FF00]/80' : 'bg-white/[0.06] text-white/25'
                  )}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-sm text-white/30 flex-wrap">
          <Filter className="w-4 h-4" />
          <span>
            {filtered.length === opportunities.length
              ? `${opportunities.length} opportunities`
              : `${filtered.length} of ${opportunities.length} opportunities`}
          </span>
          {filterLabel && (
            <Badge className="text-[10px] bg-white/[0.04] text-white/40 border-white/[0.08]">
              <Flame className="w-2.5 h-2.5 mr-1" />{filterLabel}
            </Badge>
          )}
          {hiddenGemsOnly && urlFilter !== 'gems' && (
            <Badge className="text-[10px] bg-[#C5FF00]/10 text-[#C5FF00] border-[#C5FF00]/20">
              Hidden Gems only
            </Badge>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/25">
            <p className="text-base">No opportunities match your filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((opp, i) => (
              <div key={opp.id} className="page-enter h-full" style={{ animationDelay: `${Math.min(i * 30, 180)}ms` }}>
                <OpportunityCard opp={opp} onAnalyze={handleAnalyze} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
