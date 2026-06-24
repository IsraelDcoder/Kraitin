import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/AppLayout';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Search, Zap, RotateCcw, Download, Copy, Check,
  ChevronRight, Clock, AlertTriangle, Lightbulb, Code2,
  Star, TrendingUp, BarChart3, Loader2, CalendarDays,
  Rocket, ShieldAlert, Package, ListChecks, Target,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
} from 'recharts';
import { toast } from 'sonner';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const HISTORY_KEY = 'kraitin_teardown_v2';
function getHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'); } catch { return []; }
}
function saveHistory(c: string) {
  const h = [c, ...getHistory().filter(x => x !== c)].slice(0, 8);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

const EXAMPLES = [
  { label: 'Hot right now', items: ['Cal AI', 'Cursor', 'Lovable', 'Perplexity'] },
  { label: 'Unicorns',      items: ['Notion', 'Figma', 'Linear', 'Stripe'] },
  { label: 'Consumer apps', items: ['Duolingo', 'Headspace', 'Loom', 'Superhuman'] },
];

const PIE_COLORS = ['#C5FF00', '#4ade80', '#60a5fa', '#f59e0b', '#a78bfa'];

// ── Types ──────────────────────────────────────────────────────────
interface TeardownData {
  company: string; tagline: string; score: number;
  marketPosition: string; growthStatus: string; businessModel: string; replicability: string;
  overview: { revenue: string; users: string; funding: string; market: string; employees: string; founded: string; mrr: string; valuation: string };
  scores: { product: number; distribution: number; monetization: number; retention: number; virality: number; brand: number };
  timeline: Array<{ year: string; event: string; milestone: boolean }>;
  revenueStreams: Array<{ name: string; percentage: number }>;
  revenueExplanation: string;
  productFlow: Array<{ step: string; description: string }>;
  contentChannels: Array<{ channel: string; stars: number }>;
  contentThemes: string[];
  viralHooks: Array<{ hook: string; views: string; why: string }>;
  postingFrequency: Array<{ platform: string; frequency: string }>;
  adIntelligence: { activeAds: string; winningHook: string; primaryCTA: string; offer: string; primaryPlatform: string };
  competitors: Array<{ name: string; revenue: string; growth: string; rating: number; position: string }>;
  moat: { strength: number; networkEffects: boolean; brand: boolean; dataAdvantage: boolean; habitFormation: string; switchingCost: string; explanation: string };
  weaknesses: Array<{ title: string; description: string; severity: 'High' | 'Medium' | 'Low' }>;
  opportunities: Array<{ title: string; potential: number; difficulty: 'Low' | 'Medium' | 'High'; description: string }>;
  blueprint: { buildCost: string; buildTime: string; complexity: string; techStack: string[]; monetization: string; launchChannel: string; wedge: string; mvpFeatures: string[] };
  verdict: { score: number; headline: string; insight: string; founderTakeaway: string };
}

// ── Blueprint Types ────────────────────────────────────────────────
interface WeeklyPlan   { week: string; phase: string; focus: string; tasks: string[]; deliverable: string }
interface TechSetupItem { name: string; purpose: string; setupNotes: string }
interface TechSetup    { category: string; items: TechSetupItem[] }
interface ChecklistItem { task: string; priority: 'High' | 'Medium' | 'Low' }
interface Checklist    { category: string; items: ChecklistItem[] }
interface DayPlan      { goal: string; keyActions: string[]; metric: string }
interface AcqChannel   { channel: string; strategy: string; firstStep: string; estimatedCost: string; expectedResult: string }
interface MonetStep    { step: number; action: string; timing: string; goal: string }
interface Risk         { risk: string; probability: string; impact: string; mitigation: string }
interface FullBlueprint {
  company: string; headline: string; summary: string; successMetric: string;
  weeklyPlan: WeeklyPlan[];
  techSetup: TechSetup[];
  launchChecklist: Checklist[];
  ninetyDayPlan: { day30: DayPlan; day60: DayPlan; day90: DayPlan };
  acquisitionPlaybook: AcqChannel[];
  monetizationSteps: MonetStep[];
  risks: Risk[];
  founderAdvice: string;
}

// ── Blueprint skeleton ─────────────────────────────────────────────
function BlueprintSkeleton() {
  return (
    <div className="mt-8 space-y-6 animate-pulse border-t border-white/[0.05] pt-8">
      <div className="flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-[#C5FF00]/50 animate-spin shrink-0" />
        <p className="text-sm text-white/30">Generating your full founder blueprint<span className="ml-1 inline-flex gap-1">
          <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce [animation-delay:0ms]" />
          <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce [animation-delay:120ms]" />
          <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce [animation-delay:240ms]" />
        </span></p>
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-2.5 w-32 bg-white/[0.05] rounded" />
          <div className="grid grid-cols-3 gap-3">{[...Array(3)].map((_,j) => <div key={j} className="h-20 bg-white/[0.03] rounded-xl" />)}</div>
        </div>
      ))}
    </div>
  );
}

const PRIORITY_CLS = {
  High:   'text-red-400 border-red-400/30 bg-red-400/[0.06]',
  Medium: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/[0.06]',
  Low:    'text-emerald-400 border-emerald-400/30 bg-emerald-400/[0.06]',
};

// ── Full Blueprint render ──────────────────────────────────────────
function FullBlueprintPanel({
  bp,
  checked,
  onToggle,
}: {
  bp: FullBlueprint;
  checked: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  // helpers
  const weekDone  = (wi: number) => bp.weeklyPlan[wi].tasks.filter((_, ti) => checked[`w-${wi}-${ti}`]).length;
  const weekTotal = (wi: number) => bp.weeklyPlan[wi].tasks.length;
  const catDone   = (ci: number) => bp.launchChecklist[ci].items.filter((_, ii) => checked[`cl-${ci}-${ii}`]).length;
  const catTotal  = (ci: number) => bp.launchChecklist[ci].items.length;

  // total progress
  const allWeekTasks  = bp.weeklyPlan.reduce((s, w) => s + w.tasks.length, 0);
  const doneWeekTasks = bp.weeklyPlan.reduce((s, w, wi) => s + weekDone(wi), 0);
  const allClItems    = bp.launchChecklist.reduce((s, c) => s + c.items.length, 0);
  const doneClItems   = bp.launchChecklist.reduce((s, c, ci) => s + catDone(ci), 0);
  const totalItems    = allWeekTasks + allClItems;
  const totalDone     = doneWeekTasks + doneClItems;
  const overallPct    = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  return (
    <div className="mt-8 border-t border-white/[0.05] pt-8 space-y-10">

      {/* Header */}
      <div className="border border-[#C5FF00]/15 bg-[#C5FF00]/[0.03] rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-[#C5FF00]" />
            <span className="text-[10px] text-[#C5FF00]/50 uppercase tracking-widest font-semibold">Full Founder Blueprint</span>
          </div>
          {totalItems > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-28 h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C5FF00] rounded-full transition-all duration-500"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-[#C5FF00]">{overallPct}%</span>
              <span className="text-[10px] text-white/25">{totalDone}/{totalItems} done</span>
            </div>
          )}
        </div>
        <h3 className="text-xl font-black text-white mb-2 text-balance">{bp.headline}</h3>
        <p className="text-sm text-white/50 leading-relaxed mb-4 max-w-2xl">{bp.summary}</p>
        <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5">
          <Target className="w-3.5 h-3.5 text-[#C5FF00] shrink-0" />
          <span className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mr-1">Success metric:</span>
          <span className="text-sm font-bold text-white/80">{bp.successMetric}</span>
        </div>
      </div>

      {/* Weekly Build Plan */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-4 h-4 text-white/25" />
          <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] font-semibold">Week-by-Week Build Plan</p>
          <span className="ml-auto text-[10px] text-white/20">{doneWeekTasks}/{allWeekTasks} tasks</span>
        </div>
        <div className="space-y-3">
          {bp.weeklyPlan.map((w, wi) => {
            const done  = weekDone(wi);
            const total = weekTotal(wi);
            const allDone = done === total;
            return (
              <div key={wi} className={cn('border rounded-xl overflow-hidden transition-colors duration-300',
                allDone ? 'border-[#C5FF00]/20' : 'border-white/[0.06]')}>
                <div className={cn('flex items-center gap-3 px-4 py-3 border-b transition-colors duration-300',
                  allDone ? 'bg-[#C5FF00]/[0.04] border-[#C5FF00]/10' : 'bg-white/[0.025] border-white/[0.04]')}>
                  <div className={cn('w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors duration-300',
                    allDone ? 'bg-[#C5FF00]/20 border-[#C5FF00]/40' : 'bg-[#C5FF00]/10 border-[#C5FF00]/20')}>
                    {allDone
                      ? <Check className="w-3 h-3 text-[#C5FF00]" />
                      : <span className="text-[10px] font-black text-[#C5FF00]">{wi + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={cn('text-xs font-bold transition-colors duration-300', allDone ? 'text-white/40 line-through' : 'text-white')}>{w.week}</span>
                      <span className="text-[10px] text-[#C5FF00]/50 font-semibold uppercase tracking-wide">{w.phase}</span>
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5">{w.focus}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-[10px] font-bold tabular-nums transition-colors duration-300', done > 0 ? 'text-[#C5FF00]' : 'text-white/20')}>
                        {done}/{total}
                      </span>
                    </div>
                    {/* per-week progress bar */}
                    <div className="w-16 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-[#C5FF00] rounded-full transition-all duration-500"
                        style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }} />
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="grid gap-y-2">
                    {w.tasks.map((t, ti) => {
                      const key = `w-${wi}-${ti}`;
                      const isChecked = !!checked[key];
                      return (
                        <button
                          key={ti}
                          onClick={() => onToggle(key)}
                          className="flex items-center gap-2.5 text-left group w-full"
                        >
                          {/* custom checkbox */}
                          <span className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all duration-200',
                            isChecked
                              ? 'bg-[#C5FF00] border-[#C5FF00] scale-[0.95]'
                              : 'border-white/15 bg-white/[0.03] group-hover:border-white/30'
                          )}>
                            {isChecked && <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />}
                          </span>
                          <span className={cn(
                            'text-[11px] leading-snug transition-all duration-200',
                            isChecked ? 'line-through text-white/20' : 'text-white/50 group-hover:text-white/70'
                          )}>
                            {t}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* bottom deliverable */}
                <div className="px-4 pb-3 flex items-center gap-2">
                  <span className="text-[9px] text-white/15 uppercase tracking-wider font-semibold">Deliverable:</span>
                  <span className={cn('text-[10px] font-semibold leading-snug transition-colors duration-300',
                    allDone ? 'text-[#C5FF00]/60' : 'text-white/35')}>{w.deliverable}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 90-Day Plan */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-white/25" />
          <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] font-semibold">30 / 60 / 90 Day Plan</p>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {([
            { label: 'Day 30', plan: bp.ninetyDayPlan.day30, accent: 'border-blue-500/20 bg-blue-500/[0.03]' },
            { label: 'Day 60', plan: bp.ninetyDayPlan.day60, accent: 'border-[#C5FF00]/15 bg-[#C5FF00]/[0.02]' },
            { label: 'Day 90', plan: bp.ninetyDayPlan.day90, accent: 'border-emerald-500/20 bg-emerald-500/[0.03]' },
          ] as const).map(({ label, plan, accent }) => (
            <div key={label} className={cn('border rounded-xl p-5', accent)}>
              <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-2">{label}</p>
              <p className="text-sm font-bold text-white mb-3 text-balance">{plan.goal}</p>
              <div className="space-y-1.5 mb-4">
                {plan.keyActions.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-white/45">
                    <ChevronRight className="w-3 h-3 text-white/20 shrink-0 mt-0.5" />{a}
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-white/[0.05]">
                <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Target metric</p>
                <p className="text-[11px] text-white/60 font-semibold">{plan.metric}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Setup */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="w-4 h-4 text-white/25" />
          <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] font-semibold">Tech Stack Setup</p>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {bp.techSetup.map((cat, i) => (
            <div key={i} className="border border-white/[0.06] rounded-xl p-5">
              <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3">{cat.category}</p>
              <div className="space-y-3">
                {cat.items.map((item, j) => (
                  <div key={j} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C5FF00]/40 shrink-0 mt-1.5" />
                    <div>
                      <p className="text-xs font-bold text-white/80">{item.name}
                        <span className="ml-2 text-[10px] font-normal text-white/35">{item.purpose}</span>
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5 leading-snug">{item.setupNotes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Launch Checklist */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="w-4 h-4 text-white/25" />
          <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] font-semibold">Launch Checklist</p>
          <span className="ml-auto text-[10px] text-white/20">{doneClItems}/{allClItems} tasks</span>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {bp.launchChecklist.map((cat, ci) => {
            const done  = catDone(ci);
            const total = catTotal(ci);
            const allDone = done === total;
            return (
              <div key={ci} className={cn('border rounded-xl p-5 transition-colors duration-300',
                allDone ? 'border-[#C5FF00]/20 bg-[#C5FF00]/[0.02]' : 'border-white/[0.06]')}>
                <div className="flex items-center justify-between mb-3">
                  <p className={cn('text-[10px] uppercase tracking-wider font-semibold transition-colors duration-300',
                    allDone ? 'text-[#C5FF00]/50' : 'text-white/30')}>{cat.category}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-[10px] font-bold tabular-nums transition-colors duration-300',
                      done > 0 ? 'text-[#C5FF00]' : 'text-white/20')}>{done}/{total}</span>
                    <div className="w-10 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-[#C5FF00] rounded-full transition-all duration-500"
                        style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {cat.items.map((item, ii) => {
                    const key = `cl-${ci}-${ii}`;
                    const isChecked = !!checked[key];
                    return (
                      <button
                        key={ii}
                        onClick={() => onToggle(key)}
                        className="flex items-start gap-2.5 text-left group w-full"
                      >
                        <span className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200',
                          isChecked
                            ? 'bg-[#C5FF00] border-[#C5FF00] scale-[0.95]'
                            : 'border-white/15 bg-white/[0.03] group-hover:border-white/30'
                        )}>
                          {isChecked && <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-[11px] leading-snug transition-all duration-200',
                            isChecked ? 'line-through text-white/20' : 'text-white/60 group-hover:text-white/80')}>
                            {item.task}
                          </p>
                        </div>
                        <span className={cn('text-[9px] font-bold border rounded px-1.5 py-0.5 shrink-0 transition-opacity duration-200',
                          isChecked ? 'opacity-30' : 'opacity-100',
                          PRIORITY_CLS[item.priority as keyof typeof PRIORITY_CLS] ?? PRIORITY_CLS.Low)}>
                          {item.priority}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Acquisition Playbook */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-white/25" />
          <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] font-semibold">Customer Acquisition Playbook</p>
        </div>
        <div className="space-y-3">
          {bp.acquisitionPlaybook.map((ch, i) => (
            <div key={i} className="border border-white/[0.06] rounded-xl p-5 grid md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-black text-white mb-1">{ch.channel}</p>
                <p className="text-[11px] text-white/40 leading-snug">{ch.strategy}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">First Step</p>
                <p className="text-[11px] text-white/60 leading-snug">{ch.firstStep}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Est. Cost</p>
                <p className="text-sm font-bold text-[#C5FF00]">{ch.estimatedCost}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">30-Day Result</p>
                <p className="text-[11px] text-white/50 leading-snug">{ch.expectedResult}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monetization Steps */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-white/25" />
          <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] font-semibold">Path to First $1k MRR</p>
        </div>
        <div className="relative">
          <div className="absolute left-[19px] top-5 bottom-5 w-px bg-white/[0.06]" />
          <div className="space-y-3">
            {bp.monetizationSteps.map((s, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full border border-[#C5FF00]/25 bg-[#C5FF00]/[0.06] flex items-center justify-center shrink-0 z-10">
                  <span className="text-xs font-black text-[#C5FF00]">{s.step}</span>
                </div>
                <div className="flex-1 border border-white/[0.05] rounded-xl px-4 py-3 bg-white/[0.015]">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white">{s.action}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-white/25 border border-white/[0.07] rounded px-2 py-0.5">{s.timing}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#C5FF00]/60 mt-1.5 font-semibold">{s.goal}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risks */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="w-4 h-4 text-white/25" />
          <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] font-semibold">Key Risks & Mitigations</p>
        </div>
        <div className="space-y-3">
          {bp.risks.map((r, i) => (
            <div key={i} className="border border-white/[0.06] rounded-xl p-5 grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400/60 shrink-0" />
                  <p className="text-sm font-bold text-white/85">{r.risk}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div><p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Probability</p>
                  <span className={cn('text-[10px] font-bold border rounded px-1.5 py-0.5', r.probability === 'High' ? PRIORITY_CLS.High : r.probability === 'Medium' ? PRIORITY_CLS.Medium : PRIORITY_CLS.Low)}>{r.probability}</span>
                </div>
                <div><p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Impact</p>
                  <span className={cn('text-[10px] font-bold border rounded px-1.5 py-0.5', r.impact === 'High' ? PRIORITY_CLS.High : r.impact === 'Medium' ? PRIORITY_CLS.Medium : PRIORITY_CLS.Low)}>{r.impact}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Mitigation</p>
                <p className="text-[11px] text-white/50 leading-snug">{r.mitigation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Founder Advice */}
      <div className="border border-white/[0.07] rounded-2xl p-6 bg-white/[0.01]">
        <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] font-semibold mb-3">Founder Advice</p>
        <p className="text-sm text-white/60 leading-relaxed italic">"{bp.founderAdvice}"</p>
      </div>

    </div>
  );
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-white/25 uppercase tracking-[0.12em] font-semibold mb-4">{children}</p>;
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-4">
      <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">{label}</p>
      <p className={cn('text-xl font-black', accent ? 'text-[#C5FF00]' : 'text-white')}>{value}</p>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 90 ? 'text-[#C5FF00] border-[#C5FF00]/30 bg-[#C5FF00]/[0.06]'
    : score >= 75 ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/[0.06]'
    : 'text-yellow-400 border-yellow-400/30 bg-yellow-400/[0.06]';
  return <span className={cn('inline-flex items-center text-xs font-bold border rounded-lg px-2 py-0.5', cls)}>{score}</span>;
}

function StatusPill({ value }: { value: string }) {
  const v = value.toLowerCase();
  const cls = v.includes('hypergrowth') || v.includes('dominant') || v.includes('extreme') || v.includes('leader')
    ? 'bg-[#C5FF00]/[0.08] text-[#C5FF00] border-[#C5FF00]/20'
    : v.includes('growth') || v.includes('strong') || v.includes('low')
    ? 'bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/20'
    : v.includes('high') || v.includes('medium')
    ? 'bg-yellow-500/[0.08] text-yellow-400 border-yellow-500/20'
    : 'bg-white/[0.04] text-white/50 border-white/[0.08]';
  return <span className={cn('text-[11px] font-semibold border rounded-lg px-2.5 py-1', cls)}>{value}</span>;
}

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={cn('w-3 h-3', i <= stars ? 'text-[#C5FF00] fill-[#C5FF00]' : 'text-white/15')} />
      ))}
    </div>
  );
}

function MoatBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1.5">
        <span className="text-white/50">{label}</span>
        <span className="text-white/70 font-semibold">{value}%</span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-[#C5FF00]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.07] text-white/30 hover:text-white/60 text-[11px] transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-[#C5FF00]" /> : <Copy className="w-3.5 h-3.5" />}
      {label && <span className="hidden sm:inline">{copied ? 'Copied' : label}</span>}
    </button>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────
function DossierSkeleton({ company }: { company: string }) {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-[#C5FF00]/50 animate-ping" />
        <p className="text-sm text-white/30">
          Generating intelligence dossier for <span className="text-white/60 font-semibold">{company}</span>
          <span className="ml-1 inline-flex gap-1">
            <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce [animation-delay:0ms]" />
            <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce [animation-delay:120ms]" />
            <span className="w-1 h-1 rounded-full bg-white/30 animate-bounce [animation-delay:240ms]" />
          </span>
        </p>
      </div>
      <div className="h-32 bg-white/[0.03] rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[...Array(8)].map((_,i)=><div key={i} className="h-20 bg-white/[0.03] rounded-xl" />)}</div>
      <div className="h-48 bg-white/[0.03] rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[...Array(4)].map((_,i)=><div key={i} className="h-24 bg-white/[0.03] rounded-xl" />)}</div>
    </div>
  );
}

// ── Full Dossier ────────────────────────────────────────────────────
function Dossier({ data, bpLoading, onGenerateBlueprint }: { data: TeardownData; bpLoading: boolean; onGenerateBlueprint: () => void }) {
  const radarData = [
    { subject: 'Product',      value: data.scores.product },
    { subject: 'Distribution', value: data.scores.distribution },
    { subject: 'Monetization', value: data.scores.monetization },
    { subject: 'Retention',    value: data.scores.retention },
    { subject: 'Virality',     value: data.scores.virality },
    { subject: 'Brand',        value: data.scores.brand },
  ];

  return (
    <div className="space-y-10">

      {/* HERO */}
      <div className="border border-white/[0.06] rounded-2xl p-6 md:p-8 bg-white/[0.015]">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[10px] text-white/25 uppercase tracking-widest font-semibold border border-white/[0.07] rounded px-2 py-0.5">Startup Intelligence Report</span>
              <span className="text-[10px] text-white/15 uppercase tracking-widest">Generated by Kraitin</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">{data.company}</h2>
            <p className="text-sm text-white/45 max-w-xl text-pretty">{data.tagline}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Score</p>
            <p className="text-5xl font-black text-[#C5FF00]">{data.score}<span className="text-xl text-white/30">/100</span></p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-white/[0.05]">
          {[
            { label: 'Market Position', value: data.marketPosition },
            { label: 'Growth Status',   value: data.growthStatus },
            { label: 'Business Model',  value: data.businessModel },
            { label: 'Replicability',   value: data.replicability },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] text-white/25">{label}:</span>
              <StatusPill value={value} />
            </div>
          ))}
        </div>
      </div>

      {/* S1: OVERVIEW */}
      <div>
        <SectionLabel>01 — Intelligence Overview</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Annual Revenue"    value={data.overview.revenue}   accent />
          <MetricCard label="Users / Customers" value={data.overview.users} />
          <MetricCard label="Est. MRR"          value={data.overview.mrr}       accent />
          <MetricCard label="Valuation"         value={data.overview.valuation} />
          <MetricCard label="Funding"           value={data.overview.funding} />
          <MetricCard label="Market"            value={data.overview.market} />
          <MetricCard label="Employees"         value={data.overview.employees} />
          <MetricCard label="Founded"           value={data.overview.founded} />
        </div>
      </div>

      {/* S2: WHY THEY WIN */}
      <div>
        <SectionLabel>02 — Why They Win</SectionLabel>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid grid-cols-2 gap-2 content-start">
            {Object.entries(data.scores).map(([key, val]) => (
              <div key={key} className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2 capitalize">{key}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#C5FF00]" style={{ width: `${val}%` }} />
                  </div>
                  <span className="text-sm font-black text-white shrink-0">{val}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} />
                <Radar dataKey="value" stroke="#C5FF00" fill="#C5FF00" fillOpacity={0.12} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* S3: TIMELINE */}
      <div>
        <SectionLabel>03 — Growth Timeline</SectionLabel>
        <div className="border border-white/[0.06] rounded-2xl p-6">
          <div className="flex gap-0 overflow-x-auto pb-2">
            {data.timeline.map((item, i) => (
              <div key={i} className="flex flex-col items-center min-w-[120px] flex-1 relative">
                {i < data.timeline.length - 1 && <div className="absolute top-3.5 left-1/2 w-full h-px bg-white/[0.06]" />}
                <div className={cn('w-7 h-7 rounded-full border-2 flex items-center justify-center z-10 shrink-0', item.milestone ? 'border-[#C5FF00] bg-[#C5FF00]/10' : 'border-white/15 bg-[#06070a]')}>
                  <div className={cn('w-2 h-2 rounded-full', item.milestone ? 'bg-[#C5FF00]' : 'bg-white/20')} />
                </div>
                <p className={cn('text-xs font-bold mt-2.5', item.milestone ? 'text-[#C5FF00]' : 'text-white/40')}>{item.year}</p>
                <p className="text-[11px] text-white/45 text-center mt-1 px-1 leading-snug">{item.event}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* S4: BUSINESS MODEL */}
      <div>
        <SectionLabel>04 — Business Model Breakdown</SectionLabel>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={data.revenueStreams} dataKey="percentage" nameKey="name" cx="50%" cy="50%" outerRadius={70} strokeWidth={0}>
                  {data.revenueStreams.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0d0e11', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {data.revenueStreams.map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/[0.025] border border-white/[0.06] rounded-xl px-4 py-3">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{s.name}</p>
                  <div className="h-1 bg-white/[0.06] rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.percentage}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  </div>
                </div>
                <span className="text-lg font-black text-white shrink-0">{s.percentage}%</span>
              </div>
            ))}
            <p className="text-xs text-white/35 leading-relaxed px-1">{data.revenueExplanation}</p>
          </div>
        </div>
      </div>

      {/* S5: PRODUCT ARCHITECTURE */}
      <div>
        <SectionLabel>05 — Product Architecture</SectionLabel>
        <div className="border border-white/[0.06] rounded-2xl p-6">
          <div className="flex flex-col md:flex-row items-stretch gap-0">
            {data.productFlow.map((item, i) => (
              <div key={i} className="flex md:flex-col items-center flex-1">
                <div className="flex-1 md:w-full">
                  <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3.5 text-center">
                    <p className="text-xs font-bold text-white mb-1">{item.step}</p>
                    <p className="text-[10px] text-white/35 leading-snug">{item.description}</p>
                  </div>
                </div>
                {i < data.productFlow.length - 1 && (
                  <div className="flex items-center justify-center w-8 md:w-full md:h-6 shrink-0">
                    <span className="text-white/15 font-bold hidden md:block">↓</span>
                    <span className="text-white/15 font-bold md:hidden">→</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* S6: CONTENT INTELLIGENCE */}
      <div>
        <SectionLabel>06 — Content Intelligence</SectionLabel>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-3">
            <p className="text-[11px] text-white/30 font-semibold mb-3">Channel Performance</p>
            {data.contentChannels.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-white/65">{c.channel}</span>
                <StarRating stars={c.stars} />
              </div>
            ))}
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <p className="text-[11px] text-white/30 font-semibold mb-3">Content Themes</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {data.contentThemes.map((t, i) => (
                <span key={i} className="text-[11px] bg-white/[0.04] border border-white/[0.07] text-white/55 rounded-lg px-2.5 py-1">{t}</span>
              ))}
            </div>
            <p className="text-[11px] text-white/25 uppercase tracking-wider font-semibold mb-2">Posting Frequency</p>
            <div className="space-y-1.5">
              {data.postingFrequency.map((p, i) => (
                <div key={i} className="flex justify-between text-[11px]">
                  <span className="text-white/35">{p.platform}</span>
                  <span className="text-white/60 font-semibold">{p.frequency}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <p className="text-[11px] text-white/30 font-semibold mb-3">Viral Hooks</p>
            <div className="space-y-3">
              {data.viralHooks.map((v, i) => (
                <div key={i} className="border-l-2 border-[#C5FF00]/25 pl-3 py-0.5">
                  <p className="text-xs font-semibold text-white/80 italic">"{v.hook}"</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <TrendingUp className="w-3 h-3 text-[#C5FF00]/50 shrink-0" />
                    <span className="text-[10px] text-[#C5FF00]/70 font-bold">{v.views} views</span>
                  </div>
                  <p className="text-[10px] text-white/30 mt-0.5">{v.why}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* S7: AD INTELLIGENCE */}
      <div>
        <SectionLabel>07 — Ad Intelligence</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {([
            { label: 'Active Ads',       value: data.adIntelligence.activeAds },
            { label: 'Winning Hook',     value: data.adIntelligence.winningHook },
            { label: 'Primary CTA',      value: data.adIntelligence.primaryCTA },
            { label: 'Offer',            value: data.adIntelligence.offer },
            { label: 'Primary Platform', value: data.adIntelligence.primaryPlatform },
          ] as { label: string; value: string }[]).map(({ label, value }) => (
            <div key={label} className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-4">
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">{label}</p>
              <p className="text-sm font-bold text-white leading-snug">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* S8: COMPETITOR MATRIX */}
      <div>
        <SectionLabel>08 — Competitor Matrix</SectionLabel>
        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.015]">
                  {['Company','Revenue','Growth','Score','Position'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] text-white/25 uppercase tracking-wider font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.competitors.map((c, i) => (
                  <tr key={i} className={cn('border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors', i === 0 && 'bg-[#C5FF00]/[0.03]')}>
                    <td className={cn('px-5 py-3.5 font-bold whitespace-nowrap', i === 0 ? 'text-[#C5FF00]' : 'text-white/80')}>{c.name}</td>
                    <td className="px-5 py-3.5 text-white/60 font-semibold">{c.revenue}</td>
                    <td className="px-5 py-3.5 text-white/60 font-semibold">{c.growth}</td>
                    <td className="px-5 py-3.5"><ScoreBadge score={c.rating} /></td>
                    <td className="px-5 py-3.5"><StatusPill value={c.position} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* S9: MOAT ANALYSIS */}
      <div>
        <SectionLabel>09 — Startup Moat Analysis</SectionLabel>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-5">
            <MoatBar label="Moat Strength" value={data.moat.strength} />
            <div className="grid grid-cols-2 gap-2 pt-1">
              {([
                { label: 'Network Effects', value: data.moat.networkEffects },
                { label: 'Brand Moat',      value: data.moat.brand },
                { label: 'Data Advantage',  value: data.moat.dataAdvantage },
              ] as { label: string; value: boolean }[]).map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={cn('w-4 h-4 rounded-sm flex items-center justify-center', value ? 'bg-[#C5FF00]/15 border border-[#C5FF00]/30' : 'bg-white/[0.04] border border-white/10')}>
                    {value && <Check className="w-2.5 h-2.5 text-[#C5FF00]" />}
                  </div>
                  <span className="text-[11px] text-white/50">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
            <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-3">Real Moat</p>
            <p className="text-sm text-white/60 leading-relaxed">{data.moat.explanation}</p>
            <div className="flex gap-3 mt-4 flex-wrap">
              <div><p className="text-[10px] text-white/25 uppercase tracking-wider mb-1.5">Habit Formation</p><StatusPill value={data.moat.habitFormation} /></div>
              <div><p className="text-[10px] text-white/25 uppercase tracking-wider mb-1.5">Switching Cost</p><StatusPill value={data.moat.switchingCost} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* S10: WEAKNESSES */}
      <div>
        <SectionLabel>10 — Weaknesses</SectionLabel>
        <div className="grid md:grid-cols-3 gap-3">
          {data.weaknesses.map((w, i) => (
            <div key={i} className="bg-red-500/[0.04] border border-red-500/15 rounded-xl p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400/70 shrink-0 mt-0.5" />
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', w.severity === 'High' ? 'text-red-400 border-red-400/30 bg-red-400/[0.08]' : 'text-yellow-400 border-yellow-400/30 bg-yellow-400/[0.08]')}>{w.severity}</span>
              </div>
              <p className="text-sm font-bold text-white/85 mb-1.5">{w.title}</p>
              <p className="text-xs text-white/45 leading-relaxed">{w.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* S11: OPPORTUNITY GAPS */}
      <div>
        <SectionLabel>11 — Opportunity Gaps</SectionLabel>
        <div className="grid md:grid-cols-3 gap-3">
          {data.opportunities.map((o, i) => (
            <div key={i} className="bg-emerald-500/[0.04] border border-emerald-500/15 rounded-xl p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-emerald-400/70 shrink-0 mt-0.5" />
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border',
                  o.difficulty === 'Low' ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/[0.08]'
                  : o.difficulty === 'Medium' ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/[0.08]'
                  : 'text-red-400 border-red-400/30 bg-red-400/[0.08]'
                )}>{o.difficulty} difficulty</span>
              </div>
              <p className="text-sm font-bold text-white/85 mb-1">{o.title}</p>
              <p className="text-xs text-white/45 leading-relaxed mb-3">{o.description}</p>
              <div>
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className="text-white/25">Potential</span>
                  <span className="text-emerald-400 font-bold">{o.potential}/100</span>
                </div>
                <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${o.potential}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* S12: CLONE BLUEPRINT */}
      <div>
        <SectionLabel>12 — Clone Blueprint</SectionLabel>
        <div className="border border-white/[0.06] rounded-2xl p-6 bg-white/[0.015]">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {([
              { label: 'Build Cost',    value: data.blueprint.buildCost,    accent: true },
              { label: 'Build Time',    value: data.blueprint.buildTime },
              { label: 'Complexity',    value: data.blueprint.complexity },
              { label: 'Monetization', value: data.blueprint.monetization },
              { label: 'Launch Channel',value: data.blueprint.launchChannel, accent: true },
            ] as { label: string; value: string; accent?: boolean }[]).map(({ label, value, accent }) => (
              <div key={label} className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-4">
                <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1.5">{label}</p>
                <p className={cn('text-sm font-bold', accent ? 'text-[#C5FF00]' : 'text-white/80')}>{value}</p>
              </div>
            ))}
            <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-4">
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Tech Stack</p>
              <div className="flex flex-wrap gap-1.5">
                {data.blueprint.techStack.map((t, i) => (
                  <span key={i} className="text-[11px] bg-white/[0.04] border border-white/[0.07] text-white/60 rounded px-2 py-0.5">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-[#C5FF00]/[0.04] border border-[#C5FF00]/15 rounded-xl p-4 mb-5">
            <p className="text-[10px] text-[#C5FF00]/50 uppercase tracking-wider font-semibold mb-1.5">The Wedge — Your Entry Angle</p>
            <p className="text-sm text-white/70">{data.blueprint.wedge}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-3">MVP Feature List</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.blueprint.mvpFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-white/60">
                  <div className="w-4 h-4 rounded border border-[#C5FF00]/25 bg-[#C5FF00]/[0.05] flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-[#C5FF00]" />
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-white/[0.05]">
            <button onClick={onGenerateBlueprint} disabled={bpLoading}
              className={cn(
                'flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-full transition-all',
                bpLoading
                  ? 'bg-white/[0.06] text-white/30 cursor-not-allowed'
                  : 'bg-[#C5FF00] text-black hover:bg-[#C5FF00]/90 hover:scale-[1.02]'
              )}>
              {bpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
              {bpLoading ? 'Generating Blueprint…' : 'Generate Full Blueprint →'}
            </button>
          </div>
        </div>
      </div>

      {/* S13: AI VERDICT */}
      <div>
        <SectionLabel>13 — AI Verdict</SectionLabel>
        <div className="border border-[#C5FF00]/15 bg-[#C5FF00]/[0.03] rounded-2xl p-6 md:p-8">
          <div className="flex items-start gap-5">
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-[#C5FF00]">{data.verdict.score}</span>
              <span className="text-[9px] text-[#C5FF00]/50 font-bold">/100</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#C5FF00]/40 uppercase tracking-widest font-semibold mb-2">Kraitin Verdict</p>
              <h3 className="text-xl md:text-2xl font-black text-white mb-3 text-balance">{data.verdict.headline}</h3>
              <p className="text-sm text-white/55 leading-relaxed mb-4">{data.verdict.insight}</p>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-1.5">Founder Takeaway</p>
                <p className="text-sm text-white/70 leading-relaxed italic">"{data.verdict.founderTakeaway}"</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function StartupTeardownPage() {
  const { premiumAccess, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery]     = useState('');
  const [company, setCompany] = useState('');
  const [data, setData]       = useState<TeardownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(getHistory);
  const [blueprint, setBlueprint] = useState<FullBlueprint | null>(null);
  const [bpLoading, setBpLoading] = useState(false);
  const [bpChecked, setBpChecked] = useState<Record<string, boolean>>({});
  const abortRef   = useRef<AbortController | null>(null);
  const blueprintRef = useRef<HTMLDivElement | null>(null);

  const bpStorageKey = data ? `kraitin_bp_progress_${data.company.toLowerCase().replace(/\s+/g, '_')}` : null;

  const toggleCheck = useCallback((key: string) => {
    setBpChecked(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (bpStorageKey) {
        try { localStorage.setItem(bpStorageKey, JSON.stringify(next)); } catch {}
      }
      return next;
    });
  }, [bpStorageKey]);

  // scroll to blueprint when it arrives
  useEffect(() => {
    if (blueprint && blueprintRef.current) {
      setTimeout(() => blueprintRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [blueprint]);

  const generateBlueprint = useCallback(async () => {
    if (!data || bpLoading) return;
    setBpLoading(true);
    setBlueprint(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-blueprint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, apikey: supabaseAnon },
        body: JSON.stringify({ company: data.company, blueprint: data.blueprint, scores: data.scores, wedge: data.blueprint.wedge }),
      });
      const json = await res.json();
      if (res.status === 402 || (json.error && json.error.toLowerCase().includes('insufficient'))) {
        toast.error('Out of credits. Your 500 credits reset on your next billing date.', { duration: 6000 });
        return;
      }
      if (res.status === 403) {
        toast.error('Pro plan required to generate a Complete Blueprint.');
        return;
      }
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      if (json.error) throw new Error(json.error);
      setBlueprint(json as FullBlueprint);
      // load saved progress for this company
      if (bpStorageKey) {
        try {
          const saved = localStorage.getItem(bpStorageKey);
          if (saved) setBpChecked(JSON.parse(saved));
          else setBpChecked({});
        } catch { setBpChecked({}); }
      } else {
        setBpChecked({});
      }
    } catch {
      toast.error('Blueprint generation failed. Please try again.');
    } finally {
      setBpLoading(false);
    }
  }, [data, bpLoading]);

  const runTeardown = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || loading) return;
    setCompany(trimmed);
    setData(null);
    setLoading(true);
    saveHistory(trimmed);
    setHistory(getHistory());
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      abortRef.current = new AbortController();
      const res = await fetch(`${supabaseUrl}/functions/v1/startup-teardown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, apikey: supabaseAnon },
        body: JSON.stringify({ company: trimmed }),
        signal: abortRef.current.signal,
      });
      const json = await res.json();
      if (res.status === 402 || (json.error && json.error.toLowerCase().includes('insufficient'))) {
        toast.error('Out of credits. Your 500 credits reset on your next billing date.', { duration: 6000 });
        setCompany('');
        return;
      }
      if (res.status === 403) {
        toast.error('Pro plan required to run Startup Teardown.');
        setCompany('');
        return;
      }
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      if (json.error) throw new Error(json.error);
      setData(json as TeardownData);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('Teardown failed. Please try again.');
        setCompany('');
      }
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const reset = () => {
    abortRef.current?.abort();
    setData(null); setBlueprint(null); setBpChecked({}); setCompany(''); setLoading(false); setQuery(''); setBpLoading(false);
  };

  const exportToPDF = () => {
    if (!data) return;
    const d = data;
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const moatRows = [
      ['Network Effects', d.moat.networkEffects ? 'Yes' : 'No'],
      ['Brand Moat',      d.moat.brand          ? 'Yes' : 'No'],
      ['Data Advantage',  d.moat.dataAdvantage   ? 'Yes' : 'No'],
      ['Habit Formation', d.moat.habitFormation],
      ['Switching Cost',  d.moat.switchingCost],
      ['Moat Strength',   `${d.moat.strength}%`],
    ];

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${d.company} — Startup Intelligence Report · Kraitin</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;line-height:1.5}
  @page{size:A4;margin:18mm 15mm}
  .page-break{page-break-before:always}

  /* Cover */
  .cover{padding:32px 0 28px;border-bottom:2.5px solid #1a1a1a;margin-bottom:24px}
  .cover-tag{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#666;margin-bottom:10px}
  .cover-name{font-size:36px;font-weight:900;letter-spacing:-.02em;color:#1a1a1a;margin-bottom:6px}
  .cover-tagline{font-size:13px;color:#555;margin-bottom:20px;max-width:520px}
  .cover-meta{display:flex;flex-wrap:wrap;gap:20px}
  .cover-meta-item{display:flex;flex-direction:column;gap:2px}
  .cover-meta-item .label{font-size:8px;text-transform:uppercase;letter-spacing:.1em;color:#999}
  .cover-meta-item .value{font-size:14px;font-weight:800;color:#1a1a1a}
  .cover-meta-item .value.lime{color:#3d7a00}
  .cover-score{margin-left:auto;text-align:right}
  .cover-score .score-num{font-size:52px;font-weight:900;color:#3d7a00;line-height:1}
  .cover-score .score-denom{font-size:16px;font-weight:400;color:#999}
  .cover-score .score-label{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#999;margin-top:2px}
  .pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
  .pill{font-size:9px;font-weight:700;border:1px solid #d0d0d0;border-radius:6px;padding:3px 8px;color:#333;background:#f5f5f5}

  /* Section headers */
  .section{margin-bottom:24px}
  .section-label{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:#999;margin-bottom:10px;padding-bottom:4px;border-bottom:1px solid #e8e8e8}

  /* Cards grid */
  .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:0}
  .cards-3{grid-template-columns:repeat(3,1fr)}
  .cards-2{grid-template-columns:repeat(2,1fr)}
  .card{border:1px solid #e8e8e8;border-radius:8px;padding:10px 12px}
  .card .card-label{font-size:8px;text-transform:uppercase;letter-spacing:.1em;color:#aaa;margin-bottom:4px}
  .card .card-value{font-size:15px;font-weight:900;color:#1a1a1a}
  .card .card-value.lime{color:#3d7a00}

  /* Score bars */
  .score-bar-row{display:flex;align-items:center;gap:10px;margin-bottom:6px}
  .score-bar-label{font-size:9.5px;color:#555;width:80px;flex-shrink:0;text-transform:capitalize}
  .score-bar-track{flex:1;height:5px;background:#efefef;border-radius:3px;overflow:hidden}
  .score-bar-fill{height:100%;background:#3d7a00;border-radius:3px}
  .score-bar-val{font-size:10px;font-weight:800;color:#1a1a1a;width:24px;text-align:right;flex-shrink:0}

  /* Tables */
  table{width:100%;border-collapse:collapse;font-size:10px}
  thead tr{background:#f2f2f2}
  th{text-align:left;padding:7px 10px;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#666;border-bottom:1px solid #e0e0e0}
  td{padding:7px 10px;border-bottom:1px solid #f0f0f0;color:#333;vertical-align:top}
  tr:last-child td{border-bottom:none}
  tr:nth-child(even){background:#fafafa}
  .badge{display:inline-block;font-size:8px;font-weight:700;padding:2px 6px;border-radius:4px;border:1px solid}
  .badge-high{color:#b91c1c;border-color:#fca5a5;background:#fef2f2}
  .badge-med{color:#92400e;border-color:#fcd34d;background:#fffbeb}
  .badge-low{color:#166534;border-color:#86efac;background:#f0fdf4}
  .badge-leader{color:#3d7a00;border-color:#a3e635;background:#f7ffe0}

  /* Timeline */
  .timeline{display:flex;flex-direction:column;gap:0}
  .tl-item{display:flex;gap:12px;align-items:flex-start;padding:6px 0}
  .tl-item:not(:last-child){border-bottom:1px solid #f5f5f5}
  .tl-year{font-size:10px;font-weight:800;color:#3d7a00;width:36px;flex-shrink:0;padding-top:1px}
  .tl-year.normal{color:#999}
  .tl-event{font-size:10px;color:#444}
  .tl-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:3px}
  .tl-dot.milestone{background:#3d7a00}
  .tl-dot.normal{background:#ccc}

  /* Revenue breakdown */
  .rev-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid #f0f0f0;border-radius:6px;margin-bottom:6px}
  .rev-color{width:10px;height:10px;border-radius:2px;flex-shrink:0}
  .rev-name{flex:1;font-size:10px;font-weight:600;color:#333}
  .rev-bar-track{width:120px;height:5px;background:#efefef;border-radius:3px;overflow:hidden;flex-shrink:0}
  .rev-bar-fill{height:100%;border-radius:3px}
  .rev-pct{font-size:11px;font-weight:900;color:#1a1a1a;width:30px;text-align:right;flex-shrink:0}

  /* Product flow */
  .flow{display:flex;gap:0;align-items:stretch}
  .flow-step{flex:1;text-align:center;padding:10px 6px;border:1px solid #e8e8e8;border-radius:6px}
  .flow-step:not(:last-child){border-right:none;border-radius:6px 0 0 6px}
  .flow-step+.flow-step{border-radius:0}
  .flow-step:last-child{border-radius:0 6px 6px 0}
  .flow-step-name{font-size:9px;font-weight:800;color:#1a1a1a;margin-bottom:3px}
  .flow-step-desc{font-size:8.5px;color:#888;line-height:1.35}

  /* Hooks */
  .hook-card{border-left:3px solid #a3e635;padding:8px 12px;margin-bottom:8px;background:#fafff0}
  .hook-text{font-style:italic;font-size:10px;font-weight:600;color:#1a1a1a;margin-bottom:3px}
  .hook-meta{font-size:8.5px;color:#888}

  /* Weakness / Opportunity cards */
  .w-card{border:1px solid #fca5a5;background:#fff8f8;border-radius:8px;padding:10px 12px;margin-bottom:8px}
  .o-card{border:1px solid #86efac;background:#f0fdf4;border-radius:8px;padding:10px 12px;margin-bottom:8px}
  .woc-title{font-size:10px;font-weight:800;color:#1a1a1a;margin-bottom:3px}
  .woc-desc{font-size:9.5px;color:#666;line-height:1.4}
  .o-bar-track{height:4px;background:#d1fae5;border-radius:2px;overflow:hidden;margin-top:6px}
  .o-bar-fill{height:100%;background:#22c55e;border-radius:2px}

  /* Blueprint */
  .wedge-box{border:1px solid #a3e635;background:#f7ffe0;border-radius:8px;padding:12px 14px;margin-bottom:12px}
  .wedge-label{font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#4d7a00;margin-bottom:4px}
  .wedge-text{font-size:10.5px;color:#333}
  .mvp-list{list-style:none;display:grid;grid-template-columns:repeat(2,1fr);gap:4px 16px}
  .mvp-list li{font-size:10px;color:#444;padding-left:14px;position:relative}
  .mvp-list li::before{content:'✓';position:absolute;left:0;color:#3d7a00;font-weight:800}

  /* Verdict */
  .verdict-box{border:2px solid #a3e635;background:#f7ffe0;border-radius:10px;padding:20px 22px;margin-top:4px}
  .verdict-score{font-size:40px;font-weight:900;color:#3d7a00;line-height:1}
  .verdict-denom{font-size:13px;color:#999}
  .verdict-headline{font-size:16px;font-weight:900;color:#1a1a1a;margin:10px 0 6px}
  .verdict-insight{font-size:10.5px;color:#555;line-height:1.55;margin-bottom:10px}
  .verdict-takeaway-label{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:4px}
  .verdict-takeaway{font-size:10.5px;font-style:italic;color:#333;line-height:1.5}

  /* Footer */
  .footer{margin-top:32px;padding-top:12px;border-top:1px solid #e8e8e8;display:flex;justify-content:space-between;align-items:center;font-size:8px;color:#bbb}
  .footer strong{color:#999}
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-tag">Startup Intelligence Report · Generated by Kraitin</div>
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <div class="cover-name">${d.company}</div>
      <div class="cover-tagline">${d.tagline}</div>
      <div class="cover-meta">
        <div class="cover-meta-item"><span class="label">Revenue</span><span class="value lime">${d.overview.revenue}</span></div>
        <div class="cover-meta-item"><span class="label">Users</span><span class="value">${d.overview.users}</span></div>
        <div class="cover-meta-item"><span class="label">Est. MRR</span><span class="value lime">${d.overview.mrr}</span></div>
        <div class="cover-meta-item"><span class="label">Valuation</span><span class="value">${d.overview.valuation}</span></div>
        <div class="cover-meta-item"><span class="label">Founded</span><span class="value">${d.overview.founded}</span></div>
      </div>
      <div class="pills">
        <span class="pill">${d.marketPosition}</span>
        <span class="pill">${d.growthStatus}</span>
        <span class="pill">${d.businessModel}</span>
        <span class="pill">Replicability: ${d.replicability}</span>
      </div>
    </div>
    <div class="cover-score">
      <div class="score-num">${d.score}</div>
      <div class="score-denom">/100</div>
      <div class="score-label">Overall Score</div>
    </div>
  </div>
</div>

<!-- S1: OVERVIEW -->
<div class="section">
  <div class="section-label">01 — Intelligence Overview</div>
  <div class="cards">
    <div class="card"><div class="card-label">Annual Revenue</div><div class="card-value lime">${d.overview.revenue}</div></div>
    <div class="card"><div class="card-label">Users / Customers</div><div class="card-value">${d.overview.users}</div></div>
    <div class="card"><div class="card-label">Est. MRR</div><div class="card-value lime">${d.overview.mrr}</div></div>
    <div class="card"><div class="card-label">Valuation</div><div class="card-value">${d.overview.valuation}</div></div>
    <div class="card"><div class="card-label">Funding</div><div class="card-value">${d.overview.funding}</div></div>
    <div class="card"><div class="card-label">Market</div><div class="card-value">${d.overview.market}</div></div>
    <div class="card"><div class="card-label">Employees</div><div class="card-value">${d.overview.employees}</div></div>
    <div class="card"><div class="card-label">Founded</div><div class="card-value">${d.overview.founded}</div></div>
  </div>
</div>

<!-- S2: SCORES -->
<div class="section">
  <div class="section-label">02 — Why They Win — Performance Scores</div>
  ${Object.entries(d.scores).map(([k, v]) => `
  <div class="score-bar-row">
    <div class="score-bar-label">${k}</div>
    <div class="score-bar-track"><div class="score-bar-fill" style="width:${v}%"></div></div>
    <div class="score-bar-val">${v}</div>
  </div>`).join('')}
</div>

<!-- S3: TIMELINE -->
<div class="section page-break">
  <div class="section-label">03 — Growth Timeline</div>
  <div class="timeline">
    ${d.timeline.map(t => `
    <div class="tl-item">
      <div class="tl-dot ${t.milestone ? 'milestone' : 'normal'}"></div>
      <div class="tl-year ${t.milestone ? '' : 'normal'}">${t.year}</div>
      <div class="tl-event">${t.event}</div>
    </div>`).join('')}
  </div>
</div>

<!-- S4: REVENUE -->
<div class="section">
  <div class="section-label">04 — Business Model Breakdown</div>
  ${d.revenueStreams.map((s, i) => {
    const colors = ['#3d7a00','#16a34a','#2563eb','#d97706','#7c3aed'];
    return `<div class="rev-row">
      <div class="rev-color" style="background:${colors[i % colors.length]}"></div>
      <div class="rev-name">${s.name}</div>
      <div class="rev-bar-track"><div class="rev-bar-fill" style="width:${s.percentage}%;background:${colors[i % colors.length]}"></div></div>
      <div class="rev-pct">${s.percentage}%</div>
    </div>`;
  }).join('')}
  <p style="font-size:9.5px;color:#666;margin-top:8px;line-height:1.5">${d.revenueExplanation}</p>
</div>

<!-- S5: PRODUCT FLOW -->
<div class="section">
  <div class="section-label">05 — Product Architecture</div>
  <div class="flow">
    ${d.productFlow.map(f => `
    <div class="flow-step">
      <div class="flow-step-name">${f.step}</div>
      <div class="flow-step-desc">${f.description}</div>
    </div>`).join('')}
  </div>
</div>

<!-- S6: CONTENT -->
<div class="section">
  <div class="section-label">06 — Content Intelligence</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
    <div>
      <div style="font-size:9px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Channel Performance</div>
      <table>
        <thead><tr><th>Channel</th><th>Stars</th><th>Frequency</th></tr></thead>
        <tbody>
          ${d.contentChannels.map(c => {
            const freq = d.postingFrequency.find(p => p.platform.toLowerCase() === c.channel.toLowerCase());
            return `<tr><td>${c.channel}</td><td>${'★'.repeat(c.stars)}${'☆'.repeat(5 - c.stars)}</td><td>${freq ? freq.frequency : '—'}</td></tr>`;
          }).join('')}
        </tbody>
      </table>
      <div style="margin-top:10px;font-size:9px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Content Themes</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">${d.contentThemes.map(t => `<span style="font-size:8.5px;border:1px solid #e0e0e0;border-radius:4px;padding:2px 6px;color:#555">${t}</span>`).join('')}</div>
    </div>
    <div>
      <div style="font-size:9px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Viral Hooks</div>
      ${d.viralHooks.map(v => `
      <div class="hook-card">
        <div class="hook-text">"${v.hook}"</div>
        <div class="hook-meta">▲ ${v.views} views · ${v.why}</div>
      </div>`).join('')}
    </div>
  </div>
</div>

<!-- S7: AD INTELLIGENCE -->
<div class="section page-break">
  <div class="section-label">07 — Ad Intelligence</div>
  <div class="cards" style="grid-template-columns:repeat(5,1fr)">
    <div class="card"><div class="card-label">Active Ads</div><div class="card-value">${d.adIntelligence.activeAds}</div></div>
    <div class="card"><div class="card-label">Winning Hook</div><div class="card-value" style="font-size:10px">${d.adIntelligence.winningHook}</div></div>
    <div class="card"><div class="card-label">Primary CTA</div><div class="card-value" style="font-size:10px">${d.adIntelligence.primaryCTA}</div></div>
    <div class="card"><div class="card-label">Offer</div><div class="card-value" style="font-size:10px">${d.adIntelligence.offer}</div></div>
    <div class="card"><div class="card-label">Platform</div><div class="card-value">${d.adIntelligence.primaryPlatform}</div></div>
  </div>
</div>

<!-- S8: COMPETITORS -->
<div class="section">
  <div class="section-label">08 — Competitor Matrix</div>
  <table>
    <thead><tr><th>Company</th><th>Revenue</th><th>Growth</th><th>Score</th><th>Position</th></tr></thead>
    <tbody>
      ${d.competitors.map((c, i) => `
      <tr>
        <td style="font-weight:${i === 0 ? 800 : 400};color:${i === 0 ? '#3d7a00' : '#333'}">${c.name}</td>
        <td><strong>${c.revenue}</strong></td>
        <td><strong>${c.growth}</strong></td>
        <td><span class="badge ${c.rating >= 90 ? 'badge-leader' : c.rating >= 75 ? 'badge-low' : 'badge-med'}">${c.rating}</span></td>
        <td><span class="badge ${c.position === 'Leader' ? 'badge-leader' : c.position === 'Strong' ? 'badge-low' : 'badge-med'}">${c.position}</span></td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<!-- S9: MOAT -->
<div class="section">
  <div class="section-label">09 — Startup Moat Analysis</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
    <table>
      <thead><tr><th>Moat Factor</th><th>Value</th></tr></thead>
      <tbody>
        ${moatRows.map(([k, v]) => `<tr><td>${k}</td><td><strong>${v}</strong></td></tr>`).join('')}
      </tbody>
    </table>
    <div>
      <div style="font-size:9px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Real Moat</div>
      <p style="font-size:10px;color:#444;line-height:1.55">${d.moat.explanation}</p>
    </div>
  </div>
</div>

<!-- S10: WEAKNESSES -->
<div class="section page-break">
  <div class="section-label">10 — Weaknesses</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
    ${d.weaknesses.map(w => `
    <div class="w-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <div class="woc-title">${w.title}</div>
        <span class="badge ${w.severity === 'High' ? 'badge-high' : 'badge-med'}">${w.severity}</span>
      </div>
      <div class="woc-desc">${w.description}</div>
    </div>`).join('')}
  </div>
</div>

<!-- S11: OPPORTUNITIES -->
<div class="section">
  <div class="section-label">11 — Opportunity Gaps</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
    ${d.opportunities.map(o => `
    <div class="o-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <div class="woc-title">${o.title}</div>
        <span class="badge ${o.difficulty === 'Low' ? 'badge-low' : o.difficulty === 'Medium' ? 'badge-med' : 'badge-high'}">${o.difficulty}</span>
      </div>
      <div class="woc-desc">${o.description}</div>
      <div style="margin-top:6px;font-size:8.5px;color:#888">Potential: <strong style="color:#16a34a">${o.potential}/100</strong></div>
      <div class="o-bar-track"><div class="o-bar-fill" style="width:${o.potential}%"></div></div>
    </div>`).join('')}
  </div>
</div>

<!-- S12: BLUEPRINT -->
<div class="section page-break">
  <div class="section-label">12 — Clone Blueprint</div>
  <div class="cards cards-3" style="margin-bottom:10px">
    <div class="card"><div class="card-label">Build Cost</div><div class="card-value lime">${d.blueprint.buildCost}</div></div>
    <div class="card"><div class="card-label">Build Time</div><div class="card-value">${d.blueprint.buildTime}</div></div>
    <div class="card"><div class="card-label">Complexity</div><div class="card-value">${d.blueprint.complexity}</div></div>
    <div class="card"><div class="card-label">Monetization</div><div class="card-value" style="font-size:11px">${d.blueprint.monetization}</div></div>
    <div class="card"><div class="card-label">Launch Channel</div><div class="card-value lime">${d.blueprint.launchChannel}</div></div>
    <div class="card"><div class="card-label">Tech Stack</div><div class="card-value" style="font-size:9.5px;line-height:1.5">${d.blueprint.techStack.join(' · ')}</div></div>
  </div>
  <div class="wedge-box">
    <div class="wedge-label">The Wedge — Your Entry Angle</div>
    <div class="wedge-text">${d.blueprint.wedge}</div>
  </div>
  <div style="font-size:9px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">MVP Feature List</div>
  <ul class="mvp-list">${d.blueprint.mvpFeatures.map(f => `<li>${f}</li>`).join('')}</ul>
</div>

<!-- S13: VERDICT -->
<div class="section">
  <div class="section-label">13 — AI Verdict</div>
  <div class="verdict-box">
    <div style="display:flex;align-items:flex-start;gap:20px">
      <div style="flex-shrink:0;text-align:center">
        <div class="verdict-score">${d.verdict.score}<span class="verdict-denom">/100</span></div>
        <div style="font-size:8.5px;color:#888;text-transform:uppercase;letter-spacing:.08em;margin-top:2px">Kraitin Score</div>
      </div>
      <div style="flex:1">
        <div class="verdict-headline">${d.verdict.headline}</div>
        <div class="verdict-insight">${d.verdict.insight}</div>
        <div class="verdict-takeaway-label">Founder Takeaway</div>
        <div class="verdict-takeaway">"${d.verdict.founderTakeaway}"</div>
      </div>
    </div>
  </div>
</div>

<div class="footer">
  <span>Generated by <strong>Kraitin</strong> — AI Startup Intelligence</span>
  <span>${d.company} Intelligence Report · ${date}</span>
  <span>kraitin.com</span>
</div>

<script>window.onload=function(){window.print();setTimeout(function(){window.close();},1000);}</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { toast.error('Pop-ups are blocked. Please allow pop-ups and try again.'); return; }
    win.document.write(html);
    win.document.close();
  };

  return (
    <AppLayout>
      <div className="min-h-full flex flex-col">

        {/* PRO gate — shown to free users while auth settles or access is denied */}
        {!authLoading && !premiumAccess && (
          <div className="flex-1 flex items-center justify-center px-6 py-16">
            <div className="w-full max-w-md text-center">
              {/* icon */}
              <div className="w-16 h-16 rounded-2xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-7 h-7 text-[#C5FF00]" />
              </div>

              {/* badge */}
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#C5FF00]/60 border border-[#C5FF00]/20 rounded-full px-3 py-1 mb-4">
                Pro Feature
              </span>

              <h2 className="text-2xl font-black text-white mb-3 text-balance">
                Startup Intelligence Engine
              </h2>
              <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-sm mx-auto text-pretty">
                Reverse-engineer any startup — revenue, growth timeline, ad intelligence, competitor matrix, moat analysis, clone blueprint, and AI verdict. Bloomberg Terminal meets PitchBook.
              </p>

              {/* feature preview pills */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {[
                  '13-Section Dossier', 'Revenue Analysis', 'Ad Intelligence',
                  'Competitor Matrix', 'Clone Blueprint', 'AI Verdict',
                  'Full Founder Blueprint', 'PDF Export',
                ].map(f => (
                  <span key={f} className="text-[11px] text-white/35 border border-white/[0.07] rounded-full px-3 py-1">
                    {f}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => navigate('/billing')}
                className="w-full h-12 rounded-xl bg-[#C5FF00] text-black font-bold text-sm hover:bg-[#C5FF00]/90 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 mb-3"
              >
                <Zap className="w-4 h-4" />
                Upgrade to Pro — Unlock Now
              </button>
              <p className="text-xs text-white/20">Cancel anytime · Instant access after payment</p>
            </div>
          </div>
        )}

        {/* auth loading spinner */}
        {authLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#C5FF00]/30 border-t-[#C5FF00] rounded-full animate-spin" />
          </div>
        )}

        {/* full feature — pro users only */}
        {!authLoading && premiumAccess && (<>

        {/* Header bar */}
        <div className="shrink-0 border-b border-white/[0.05] px-6 md:px-10 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4 text-[#C5FF00]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white">Startup Intelligence</h1>
                <p className="text-[11px] text-white/25 hidden sm:block truncate">Bloomberg + PitchBook + Crunchbase — one search</p>
              </div>
            </div>
            {(data || loading) && (
              <div className="flex items-center gap-2 shrink-0">
                {data && <><CopyBtn text={JSON.stringify(data, null, 2)} label="Copy" /><button onClick={exportToPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.07] text-white/30 hover:text-white/60 text-[11px] transition-colors"><Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">Export PDF</span></button></>}
                <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.07] text-white/30 hover:text-white/60 text-[11px] transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /><span className="hidden sm:inline">New</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 px-6 md:px-10 py-8 max-w-5xl mx-auto w-full">

          {/* Search screen */}
          {!loading && !data && (
            <div>
              <div className="max-w-2xl mx-auto mb-12">
                <h2 className="text-2xl md:text-3xl font-black text-white text-center mb-2 text-balance">Reverse-engineer any startup</h2>
                <p className="text-white/35 text-center text-sm mb-8 text-balance">
                  13-section intelligence dossier — business model, growth playbook, moat analysis, clone blueprint.
                </p>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                  <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') runTeardown(query); }}
                    placeholder="Search any startup — Duolingo, Notion, Cursor, Cal AI…"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl pl-11 pr-14 py-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/15 transition-colors"
                  />
                  <button onClick={() => runTeardown(query)} disabled={!query.trim()}
                    className={cn('absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                      query.trim() ? 'bg-[#C5FF00] text-black hover:bg-[#C5FF00]/90' : 'bg-white/[0.04] text-white/15 cursor-not-allowed')}>
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
                {history.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Clock className="w-3 h-3 text-white/15 shrink-0" />
                    {history.map(h => (
                      <button key={h} onClick={() => { setQuery(h); runTeardown(h); }}
                        className="text-[11px] text-white/30 hover:text-white/60 border border-white/[0.06] hover:border-white/12 rounded-lg px-2.5 py-1 transition-all">{h}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-6">
                {EXAMPLES.map(cat => (
                  <div key={cat.label}>
                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-semibold mb-3">{cat.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.items.map(name => (
                        <button key={name} onClick={() => runTeardown(name)}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] text-sm text-white/45 hover:text-white/75 transition-all group">
                          <ChevronRight className="w-3 h-3 text-[#C5FF00]/30 group-hover:text-[#C5FF00]/60" />{name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && <DossierSkeleton company={company} />}
          {data && <Dossier data={data} bpLoading={bpLoading} onGenerateBlueprint={generateBlueprint} />}
          {(bpLoading || blueprint) && (
            <div ref={blueprintRef}>
              {bpLoading && <BlueprintSkeleton />}
              {blueprint && <FullBlueprintPanel bp={blueprint} checked={bpChecked} onToggle={toggleCheck} />}
            </div>
          )}

        </div>
        </>)}
      </div>
    </AppLayout>
  );
}
