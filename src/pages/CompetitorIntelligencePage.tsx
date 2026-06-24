import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { PaywallModal } from '@/components/common/PaywallModal';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/db/supabase';
import { sendAiSearchRequest } from '@/lib/sse';
import { parseSSEChunk } from '@/components/intelligence/prompts';
import { toast } from 'sonner';
import {
  Search, Loader2, Zap, TrendingUp, DollarSign, Users,
  AlertTriangle, CheckCircle2, Target, Lightbulb, BarChart3,
  MessageSquare, Heart, ArrowRight, Star, X, Clock,
  ChevronRight, Megaphone, ShieldAlert, Gem,
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const EXAMPLES = ['Cal AI', 'BitePal', 'Bible Chat', 'Duolingo', 'Notion', 'Cursor', 'Lovable', 'Bolt'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompetitorDossier {
  name: string;
  category: string;
  revenue: string;
  growth: string;
  funding: string;
  marketPosition: string;
  threatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  founded: string;
  employees: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunity: string;
  revenueModel: Array<{ type: string; stars: number; note: string }>;
  revenueExplanation: string;
  pricing: Array<{ tier: string; price: string; description: string }>;
  pricingStrategy: string;
  growthChannels: Array<{ name: string; score: number }>;
  acquisitionStrategies: Array<{ title: string; steps: string[] }>;
  marketingAngles: Array<{ hook: string; effectiveness: 'High' | 'Medium' | 'Low' }>;
  adCreatives: Array<{ hook: string; format: string; platform: string; performance: 'High' | 'Medium' | 'Low' }>;
  influencers: Array<{ type: string; followers: string; platform: string; fit: number }>;
  complaints: string[];
  lovedFeatures: string[];
  opportunityGaps: Array<{ gap: string; score: number }>;
  howToBeat: string[];
  similarCompanies: Array<{ name: string; category: string; why: string }>;
}

// ─── AI Prompt ────────────────────────────────────────────────────────────────

function buildCompetitorPrompt(name: string): string {
  return `You are Kraitin, a world-class startup intelligence platform. Do a deep competitor dossier on: "${name}".

Return ONLY valid JSON (no markdown, no text outside JSON):

{
  "name": "${name}",
  "category": "<industry/category>",
  "revenue": "<e.g. $2.1M MRR>",
  "growth": "<e.g. +47% MoM>",
  "funding": "<e.g. Bootstrapped | Seed $2M | Series A $15M>",
  "marketPosition": "<Leader | Challenger | Niche | Emerging>",
  "threatLevel": "<Low | Medium | High | Critical>",
  "founded": "<year>",
  "employees": "<e.g. 12 | 80-120>",
  "summary": "<3-4 sentence analyst-level executive summary of why this company is winning, their core strategy, and market position>",
  "strengths": ["<strength 1>","<strength 2>","<strength 3>","<strength 4>","<strength 5>"],
  "weaknesses": ["<weakness 1>","<weakness 2>","<weakness 3>","<weakness 4>"],
  "opportunity": "<1-2 sentence opportunity statement for someone building a competitor>",
  "revenueModel": [
    { "type": "Subscription", "stars": <1-5>, "note": "<brief explanation>" },
    { "type": "Advertising", "stars": <1-5>, "note": "<brief explanation>" },
    { "type": "Freemium", "stars": <1-5>, "note": "<brief explanation>" },
    { "type": "Enterprise", "stars": <1-5>, "note": "<brief explanation>" }
  ],
  "revenueExplanation": "<2-3 sentence explanation of how they make money and why it works>",
  "pricing": [
    { "tier": "<tier name>", "price": "<e.g. $9.99/week>", "description": "<what's included>" },
    { "tier": "<tier name>", "price": "<e.g. $29/month>", "description": "<what's included>" },
    { "tier": "<tier name>", "price": "<e.g. $149/year>", "description": "<what's included>" }
  ],
  "pricingStrategy": "<2-3 sentence analysis of their pricing strategy and positioning>",
  "growthChannels": [
    { "name": "SEO", "score": <0-100> },
    { "name": "TikTok", "score": <0-100> },
    { "name": "YouTube", "score": <0-100> },
    { "name": "Influencers", "score": <0-100> },
    { "name": "Paid Ads", "score": <0-100> },
    { "name": "App Store", "score": <0-100> },
    { "name": "Word of Mouth", "score": <0-100> }
  ],
  "acquisitionStrategies": [
    { "title": "<strategy name>", "steps": ["<step 1>","<step 2>","<step 3>"] },
    { "title": "<strategy name>", "steps": ["<step 1>","<step 2>","<step 3>"] },
    { "title": "<strategy name>", "steps": ["<step 1>","<step 2>","<step 3>"] }
  ],
  "marketingAngles": [
    { "hook": "<compelling marketing hook>", "effectiveness": "<High | Medium | Low>" },
    { "hook": "<compelling marketing hook>", "effectiveness": "<High | Medium | Low>" },
    { "hook": "<compelling marketing hook>", "effectiveness": "<High | Medium | Low>" },
    { "hook": "<compelling marketing hook>", "effectiveness": "<High | Medium | Low>" }
  ],
  "adCreatives": [
    { "hook": "<ad hook text>", "format": "<UGC | Static | Video | Carousel>", "platform": "<TikTok | Instagram | YouTube | Meta>", "performance": "<High | Medium | Low>" },
    { "hook": "<ad hook text>", "format": "<UGC | Static | Video | Carousel>", "platform": "<TikTok | Instagram | YouTube | Meta>", "performance": "<High | Medium | Low>" },
    { "hook": "<ad hook text>", "format": "<UGC | Static | Video | Carousel>", "platform": "<TikTok | Instagram | YouTube | Meta>", "performance": "<High | Medium | Low>" },
    { "hook": "<ad hook text>", "format": "<UGC | Static | Video | Carousel>", "platform": "<TikTok | Instagram | YouTube | Meta>", "performance": "<High | Medium | Low>" }
  ],
  "influencers": [
    { "type": "<creator type>", "followers": "<e.g. 820k>", "platform": "<platform>", "fit": <60-99> },
    { "type": "<creator type>", "followers": "<e.g. 230k>", "platform": "<platform>", "fit": <60-99> },
    { "type": "<creator type>", "followers": "<e.g. 1.2M>", "platform": "<platform>", "fit": <60-99> },
    { "type": "<creator type>", "followers": "<e.g. 450k>", "platform": "<platform>", "fit": <60-99> }
  ],
  "complaints": ["<complaint 1>","<complaint 2>","<complaint 3>","<complaint 4>","<complaint 5>"],
  "lovedFeatures": ["<feature 1>","<feature 2>","<feature 3>","<feature 4>","<feature 5>"],
  "opportunityGaps": [
    { "gap": "<gap description>", "score": <6.0-9.9> },
    { "gap": "<gap description>", "score": <6.0-9.9> },
    { "gap": "<gap description>", "score": <6.0-9.9> },
    { "gap": "<gap description>", "score": <6.0-9.9> },
    { "gap": "<gap description>", "score": <6.0-9.9> }
  ],
  "howToBeat": ["<advantage 1>","<advantage 2>","<advantage 3>","<advantage 4>","<advantage 5>","<advantage 6>"],
  "similarCompanies": [
    { "name": "<competitor name>", "category": "<category>", "why": "<1 sentence why relevant>" },
    { "name": "<competitor name>", "category": "<category>", "why": "<1 sentence why relevant>" },
    { "name": "<competitor name>", "category": "<category>", "why": "<1 sentence why relevant>" },
    { "name": "<competitor name>", "category": "<category>", "why": "<1 sentence why relevant>" },
    { "name": "<competitor name>", "category": "<category>", "why": "<1 sentence why relevant>" }
  ]
}

Be specific. Use real data, real numbers, real names. This is a premium intelligence report.
Return ONLY the JSON object. No text before or after.`;
}

function extractJSON(raw: string): CompetitorDossier | null {
  const trimmed = raw.trim();
  try { return JSON.parse(trimmed) as CompetitorDossier; } catch { /* continue */ }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) { try { return JSON.parse(fence[1].trim()) as CompetitorDossier; } catch { /* continue */ } }
  const start = raw.indexOf('{');
  if (start === -1) return null;
  let depth = 0; let end = -1;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === '{') depth++;
    else if (raw[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return null;
  try { return JSON.parse(raw.slice(start, end + 1)) as CompetitorDossier; } catch { return null; }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < count ? 'text-[#C5FF00] fill-[#C5FF00]' : 'text-white/10 fill-white/10'}`} />
      ))}
    </div>
  );
}

function ThreatBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    High: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Low: 'bg-white/5 text-white/40 border-white/10',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${map[level] ?? map.Medium}`}>
      {level} Threat
    </span>
  );
}

function ScoreBar({ score, color = '#C5FF00' }: { score: number; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono font-bold text-white/60 w-8 text-right">{score}</span>
    </div>
  );
}

function PerformanceBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    High: 'bg-[#C5FF00]/10 text-[#C5FF00] border-[#C5FF00]/20',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Low: 'bg-white/5 text-white/30 border-white/10',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${map[level] ?? map.Medium}`}>
      {level}
    </span>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: typeof Zap; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-white/40" />
      </div>
      <div>
        <h2 className="text-base font-black text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-32 bg-white/[0.03] rounded-2xl" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompetitorIntelligencePage() {
  const { user, premiumAccess, profileReady } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [dossier, setDossier] = useState<CompetitorDossier | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const bufRef = useRef('');
  const autoTriggeredRef = useRef(false);

  useEffect(() => {
    if (!profileReady) return;
    if (!user) { navigate('/login'); return; }
    // Load recent analyses from localStorage
    const stored = localStorage.getItem(`kraitin_recent_competitors_${user.id}`);
    if (stored) { try { setRecentAnalyses(JSON.parse(stored)); } catch { /* ignore */ } }
    // Auto-trigger analysis if ?q= param is present (from dashboard deep-link)
    const qParam = searchParams.get('q')?.trim();
    if (qParam && !autoTriggeredRef.current) {
      autoTriggeredRef.current = true;
      setQuery(qParam);
      // Defer so handleAnalyze closure has latest state after setQuery
      setTimeout(() => handleAnalyze(qParam), 0);
    }
  }, [profileReady, user, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  if (user && !premiumAccess) {
    return <AppLayout><PaywallModal feature="Competitor Intelligence" onClose={() => navigate('/billing')} /></AppLayout>;
  }

  const saveRecent = (name: string) => {
    if (!user) return;
    const key = `kraitin_recent_competitors_${user.id}`;
    const prev = recentAnalyses.filter(r => r !== name);
    const next = [name, ...prev].slice(0, 6);
    setRecentAnalyses(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  const handleAnalyze = async (override?: string) => {
    const target = (override ?? query).trim();
    if (!target) { toast.error('Enter a competitor name'); return; }
    setQuery(target);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    bufRef.current = '';
    setDossier(null);
    setIsStreaming(true);

    const { data: { session } } = await supabase.auth.getSession();

    await sendAiSearchRequest({
      functionUrl: `${supabaseUrl}/functions/v1/ai-search`,
      contents: [{ role: 'user', parts: [{ text: buildCompetitorPrompt(target) }] }],
      credits: 10,
      supabaseAnonKey,
      accessToken: session?.access_token,
      signal: abortRef.current.signal,
      onData: (data) => {
        const { text } = parseSSEChunk(data);
        if (text) bufRef.current += text;
      },
      onComplete: async () => {
        setIsStreaming(false);
        const parsed = extractJSON(bufRef.current);
        if (parsed) {
          setDossier(parsed);
          saveRecent(target);
          if (user) {
            await supabase.from('reports').insert({
              user_id: user.id,
              title: `Competitor: ${target}`,
              type: 'competitor',
              content: { idea: target, text: bufRef.current, json: parsed, generated: true },
              status: 'completed',
            });
          }
          toast.success('Intelligence report ready');
        } else {
          toast.error('Could not parse intelligence data. Please retry.');
        }
      },
      onError: (err) => {
        setIsStreaming(false);
        const msg = (err as Error).message || '';
        if (msg.includes('403') || msg.toLowerCase().includes('subscription')) {
          toast.error('Subscription required.');
        } else {
          toast.error('Analysis failed. Please retry.');
        }
      },
    });
  };

  const handleBuildBetter = () => {
    if (!dossier) return;
    navigate(`/blueprint?q=Build a better version of ${dossier.name} — ${dossier.category}`);
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 pb-16">

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <div className="space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Competitor Intelligence</h1>
            <p className="text-sm text-white/35">Reverse engineer any startup. Revenue. Growth. Traffic. Marketing. Pricing. Acquisition.</p>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); }}
                placeholder="Search any competitor — Cal AI, Notion, Duolingo…"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C5FF00]/30 transition-colors"
              />
            </div>
            <button
              onClick={() => handleAnalyze()}
              disabled={isStreaming || !query.trim()}
              className="h-11 px-5 rounded-xl text-xs font-bold bg-[#C5FF00] text-black hover:bg-[#C5FF00]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0"
            >
              {isStreaming ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing…</> : <><Zap className="w-3.5 h-3.5" /> Analyze</>}
            </button>
            {isStreaming && (
              <button onClick={() => { abortRef.current?.abort(); setIsStreaming(false); }}
                className="h-11 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Example chips */}
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => handleAnalyze(ex)}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/60 hover:border-white/[0.12] transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* ── LOADING ───────────────────────────────────────────────── */}
        {isStreaming && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-white/30">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5FF00]" />
              Generating intelligence report for <span className="text-[#C5FF00] font-semibold">{query}</span>…
            </div>
            <LoadingSkeleton />
          </div>
        )}

        {/* ── DOSSIER ───────────────────────────────────────────────── */}
        {dossier && !isStreaming && (
          <div className="space-y-6">

            {/* Hero card */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <p className="text-[10px] text-white/25 uppercase tracking-widest">{dossier.category}</p>
                  <h2 className="text-2xl font-black text-white">{dossier.name}</h2>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <ThreatBadge level={dossier.threatLevel} />
                    <span className="text-[10px] text-white/25 border border-white/[0.08] px-2 py-1 rounded-full">{dossier.marketPosition}</span>
                    {dossier.founded && <span className="text-[10px] text-white/20">Founded {dossier.founded}</span>}
                  </div>
                </div>
                <div className="flex gap-6">
                  {[
                    { label: 'Revenue', value: dossier.revenue, icon: DollarSign, color: 'text-[#C5FF00]' },
                    { label: 'Growth', value: dossier.growth, icon: TrendingUp, color: 'text-emerald-400' },
                    { label: 'Funding', value: dossier.funding, icon: Gem, color: 'text-violet-400' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="text-center">
                      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                      <p className={`text-base font-black font-mono ${color}`}>{value}</p>
                      <p className="text-[10px] text-white/25 uppercase tracking-wider mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── S1: Executive Summary ── */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <SectionHeader icon={BarChart3} title="Executive Summary" subtitle="Why this company is winning" />
              <p className="text-sm text-white/60 leading-relaxed mb-5">{dossier.summary}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] text-white/25 uppercase tracking-widest mb-3">Strengths</p>
                  {dossier.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C5FF00] shrink-0 mt-0.5" />
                      <span className="text-xs text-white/60">{s}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-white/25 uppercase tracking-widest mb-3">Weaknesses</p>
                  {dossier.weaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-white/60">{w}</span>
                    </div>
                  ))}
                </div>
              </div>
              {dossier.opportunity && (
                <div className="mt-5 p-4 rounded-xl bg-[#C5FF00]/[0.04] border border-[#C5FF00]/[0.12]">
                  <p className="text-[10px] text-[#C5FF00]/60 uppercase tracking-widest mb-1.5">Opportunity</p>
                  <p className="text-sm text-white/70">{dossier.opportunity}</p>
                </div>
              )}
            </div>

            {/* ── S2: Business Model ── */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <SectionHeader icon={DollarSign} title="Business Model Breakdown" subtitle="How they make money" />
              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                {dossier.revenueModel.map((m, i) => (
                  <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-white/70">{m.type}</span>
                      <Stars count={m.stars} />
                    </div>
                    <p className="text-[11px] text-white/35 leading-relaxed">{m.note}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/50 leading-relaxed">{dossier.revenueExplanation}</p>
            </div>

            {/* ── S3: Pricing ── */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <SectionHeader icon={Target} title="Pricing Intelligence" subtitle="Pricing structure and strategy" />
              <div className="grid sm:grid-cols-3 gap-3 mb-5">
                {dossier.pricing.map((p, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${i === 1 ? 'border-[#C5FF00]/20 bg-[#C5FF00]/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{p.tier}</p>
                    <p className={`text-xl font-black font-mono ${i === 1 ? 'text-[#C5FF00]' : 'text-white'}`}>{p.price}</p>
                    <p className="text-[11px] text-white/35 mt-2 leading-relaxed">{p.description}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/50 leading-relaxed">{dossier.pricingStrategy}</p>
            </div>

            {/* ── S4: Growth Channels ── */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <SectionHeader icon={TrendingUp} title="Growth Breakdown" subtitle="Where their traffic and users come from" />
              <div className="space-y-3.5">
                {dossier.growthChannels.sort((a, b) => b.score - a.score).map((ch, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-white/60">{ch.name}</span>
                    </div>
                    <ScoreBar score={ch.score} color={ch.score >= 80 ? '#C5FF00' : ch.score >= 60 ? '#f59e0b' : '#6b7280'} />
                  </div>
                ))}
              </div>
            </div>

            {/* ── S5: Acquisition Strategy ── */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <SectionHeader icon={Users} title="Customer Acquisition Strategy" subtitle={`How ${dossier.name} acquires customers`} />
              <div className="space-y-4">
                {dossier.acquisitionStrategies.map((strat, i) => (
                  <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-5 h-5 rounded-full bg-[#C5FF00]/10 border border-[#C5FF00]/20 text-[#C5FF00] text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <h3 className="text-sm font-bold text-white">{strat.title}</h3>
                    </div>
                    <div className="space-y-1.5 pl-7">
                      {strat.steps.map((step, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <ChevronRight className="w-3 h-3 text-white/20 shrink-0 mt-0.5" />
                          <span className="text-xs text-white/45">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── S6: Marketing Playbook ── */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <SectionHeader icon={Megaphone} title="Marketing Playbook" subtitle="Winning angles and hooks" />
              <div className="grid sm:grid-cols-2 gap-3">
                {dossier.marketingAngles.map((angle, i) => (
                  <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                    <p className="text-sm font-semibold text-white/80 leading-snug mb-3">"{angle.hook}"</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/25">Est. Effectiveness</span>
                      <PerformanceBadge level={angle.effectiveness} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── S7: Ad Creative Vault ── */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <SectionHeader icon={Lightbulb} title="Ad Creative Vault" subtitle="Top performing ad patterns" />
              <div className="grid sm:grid-cols-2 gap-3">
                {dossier.adCreatives.map((ad, i) => (
                  <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
                    <div>
                      <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1">Hook</p>
                      <p className="text-sm font-semibold text-white/75 leading-snug">"{ad.hook}"</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/35">{ad.format}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/35">{ad.platform}</span>
                      <PerformanceBadge level={ad.performance} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── S8: Influencer Intelligence ── */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <SectionHeader icon={Star} title="Influencer Intelligence" subtitle="Creator partnerships and distribution" />
              <div className="grid sm:grid-cols-2 gap-3">
                {dossier.influencers.map((inf, i) => (
                  <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-xs font-semibold text-white/75">{inf.type}</p>
                        <p className="text-[11px] text-white/30 mt-0.5">{inf.followers} followers · {inf.platform}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-black font-mono text-[#C5FF00]">{inf.fit}%</p>
                        <p className="text-[10px] text-white/25">fit score</p>
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full bg-[#C5FF00]/50 transition-all" style={{ width: `${inf.fit}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── S9 & S10: Complaints + Loved ── */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                <SectionHeader icon={AlertTriangle} title="User Complaints" subtitle="Most common pain points" />
                <div className="space-y-2.5">
                  {dossier.complaints.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-red-500/[0.04] border border-red-500/[0.12]">
                      <span className="text-[10px] font-bold text-red-500/50 w-5 shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-xs text-white/55 leading-relaxed">{c}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                <SectionHeader icon={Heart} title="What Users Love" subtitle="Their strongest retention drivers" />
                <div className="space-y-2.5">
                  {dossier.lovedFeatures.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#C5FF00]/[0.03] border border-[#C5FF00]/[0.10]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C5FF00] shrink-0 mt-0.5" />
                      <p className="text-xs text-white/55 leading-relaxed">{f}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── S11: Opportunity Gaps ── */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <SectionHeader icon={Gem} title="Opportunity Gaps" subtitle="Kraitin's whitespace map — where competitors fail" />
              <div className="space-y-3.5">
                {dossier.opportunityGaps.sort((a, b) => b.score - a.score).map((gap, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-white/60 truncate">{gap.gap}</span>
                        <span className="text-xs font-black font-mono text-[#C5FF00] ml-3 shrink-0">{gap.score}/10</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full bg-[#C5FF00] transition-all duration-700"
                          style={{ width: `${(gap.score / 10) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── S12: How To Beat Them ── */}
            <div className="rounded-2xl border border-[#C5FF00]/[0.15] bg-[#C5FF00]/[0.03] p-6">
              <SectionHeader icon={Target} title={`How To Beat ${dossier.name}`} subtitle="Your strategic advantage map" />
              <div className="grid sm:grid-cols-2 gap-2.5">
                {dossier.howToBeat.map((adv, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#C5FF00]/[0.04] border border-[#C5FF00]/[0.10]">
                    <CheckCircle2 className="w-4 h-4 text-[#C5FF00] shrink-0" />
                    <span className="text-xs font-medium text-white/70">{adv}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── S13: Build A Better Version CTA ── */}
            <div className="rounded-2xl border border-[#C5FF00]/[0.2] bg-gradient-to-br from-[#C5FF00]/[0.06] to-transparent p-8">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="space-y-2 flex-1 min-w-0">
                  <p className="text-[10px] text-[#C5FF00]/60 uppercase tracking-widest">Signature Feature</p>
                  <h2 className="text-xl md:text-2xl font-black text-white text-balance">Build A Better Version of {dossier.name}</h2>
                  <p className="text-sm text-white/40 leading-relaxed max-w-lg">
                    Kraitin generates a complete competitive blueprint — unique positioning, feature roadmap, MVP plan, launch strategy, and revenue forecast.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['Unique Positioning', 'Feature Roadmap', 'MVP Plan', 'Launch Strategy', 'Revenue Forecast'].map(t => (
                      <span key={t} className="text-[10px] px-2.5 py-1 rounded-full border border-[#C5FF00]/20 text-[#C5FF00]/50">{t}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleBuildBetter}
                  className="flex items-center gap-2 h-11 px-6 rounded-xl bg-[#C5FF00] text-black text-sm font-black hover:bg-[#C5FF00]/90 transition-all shrink-0"
                >
                  <Zap className="w-4 h-4" /> Generate Blueprint
                </button>
              </div>
            </div>

            {/* ── S14: Similar Companies ── */}
            {dossier.similarCompanies?.length > 0 && (
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                <SectionHeader icon={ArrowRight} title="Similar Companies" subtitle="Related competitors to explore" />
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {dossier.similarCompanies.map((c, i) => (
                    <button key={i} onClick={() => handleAnalyze(c.name)}
                      className="text-left rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all group">
                      <div className="flex items-start justify-between mb-1.5">
                        <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">{c.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-white/15 group-hover:text-[#C5FF00] transition-colors shrink-0" />
                      </div>
                      <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1.5">{c.category}</p>
                      <p className="text-[11px] text-white/35 leading-snug">{c.why}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── EMPTY STATE (no dossier, no streaming) ── */}
        {!dossier && !isStreaming && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center">
              <Search className="w-6 h-6 text-white/20" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-white/50">Intelligence dashboard awaits</p>
              <p className="text-xs text-white/25 max-w-sm">Search any startup above to get a complete competitor intelligence report.</p>
            </div>
          </div>
        )}

        {/* ── Recent Analyses ── */}
        {recentAnalyses.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-white/[0.05]">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-white/20" />
              <span className="text-xs text-white/25 uppercase tracking-widest">Recently Analyzed</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentAnalyses.map((name) => (
                <button key={name} onClick={() => handleAnalyze(name)}
                  className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-white/[0.03] text-white/40 border border-white/[0.06] hover:text-white/70 hover:border-white/[0.14] transition-colors">
                  <MessageSquare className="w-3 h-3" /> {name}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
