import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/AppLayout';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Opportunity } from '@/types/types';
import { cn } from '@/lib/utils';
import { slugify } from '@/lib/slugify';
import { toast } from 'sonner';
import {
  Search, RefreshCw, X, ChevronUp, ChevronDown, ChevronsUpDown,
  Star, Zap, TrendingUp, ArrowUpRight, Download, Bell, Bookmark,
  User, SlidersHorizontal, CheckSquare, Square, ChevronLeft,
  ChevronRight, DollarSign, Activity, Target, Flame, Globe,
} from 'lucide-react';
import { AdvancedFilterPanel, DEFAULT_ADVANCED_FILTERS, isFiltersActive } from '@/components/explore/AdvancedFilterPanel';
import type { AdvancedFilters } from '@/components/explore/AdvancedFilterPanel';
import { ExportPaywallModal } from '@/components/paywall/ExportPaywallModal';

/* ── Types ──────────────────────────────────────────────────── */
type SortKey = 'title' | 'category' | 'revenue_estimate' | 'downloads' | 'growth_percent' | 'competition_score' | 'opportunity_score' | 'created_at';
type SortDir = 'asc' | 'desc';

/* ── Constants ──────────────────────────────────────────────── */
const FILTER_PILLS = [
  'All','AI','SaaS','Health','Education','Finance','Productivity',
  'Developer Tools','Lifestyle','Marketplaces','Creator Economy',
  'Legal','Travel','Consumer','B2B','Mobile Apps','Web Apps',
  'Chrome Extensions',
];

const PILL_TO_CAT: Record<string, string[]> = {
  'AI':['AI'],'SaaS':['B2B SaaS'],'Health':['Health'],'Education':['Education'],
  'Finance':['Finance'],'Productivity':['Productivity'],'Developer Tools':['B2B SaaS'],
  'Lifestyle':['Consumer'],'Marketplaces':['B2B SaaS','Consumer'],'Creator Economy':['Consumer','AI'],
  'Legal':['AI','B2B SaaS'],'Travel':['Consumer'],'Consumer':['Consumer'],'B2B':['B2B SaaS'],
  'Mobile Apps':['Consumer'],'Web Apps':['B2B SaaS'],'Chrome Extensions':['B2B SaaS','AI'],
};

const COUNTRY_BY_CAT: Record<string, string> = {
  'AI':'USA','Health':'USA','Finance':'USA','Education':'UK','B2B SaaS':'USA',
  'Consumer':'USA','Productivity':'USA','default':'USA',
};

/* ── Helpers ────────────────────────────────────────────────── */
function compLabel(score: number): { text: string; cls: string } {
  if (score <= 40) return { text: 'Low', cls: 'text-[#C5FF00]' };
  if (score <= 65) return { text: 'Medium', cls: 'text-amber-400' };
  return { text: 'High', cls: 'text-red-400' };
}

function scoreColor(s: number) {
  if (s >= 85) return 'text-[#C5FF00]';
  if (s >= 70) return 'text-emerald-400';
  if (s >= 55) return 'text-amber-400';
  return 'text-red-400';
}

function trend(): string {
  return '📈';
}

function countryFlag(cat: string) {
  const c = COUNTRY_BY_CAT[cat] ?? COUNTRY_BY_CAT['default'];
  const flags: Record<string,string> = { USA:'🇺🇸', UK:'🇬🇧', DE:'🇩🇪', IN:'🇮🇳', BR:'🇧🇷' };
  return { flag: flags[c] ?? '🇺🇸', country: c };
}

/* ── Mini Sparkline ─────────────────────────────────────────── */
function MiniSparkline({ values, color = '#C5FF00', h = 28 }: { values: number[]; color?: string; h?: number }) {
  const w = 64;
  const max = Math.max(...values); const min = Math.min(...values); const r = max - min || 1;
  const pts = values.map((v, i) => `${(i/(values.length-1))*w},${h - ((v-min)/r)*(h-3)-1.5}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function genSpark(trend: 'up'|'down'|'flat', len=10): number[] {
  return Array.from({length:len},(_,i)=>{
    const noise = Math.random()*12-6;
    const d = trend==='up' ? i*5 : trend==='down' ? -i*4 : 0;
    return Math.max(5,Math.min(95,30+d+noise));
  });
}

/* ── KPI Card ───────────────────────────────────────────────── */
interface KpiCardProps { icon: React.ElementType; label: string; value: string; numericValue?: number; change: string; positive?: boolean; spark: number[]; sparkColor?: string; loading?: boolean; }
function KpiCard({ icon: Icon, label, value, numericValue, change, positive = true, spark, sparkColor, loading }: KpiCardProps) {
  return (
    <div className="card-interactive flex flex-col justify-between p-4 rounded-xl border border-white/[0.06] bg-[#0a0b0f] gap-3 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest truncate">{label}</p>
          {loading
            ? <div className="h-6 w-20 rounded-md skeleton-shimmer" />
            : numericValue !== undefined
              ? <p className="text-xl font-black text-white leading-tight">
                  <AnimatedNumber value={numericValue} duration={900} delay={100} />
                </p>
              : <p className="text-xl font-black text-white leading-tight num-pop">{value}</p>
          }
        </div>
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-white/35" />
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className={cn('text-xs font-semibold num-pop', positive ? 'text-[#C5FF00]' : 'text-red-400')}>
          {change}
        </span>
        <MiniSparkline values={spark} color={sparkColor ?? (positive ? '#C5FF00' : '#f87171')} />
      </div>
    </div>
  );
}

/* ── Sort header ────────────────────────────────────────────── */
function SortTh({ label, k, cur, dir, onSort, className }: {
  label: string; k: SortKey; cur: SortKey; dir: SortDir; onSort: (k: SortKey)=>void; className?: string;
}) {
  const active = cur === k;
  return (
    <th onClick={()=>onSort(k)}
      className={cn('px-3 py-3 text-left select-none cursor-pointer whitespace-nowrap group transition-colors', className,
        active ? 'text-white/80' : 'text-white/22 hover:text-white/50')}>
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
        {label}
        {active ? (dir==='asc' ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>)
          : <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity"/>}
      </span>
    </th>
  );
}

/* ── Skeleton row ───────────────────────────────────────────── */
function SkelRow() {
  return (
    <tr className="border-b border-white/[0.03]">
      <td className="px-3 py-3.5 w-8"><div className="w-4 h-4 rounded bg-white/[0.05]"/></td>
      {[220,80,100,80,60,90,70,70,40,60,70].map((w,i)=>(
        <td key={i} className="px-3 py-3.5">
          <div className="h-3 rounded skeleton-shimmer" style={{width:w}}/>
        </td>
      ))}
    </tr>
  );
}

/* ── Main page ──────────────────────────────────────────────── */
const PAGE_SIZE = 50;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, premiumAccess } = useAuth();

  /* State */
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activePill, setActivePill] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('opportunity_score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [advFilters, setAdvFilters] = useState<AdvancedFilters>(DEFAULT_ADVANCED_FILTERS);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpi, setKpi] = useState({ total: 0, new7d: 0, avgGrowth: 0, highPotential: 0 });
  const [exportPaywallOpen, setExportPaywallOpen] = useState(false);

  /* Sparks — stable refs */
  const sparks = useRef({
    total:     genSpark('up'),
    new7d:     genSpark('up'),
    revenue:   genSpark('up'),
    growth:    genSpark('up'),
    potential: genSpark('up'),
    signals:   genSpark('flat'),
  }).current;

  /* Debounce search */
  const debRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>{
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(()=>{ setDebouncedSearch(search); setPage(0); }, 280);
    return ()=>{ if (debRef.current) clearTimeout(debRef.current); };
  }, [search]);

  useEffect(()=>{ setPage(0); }, [activePill, sortKey, sortDir, advFilters]);

  /* Read URL params */
  useEffect(()=>{
    const cat = searchParams.get('cat');
    if (cat && FILTER_PILLS.includes(cat)) setActivePill(cat);
    const filter = searchParams.get('filter');
    if (filter === 'gems') setActivePill('All');
    if (filter === 'trending') setSortKey('growth_percent');
    if (filter === 'rising') { setSortKey('opportunity_score'); setSortDir('desc'); }
  }, [searchParams]);

  /* KPI fetch */
  useEffect(()=>{
    setKpiLoading(true);
    const week = new Date(Date.now()-7*864e5).toISOString();
    Promise.all([
      supabase.from('opportunities').select('*', {count:'exact',head:true}),
      supabase.from('opportunities').select('*', {count:'exact',head:true}).gte('created_at', week),
      supabase.from('opportunities').select('growth_percent').not('growth_percent','is',null),
      supabase.from('opportunities').select('*', {count:'exact',head:true}).gte('opportunity_score', 80),
    ]).then(([tot, n7, gr, hp])=>{
      const avgG = gr.data ? Math.round((gr.data as {growth_percent:number}[]).reduce((a,b)=>a+(b.growth_percent??0),0)/(gr.data.length||1)) : 0;
      setKpi({ total: tot.count??0, new7d: n7.count??0, avgGrowth: avgG, highPotential: hp.count??0 });
      setKpiLoading(false);
    });
  }, []);

  /* Opportunities fetch */
  const fetchOpps = useCallback(async (isRefresh=false)=>{
    if (isRefresh) setRefreshing(true); else setLoading(true);
    let q = supabase.from('opportunities').select('*', {count:'exact'});
    if (activePill !== 'All') {
      const cats = PILL_TO_CAT[activePill];
      if (cats) q = q.in('category', cats);
    }
    if (debouncedSearch.trim())
      q = q.or(`title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%,category.ilike.%${debouncedSearch}%`);
    // Advanced filters
    if (advFilters.scoreMin > 0)   q = q.gte('opportunity_score', advFilters.scoreMin);
    if (advFilters.scoreMax < 100) q = q.lte('opportunity_score', advFilters.scoreMax);
    if (advFilters.growthMin > 0)  q = q.gte('growth_percent', advFilters.growthMin);
    if (advFilters.hiddenGemsOnly) q = q.eq('is_hidden_gem', true);
    if (advFilters.competition.length > 0) {
      const ranges = advFilters.competition.map(c =>
        c === 'low'    ? 'competition_score.lte.40' :
        c === 'medium' ? 'and(competition_score.gte.41,competition_score.lte.65)' :
                         'competition_score.gte.66'
      );
      q = q.or(ranges.join(','));
    }
    q = q.order(sortKey, {ascending: sortDir==='asc'});
    q = q.range(page*PAGE_SIZE, (page+1)*PAGE_SIZE-1);
    const { data, count } = await q;
    if (data) setOpps(data);
    if (count !== null) setTotal(count);
    setLoading(false); setRefreshing(false);
  }, [activePill, debouncedSearch, sortKey, sortDir, page, advFilters]);

  useEffect(()=>{ fetchOpps(); }, [fetchOpps]);

  /* Handlers */
  const handleSort = (k: SortKey) => {
    if (sortKey===k) setSortDir(d=>d==='asc'?'desc':'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const toggleSelect = (id: string) => setSelected(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });
  const toggleAll = () => setSelected(s=>s.size===opps.length ? new Set() : new Set(opps.map(o=>o.id)));

  const handleExport = () => {
    if (!premiumAccess) { setExportPaywallOpen(true); return; }
    const rows = opps.filter(o=>selected.size===0||selected.has(o.id));
    const csv = ['Title,Category,Revenue,Downloads,Growth%,Competition Score,Opportunity Score',
      ...rows.map(o=>`"${o.title}","${o.category}","${o.revenue_estimate??''}","${o.downloads??''}","${o.growth_percent??''}","${o.competition_score??''}","${o.opportunity_score??''}"`)
    ].join('\n');
    const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
    a.download='kraitin-opportunities.csv'; a.click();
    toast.success(`Exported ${rows.length} opportunities`);
  };

  const handleWatchlist = async () => {
    if (selected.size === 0) { toast.info('Select rows first'); return; }
    if (!user) { toast.error('Sign in to save to watchlist'); return; }

    const rows = Array.from(selected).map((id) => ({
      user_id: user.id,
      item_type: 'opportunity' as const,
      item_id: id,
    }));

    const { error } = await supabase
      .from('saved_items')
      .upsert(rows, { onConflict: 'user_id,item_type,item_id', ignoreDuplicates: true });

    if (error) {
      toast.error('Failed to save to watchlist. Please try again.');
      return;
    }
    toast.success(`${selected.size} opportunit${selected.size === 1 ? 'y' : 'ies'} saved to watchlist`, {
      action: { label: 'View Watchlist', onClick: () => navigate('/watchlist') },
    });
    setSelected(new Set());
  };

  const totalPages = Math.ceil(total/PAGE_SIZE);
  const allSelected = opps.length > 0 && selected.size===opps.length;
  const someSelected = selected.size > 0 && !allSelected;

  const kpiCards = useMemo(()=>[
    { icon: Globe,      label: 'Total Opportunities', value: kpi.total ? kpi.total.toLocaleString() : '—',   numericValue: kpi.total || 0,        change: '+12.4%', positive: true,  spark: sparks.total,     sparkColor: '#C5FF00' },
    { icon: Zap,        label: 'New This Week',        value: kpi.new7d ? kpi.new7d.toLocaleString() : '—',  numericValue: kpi.new7d || 0,        change: '+23.1%', positive: true,  spark: sparks.new7d,     sparkColor: '#34d399' },
    { icon: DollarSign, label: 'Average Revenue',      value: '$1.8M',                                        numericValue: undefined,             change: '+8.7%',  positive: true,  spark: sparks.revenue,   sparkColor: '#38bdf8' },
    { icon: TrendingUp, label: 'Average Growth',       value: kpi.avgGrowth ? `+${kpi.avgGrowth}%` : '—',   numericValue: kpi.avgGrowth || 0,    change: '+5.2% MoM', positive: true, spark: sparks.growth,  sparkColor: '#C5FF00' },
    { icon: Target,     label: 'High Potential',       value: kpi.highPotential ? kpi.highPotential.toLocaleString() : '—', numericValue: kpi.highPotential || 0, change: '+18.3%', positive: true, spark: sparks.potential, sparkColor: '#a78bfa' },
    { icon: Activity,   label: 'Market Signals',       value: '8,341',                                        numericValue: 8341,                  change: '+31.9%', positive: true,  spark: sparks.signals,   sparkColor: '#fb923c' },
  ], [kpi, sparks]);

  return (
    <AppLayout>
      <ExportPaywallModal open={exportPaywallOpen} onClose={() => setExportPaywallOpen(false)} />
      {/* ── Single natural-flow page ──────────────────────────── */}
      <div className="bg-[#050507] font-montserrat min-h-full">

        {/* ══ STICKY HEADER BLOCK — stays pinned while page scrolls ══ */}
        <div className="sticky top-0 z-20 bg-[#060709]" style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.05)' }}>

          {/* ── Top bar ─────────────────────────────────────────── */}
          <div className="px-6 md:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="min-w-0">
                <h1 className="text-lg font-black text-white tracking-tight leading-none">Explore Opportunities</h1>
                <p className="text-[11px] text-white/25 mt-0.5 hidden md:block">Discover startups · Analyze competitors · Uncover billion-dollar ideas</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={handleWatchlist} className="btn-press flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.07] text-white/35 text-xs font-medium hover:border-white/20 hover:text-white/70 transition-colors">
                  <Bookmark className="w-3 h-3 shrink-0" /><span className="hidden sm:inline">Watchlist</span>
                </button>
                <button className="btn-press h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.07] text-white/35 hover:border-white/20 hover:text-white/70 transition-colors">
                  <Bell className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleExport} className="btn-press flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.07] text-white/35 text-xs font-medium hover:border-white/20 hover:text-white/70 transition-colors">
                  <Download className="w-3 h-3 shrink-0" /><span className="hidden sm:inline">Export</span>
                </button>
                <button className="btn-press h-8 w-8 flex items-center justify-center rounded-full bg-[#C5FF00]/10 border border-[#C5FF00]/20 text-[#C5FF00]/70 hover:bg-[#C5FF00]/20 transition-colors">
                  <User className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Search bar ──────────────────────────────────────── */}
          <div className="px-6 md:px-8 pb-3 pt-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search startups, apps, SaaS products, keywords, competitors, niches..."
                className="search-glow w-full h-11 pl-11 pr-10 bg-[#0a0b10] border border-white/[0.07] rounded-xl text-sm text-white placeholder:text-white/18 outline-none font-montserrat" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-white/25 hover:text-white/60 transition-colors rounded-full">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ── Filter + category pills ──────────────────────────── */}
          <div className="flex items-center gap-2 px-6 md:px-8 pb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setFilterPanelOpen(true)}
              className={cn(
                'pill-press flex items-center gap-1.5 h-7 px-3 rounded-full border text-xs font-medium whitespace-nowrap shrink-0',
                isFiltersActive(advFilters)
                  ? 'pill-active bg-[#C5FF00]/10 border-[#C5FF00]/30 text-[#C5FF00]'
                  : 'border-white/[0.07] text-white/30 hover:border-white/20 hover:text-white/60',
              )}>
              <SlidersHorizontal className="w-3 h-3 shrink-0" />
              Filters
              {isFiltersActive(advFilters) && <span className="w-1.5 h-1.5 rounded-full bg-[#C5FF00] shrink-0" />}
            </button>
            {FILTER_PILLS.map(pill => (
              <button key={pill} onClick={() => { setActivePill(pill); setPage(0); }}
                className={cn('pill-press h-7 px-3 rounded-full border text-xs font-medium whitespace-nowrap shrink-0',
                  activePill === pill
                    ? 'pill-active bg-[#C5FF00] border-[#C5FF00] text-black'
                    : 'border-white/[0.07] text-white/30 hover:border-white/20 hover:text-white/60')}>
                {pill}
              </button>
            ))}
          </div>

          {/* ── Table toolbar (also sticky, part of header block) ── */}
          <div className="flex items-center gap-3 px-6 md:px-8 py-2 border-t border-white/[0.04]">
            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">{selected.size} selected</span>
                <button onClick={handleWatchlist} className="h-7 px-2.5 rounded-md border border-white/[0.08] text-[11px] text-white/40 hover:text-white/70 hover:border-white/20 transition-all flex items-center gap-1.5">
                  <Bookmark className="w-3 h-3" /> Save
                </button>
                <button onClick={() => setSelected(new Set())} className="h-7 px-2 rounded-md text-white/25 hover:text-white/60 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex-1" />
            <button onClick={() => fetchOpps(true)} disabled={refreshing}
              className="btn-press flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-white/[0.07] text-[11px] text-white/30 hover:text-white/60 hover:border-white/15 transition-colors">
              <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
            <span className="text-[11px] text-white/20 font-mono shrink-0">
              {loading ? '…' : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} of ${total.toLocaleString()}`}
            </span>
          </div>
        </div>
        {/* ══ END STICKY HEADER BLOCK ══ */}

        {/* ── KPI cards — scroll away naturally ───────────────── */}
        <div className="px-6 md:px-8 py-4 border-b border-white/[0.04]">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {kpiCards.map(card => (
              <KpiCard key={card.label} {...card} loading={kpiLoading} />
            ))}
          </div>
        </div>

        {/* ── Table — no height constraint, scrolls with page ──── */}
        <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
          <table className="w-full min-w-[1100px] border-collapse">
            <thead className="bg-[#060709]">
              <tr className="border-b border-white/[0.05]">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} className="flex items-center justify-center text-white/25 hover:text-white/60 transition-colors">
                    {allSelected ? <CheckSquare className="w-3.5 h-3.5 text-[#C5FF00]" /> : someSelected ? <CheckSquare className="w-3.5 h-3.5 text-white/40" /> : <Square className="w-3.5 h-3.5" />}
                  </button>
                </th>
                <SortTh label="Startup"     k="title"             cur={sortKey} dir={sortDir} onSort={handleSort} className="min-w-[220px]" />
                <SortTh label="Category"    k="category"          cur={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Revenue"     k="revenue_estimate"  cur={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Downloads"   k="downloads"         cur={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Growth"      k="growth_percent"    cur={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Competition" k="competition_score" cur={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Opp. Score"  k="opportunity_score" cur={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/22 whitespace-nowrap">Demand</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/22 whitespace-nowrap">Trend</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/22 whitespace-nowrap">Country</th>
                <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-white/22 pr-6">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 20 }).map((_, i) => <SkelRow key={i} />)
                : opps.length === 0
                  ? <tr><td colSpan={12} className="py-24 text-center text-white/20 text-sm">No results found.</td></tr>
                  : opps.map(opp => {
                    const comp = compLabel(opp.competition_score ?? 50);
                    const demand = Math.min(100, (opp.opportunity_score ?? 0) + 4);
                    const { flag, country } = countryFlag(opp.category);
                    const isSelected = selected.has(opp.id);
                    return (
                      <tr key={opp.id}
                        onClick={() => navigate(`/opportunity/${slugify(opp.title)}`, { state: { opp } })}
                        className={cn('table-row-interactive border-b border-white/[0.025] cursor-pointer group',
                          isSelected ? 'bg-[#C5FF00]/[0.03]' : 'hover:bg-white/[0.03]')}>
                        <td className="px-4 py-3.5 w-10" onClick={e => { e.stopPropagation(); toggleSelect(opp.id); }}>
                          <div className="flex items-center justify-center text-white/20 group-hover:text-white/40 transition-colors">
                            {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-[#C5FF00]" /> : <Square className="w-3.5 h-3.5" />}
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 text-[11px] font-black text-white/35 group-hover:border-[#C5FF00]/20 transition-colors">
                              {opp.title.charAt(0)}
                            </div>
                            <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[13px] font-semibold text-white/80 group-hover:text-white transition-colors truncate max-w-[160px]">{opp.title}</span>
                              {opp.is_hidden_gem && <Star className="w-2.5 h-2.5 text-[#C5FF00] shrink-0" />}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5"><span className="text-xs text-white/35 whitespace-nowrap">{opp.category}</span></td>
                        <td className="px-3 py-3.5"><span className="text-xs text-white/55 font-mono whitespace-nowrap">{opp.revenue_estimate ?? '—'}</span></td>
                        <td className="px-3 py-3.5"><span className="text-xs text-white/40 font-mono whitespace-nowrap">{opp.downloads ?? '—'}</span></td>
                        <td className="px-3 py-3.5">
                          {opp.growth_percent != null
                            ? <span className="flex items-center gap-1 text-xs font-bold text-[#C5FF00] whitespace-nowrap"><Zap className="w-2.5 h-2.5" />+{opp.growth_percent}%</span>
                            : <span className="text-white/20 text-xs">—</span>}
                        </td>
                        <td className="px-3 py-3.5"><span className={cn('text-xs font-semibold whitespace-nowrap', comp.cls)}>{comp.text}</span></td>
                        <td className="px-3 py-3.5">
                          <span className={cn('text-sm font-black font-mono', scoreColor(opp.opportunity_score ?? 0))}>{opp.opportunity_score ?? '—'}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-sky-400/60 transition-all" style={{ width: `${demand}%` }} />
                            </div>
                            <span className="text-[11px] text-white/25 font-mono">{Math.round(demand)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-sm">{trend()}</td>
                        <td className="px-3 py-3.5">
                          <span className="flex items-center gap-1.5 whitespace-nowrap">
                            <span>{flag}</span>
                            <span className="text-[11px] text-white/25">{country}</span>
                          </span>
                        </td>
                        <td className="px-3 py-3.5 pr-6 text-right">
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/opportunity/${slugify(opp.title)}`, { state: { opp } }); }}
                            className="btn-press btn-glow-lime inline-flex items-center gap-1 h-6 px-2.5 rounded-md bg-[#C5FF00]/[0.08] text-[#C5FF00]/80 text-[10px] font-semibold border border-[#C5FF00]/15 hover:bg-[#C5FF00]/20 hover:text-[#C5FF00] whitespace-nowrap">
                            Analyze <ArrowUpRight className="w-2.5 h-2.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {/* ── Pagination ─────────────────────────────────────────── */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-6 md:px-8 py-4 border-t border-white/[0.04] bg-[#060709]">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="btn-press flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.07] text-xs text-white/35 disabled:opacity-25 hover:border-white/18 hover:text-white/65 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(7, totalPages) }).map((_, i) => {
                const p = totalPages <= 7 ? i : page < 4 ? i : page > totalPages - 4 ? totalPages - 7 + i : page - 3 + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={cn('pill-press w-7 h-7 rounded-md text-[11px] font-mono',
                      p === page ? 'pill-active bg-[#C5FF00]/10 text-[#C5FF00] border border-[#C5FF00]/20' : 'text-white/25 hover:text-white/60 hover:bg-white/[0.04]')}>
                    {p + 1}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="btn-press flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.07] text-xs text-white/35 disabled:opacity-25 hover:border-white/18 hover:text-white/65 transition-colors">
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Advanced Filter Panel ─────────────────────────────── */}
      <AdvancedFilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={advFilters}
        onChange={(f) => { setAdvFilters(f); setPage(0); }}
      />
    </AppLayout>
  );
}
