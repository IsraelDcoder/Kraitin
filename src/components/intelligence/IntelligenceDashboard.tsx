import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, Users, DollarSign, Target, Zap, Award,
  CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
  ExternalLink, BarChart3, Flame, Rocket, FileText,
  Code2, ShieldCheck, Search, Map, Layers, PieChart,
  ArrowUpRight,
} from 'lucide-react';
import type { IntelligenceData, CompetitorData, PainPoint, LovedFeature, MarketGap, MonetizationModel, GrowthChannel } from './types';

/* ── Animated counter hook ─────────────────────────────────── */
function useCounter(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

/* ── Sparkline ─────────────────────────────────────────────── */
function Sparkline({ values, color = '#C5FF00', h = 40 }: { values: number[]; color?: string; h?: number }) {
  const w = 120;
  const max = Math.max(...values); const min = Math.min(...values); const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Score ring ────────────────────────────────────────────── */
function ScoreRing({ value, size = 80, color = '#C5FF00' }: { value: number; size?: number; color?: string }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 1.2s ease' }} />
    </svg>
  );
}

/* ── Meter bar ─────────────────────────────────────────────── */
function MeterBar({ value, color = '#C5FF00' }: { value: number; color?: string }) {
  return (
    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

/* ── Stars ─────────────────────────────────────────────────── */
function Stars({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={cn('text-sm', i < count ? 'text-[#C5FF00]' : 'text-white/10')}>★</span>
      ))}
    </span>
  );
}

/* ── Section wrapper ───────────────────────────────────────── */
function Section({ title, icon: Icon, children, id }: { title: string; icon: React.ElementType; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-white/50" />
        </div>
        <h2 className="text-base font-black text-white tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Card({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-white/[0.07] bg-white/[0.02] p-5',
        onClick && 'cursor-pointer hover:border-white/[0.15] hover:bg-white/[0.04] transition-all',
        className,
      )}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-1.5">{children}</p>;
}

/* ── Loading skeleton ──────────────────────────────────────── */
function LoadingSkeleton({ progress }: { progress: number }) {
  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-[#C5FF00] animate-pulse" />
          <span className="text-sm font-semibold text-white/60 animate-pulse">Generating Intelligence Dashboard…</span>
          <span className="text-xs text-white/30 font-mono ml-auto">{progress}%</span>
        </div>
        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full bg-[#C5FF00] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-white/20 mt-3">
          {progress < 30 ? 'Analyzing market signals…' : progress < 60 ? 'Processing competitor data…' : progress < 85 ? 'Generating recommendations…' : 'Finalizing dashboard…'}
        </p>
      </div>
      {/* Hero skeleton */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 space-y-4">
        <Skeleton className="bg-white/[0.05] h-8 w-64 rounded" />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="bg-white/[0.05] h-20 rounded-xl" />
          ))}
        </div>
      </div>
      {/* Metrics skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="bg-white/[0.05] h-24 rounded-xl" />
        ))}
      </div>
      {/* Competitors skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="bg-white/[0.05] h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/* ── Action buttons config ─────────────────────────────────── */
// Each path receives ?q=<idea> — agent pages auto-trigger on that param, run the AI
// workflow, save the report, and show the intelligence dashboard. No dead routes.
const ACTION_BUTTONS = [
  { label: 'Generate Validation Report',     icon: ShieldCheck, path: '/validation',   color: 'border-emerald-400/20 text-emerald-400/70 hover:text-emerald-400 hover:border-emerald-400/30 hover:bg-emerald-400/[0.04]' },
  { label: 'Generate Competitor Analysis',   icon: BarChart3,   path: '/competitors',  color: 'border-sky-400/20 text-sky-400/70 hover:text-sky-400 hover:border-sky-400/30 hover:bg-sky-400/[0.04]' },
  { label: 'Generate MVP Plan',              icon: Code2,       path: '/mvp-planner',  color: 'border-violet-400/20 text-violet-400/70 hover:text-violet-400 hover:border-violet-400/30 hover:bg-violet-400/[0.04]' },
  { label: 'Generate Launch Strategy',       icon: Rocket,      path: '/launch-agent', color: 'border-orange-400/20 text-orange-400/70 hover:text-orange-400 hover:border-orange-400/30 hover:bg-orange-400/[0.04]' },
  { label: 'Generate Research Report',       icon: Search,      path: '/research',     color: 'border-[#C5FF00]/20 text-[#C5FF00]/70 hover:text-[#C5FF00] hover:border-[#C5FF00]/30 hover:bg-[#C5FF00]/[0.04]' },
  { label: 'Generate PRD',                   icon: FileText,    path: '/research',     color: 'border-pink-400/20 text-pink-400/70 hover:text-pink-400 hover:border-pink-400/30 hover:bg-pink-400/[0.04]' },
  { label: 'Generate Financial Forecast',    icon: DollarSign,  path: '/validation',   color: 'border-amber-400/20 text-amber-400/70 hover:text-amber-400 hover:border-amber-400/30 hover:bg-amber-400/[0.04]' },
  { label: 'Generate Marketing Plan',        icon: Layers,      path: '/launch-agent', color: 'border-cyan-400/20 text-cyan-400/70 hover:text-cyan-400 hover:border-cyan-400/30 hover:bg-cyan-400/[0.04]' },
  { label: 'Generate 100 Content Ideas',     icon: PieChart,    path: '/launch-agent', color: 'border-teal-400/20 text-teal-400/70 hover:text-teal-400 hover:border-teal-400/30 hover:bg-teal-400/[0.04]' },
  { label: 'Generate Technical Architecture',icon: Map,         path: '/mvp-planner',  color: 'border-rose-400/20 text-rose-400/70 hover:text-rose-400 hover:border-rose-400/30 hover:bg-rose-400/[0.04]' },
  { label: 'Generate Investor Memo',         icon: ArrowUpRight,path: '/research',     color: 'border-indigo-400/20 text-indigo-400/70 hover:text-indigo-400 hover:border-indigo-400/30 hover:bg-indigo-400/[0.04]' },
];

/* ── Main dashboard ────────────────────────────────────────── */
interface IntelligenceDashboardProps {
  data: IntelligenceData;
  isLoading: boolean;
  progress: number;
  sources?: Array<{ uri: string; title: string }>;
  onActionNavigate?: (path: string, idea: string) => void;
  idea: string;
}

export function IntelligenceDashboard({ data, isLoading, progress, sources = [], onActionNavigate, idea }: IntelligenceDashboardProps) {
  const [aiExpanded, setAiExpanded] = useState(false);
  const oppScore = useCounter(isLoading ? 0 : data.opportunityScore, 1400);
  const demandScore = useCounter(isLoading ? 0 : data.marketDemand, 1400);

  const growthSparkline = [30, 35, 38, 42, 50, 58, 65, 72, 80, 85, 90, 95];
  const demandSparkline = [20, 28, 32, 40, 48, 55, 60, 68, 75, 80, 85, 88];

  const recColor = data.recommendation?.includes('STRONG') ? '#C5FF00'
    : data.recommendation === 'BUY' ? '#34d399'
    : data.recommendation === 'WATCH' ? '#fbbf24' : '#f87171';

  if (isLoading) return <LoadingSkeleton progress={progress} />;

  return (
    <div className="space-y-10">

      {/* ── 1. HERO OVERVIEW ─────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-6 md:p-8 space-y-6">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2">Intelligence Report</p>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight text-balance">{data.title || idea}</h1>
          </div>
          <div
            className="rounded-xl border px-4 py-2 text-center shrink-0"
            style={{ borderColor: `${recColor}30`, background: `${recColor}08` }}
          >
            <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-0.5">Recommendation</p>
            <p className="text-lg font-black" style={{ color: recColor }}>{data.recommendation || '—'}</p>
          </div>
        </div>

        {/* Score rings */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'Opp. Score', value: oppScore, suffix: '/100', ring: true, color: '#C5FF00' },
            { label: 'Market Demand', value: demandScore, suffix: '/100', ring: true, color: '#38bdf8' },
            { label: 'Revenue Est.', value: data.revenuePotential || '—', suffix: '', ring: false },
            { label: 'Competition', value: data.competition || '—', suffix: '', ring: false },
            { label: 'Difficulty', value: `${data.difficulty || '—'}/10`, suffix: '', ring: false },
            { label: 'Status', value: data.recommendation?.includes('BUY') ? 'Build It' : 'Analyze', suffix: '', ring: false },
          ].map(({ label, value, suffix, ring, color }) => (
            <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 flex flex-col items-center text-center gap-1">
              {ring ? (
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <ScoreRing value={typeof value === 'number' ? value : 0} size={48} color={color} />
                  <span className="absolute text-xs font-black" style={{ color }}>{value}</span>
                </div>
              ) : (
                <p className="text-lg font-black text-white mt-1">{value}{suffix}</p>
              )}
              <p className="text-[10px] text-white/30 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. KEY METRICS GRID ──────────────────────────────── */}
      <Section title="Key Metrics" icon={BarChart3} id="metrics">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(data.metrics || []).slice(0, 6).map((m, i) => (
            <Card key={i} className="space-y-2">
              <Label>{m.label}</Label>
              <p className="text-2xl font-black text-white tracking-tight">{m.value}</p>
              <MeterBar value={Math.min(95, 50 + i * 8)} color={i % 2 === 0 ? '#C5FF00' : '#38bdf8'} />
            </Card>
          ))}
        </div>
      </Section>

      {/* ── 3. MARKET INTELLIGENCE ───────────────────────────── */}
      <Section title="Market Intelligence" icon={TrendingUp} id="market">
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <Label>Growth Trend (12-Month)</Label>
            <div className="mt-3"><Sparkline values={growthSparkline} color="#C5FF00" h={60} /></div>
            <div className="flex justify-between mt-2 text-[10px] text-white/20 font-mono">
              <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
            </div>
          </Card>
          <Card>
            <Label>Market Demand Trend</Label>
            <div className="mt-3"><Sparkline values={demandSparkline} color="#38bdf8" h={60} /></div>
            <div className="flex justify-between mt-2 text-[10px] text-white/20 font-mono">
              <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
            </div>
          </Card>
        </div>
      </Section>

      {/* ── 4. COMPETITOR LANDSCAPE ──────────────────────────── */}
      {data.competitors && data.competitors.length > 0 && (
        <Section title="Competitor Landscape" icon={Users} id="competitors">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.competitors.map((c: CompetitorData) => (
              <Card key={c.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-white">{c.name}</p>
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/20" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { l: 'Revenue', v: c.revenue },
                    { l: 'Downloads', v: c.downloads },
                    { l: 'Growth', v: c.growth },
                    { l: 'Pricing', v: c.pricing },
                  ].map(({ l, v }) => (
                    <div key={l} className="bg-white/[0.02] rounded-lg px-2.5 py-2">
                      <p className="text-[10px] text-white/25 mb-0.5">{l}</p>
                      <p className="text-xs font-semibold text-white/70">{v || '—'}</p>
                    </div>
                  ))}
                </div>
                {c.strength != null && (
                  <div>
                    <p className="text-[10px] text-white/25 mb-1">Strength Index</p>
                    <MeterBar value={c.strength} color="#C5FF00" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* ── 5 & 6. PAIN POINTS + LOVED FEATURES ─────────────── */}
      <Section title="Customer Intelligence" icon={Flame} id="customers">
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <Label>Top User Complaints</Label>
            <div className="space-y-3 mt-2">
              {(data.painPoints || []).slice(0, 5).map((p: PainPoint, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-red-400/60 text-sm mt-0.5 shrink-0">🔥</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/60 leading-snug">{p.text}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 bg-red-400/15 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400/50 rounded-full" style={{ width: `${p.severity}%` }} />
                      </div>
                      <span className="text-[10px] text-white/20 font-mono shrink-0">{p.severity}%</span>
                      {p.source && (
                        <Badge className="text-[9px] bg-white/[0.03] text-white/25 border-white/[0.07] px-1.5 py-0">{p.source}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <Label>Most Loved Features</Label>
            <div className="space-y-3 mt-2">
              {(data.lovedFeatures || []).slice(0, 5).map((f: LovedFeature, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C5FF00]/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/60">{f.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-[#C5FF00]/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#C5FF00]/50 rounded-full" style={{ width: `${f.score}%` }} />
                      </div>
                      <span className="text-[10px] text-white/20 font-mono shrink-0">{f.score}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      {/* ── 7. OPPORTUNITY GAPS ──────────────────────────────── */}
      {data.marketGaps && data.marketGaps.length > 0 && (
        <Section title="Opportunity Gaps" icon={Target} id="gaps">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.marketGaps.map((g: MarketGap, i: number) => (
              <Card key={i} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-white/80 leading-snug flex-1">{g.title}</p>
                  <Badge className={cn('text-[10px] shrink-0 border font-semibold',
                    g.impact === 'High' ? 'bg-[#C5FF00]/10 text-[#C5FF00] border-[#C5FF00]/20' :
                    g.impact === 'Medium' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                    'bg-sky-400/10 text-sky-400 border-sky-400/20')}>{g.impact} Impact</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/[0.02] rounded-lg px-2.5 py-2">
                    <p className="text-[10px] text-white/25 mb-0.5">Gap Score</p>
                    <p className="text-sm font-black text-white/80">{g.gapScore}/100</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg px-2.5 py-2">
                    <p className="text-[10px] text-white/25 mb-0.5">Difficulty</p>
                    <p className={cn('text-sm font-black', g.difficulty === 'Easy' ? 'text-[#C5FF00]' : g.difficulty === 'Medium' ? 'text-amber-400' : 'text-red-400')}>{g.difficulty}</p>
                  </div>
                </div>
                <MeterBar value={g.gapScore} color="#C5FF00" />
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* ── 8. MONETIZATION ──────────────────────────────────── */}
      {data.monetization && data.monetization.length > 0 && (
        <Section title="Monetization Analysis" icon={DollarSign} id="monetization">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.monetization.map((m: MonetizationModel) => (
              <Card key={m.name} className="space-y-3 text-center">
                <p className="text-sm font-bold text-white/80">{m.name}</p>
                <Stars count={m.stars} />
                <div className="text-2xl font-black text-white">{m.score}</div>
                <MeterBar value={m.score} color={m.score >= 80 ? '#C5FF00' : m.score >= 60 ? '#fbbf24' : '#f87171'} />
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* ── 9. GROWTH CHANNELS ───────────────────────────────── */}
      {data.growthChannels && data.growthChannels.length > 0 && (
        <Section title="Growth Channel Analysis" icon={Zap} id="growth">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.growthChannels.map((ch: GrowthChannel) => (
              <Card key={ch.name} className="space-y-3 text-center">
                <p className="text-sm font-bold text-white/80">{ch.name}</p>
                <div className="relative w-14 h-14 flex items-center justify-center mx-auto">
                  <ScoreRing value={ch.potential} size={56} color={ch.potential >= 80 ? '#C5FF00' : ch.potential >= 65 ? '#fbbf24' : '#60a5fa'} />
                  <span className="absolute text-xs font-black text-white">{ch.potential}</span>
                </div>
                {ch.rec && (
                  <Badge className={cn('text-[10px] border font-semibold mx-auto',
                    ch.rec === 'Strong' ? 'bg-[#C5FF00]/10 text-[#C5FF00] border-[#C5FF00]/20' :
                    ch.rec === 'Good' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                    'bg-white/[0.04] text-white/40 border-white/10')}>{ch.rec}</Badge>
                )}
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* ── 10. FOUNDER RECOMMENDATION ───────────────────────── */}
      {data.founderRec && (
        <Section title="AI Founder Recommendation" icon={Award} id="recommendation">
          <Card className="space-y-5">
            <div className="flex items-start gap-6 flex-wrap">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <p className="text-[10px] text-white/25 uppercase tracking-wider">Verdict</p>
                <div className={cn('text-4xl font-black mt-1',
                  data.founderRec.verdict === 'YES' ? 'text-[#C5FF00]' :
                  data.founderRec.verdict === 'MAYBE' ? 'text-amber-400' : 'text-red-400')}>
                  {data.founderRec.verdict}
                </div>
                <p className="text-xs text-white/30 font-mono">{data.founderRec.confidence}% conf.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1 min-w-0">
                {[
                  { l: 'Build Time', v: data.founderRec.buildTime },
                  { l: 'Risk Level', v: data.founderRec.risk },
                  { l: 'Potential', v: data.founderRec.potential },
                ].map(({ l, v }) => (
                  <div key={l} className="bg-white/[0.02] rounded-xl border border-white/[0.07] p-3 text-center">
                    <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">{l}</p>
                    <p className="text-sm font-black text-white/80">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-white/[0.07] pt-4">
              <p className="text-sm text-white/55 leading-relaxed text-pretty">{data.founderRec.reasoning}</p>
            </div>
          </Card>
        </Section>
      )}

      {/* ── 11. ACTION CENTER ────────────────────────────────── */}
      <Section title="Action Center" icon={Rocket} id="actions">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {ACTION_BUTTONS.map(({ label, icon: Icon, path, color }) => (
            <button
              key={label}
              onClick={() => onActionNavigate?.(path, idea)}
              className={cn(
                'flex items-center gap-2.5 h-10 px-4 rounded-lg text-xs font-semibold border transition-all text-left',
                color,
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" /> {label}
            </button>
          ))}
        </div>
      </Section>

      {/* ── 12. AI DEEP ANALYSIS (collapsible) ───────────────── */}
      {data.aiAnalysis && (
        <Section title="AI Deep Analysis" icon={FileText} id="analysis">
          <Card>
            <button
              onClick={() => setAiExpanded((p) => !p)}
              className="w-full flex items-center justify-between text-left gap-3"
            >
              <span className="text-sm text-white/40 font-medium">
                {aiExpanded ? 'Hide full analysis' : 'View full AI analysis — detailed reasoning, research sources, and assumptions'}
              </span>
              {aiExpanded ? <ChevronUp className="w-4 h-4 text-white/30 shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />}
            </button>
            {aiExpanded && (
              <div className="mt-4 pt-4 border-t border-white/[0.07]">
                <p className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap text-pretty">{data.aiAnalysis}</p>
              </div>
            )}
          </Card>
        </Section>
      )}

      {/* ── Sources ──────────────────────────────────────────── */}
      {sources.length > 0 && (
        <div className="pt-2">
          <p className="text-[10px] font-semibold text-white/20 uppercase tracking-wider mb-2">Research Sources</p>
          <div className="flex flex-wrap gap-2">
            {sources.map((src, i) => (
              <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 bg-white/[0.02] px-2.5 py-1 rounded-lg border border-white/[0.07] transition-colors">
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-40">{src.title || src.uri}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
