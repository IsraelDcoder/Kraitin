import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { sendAiSearchRequest } from '@/lib/sse';
import { AppLayout } from '@/components/layouts/AppLayout';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumSection } from '@/components/paywall/PremiumSection';
import { UpgradeModal } from '@/components/paywall/UpgradeModal';
import { ReportGenerationModal } from '@/components/paywall/ReportGenerationModal';
import { WatchlistModal } from '@/components/paywall/WatchlistModal';
import { ExportPaywallModal } from '@/components/paywall/ExportPaywallModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { slugify } from '@/lib/slugify';
import type { Opportunity } from '@/types/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Star, Zap, TrendingUp, ShieldCheck, Code2, Rocket,
  BookmarkPlus, BookmarkCheck, BarChart3, Users, DollarSign,
  Target, Lightbulb, ChevronRight, ArrowUpRight, CheckCircle2,
  AlertTriangle, Globe, Flame, Activity, Award, FileText,
  Search as SearchIcon, PieChart, Layers, Map, Download, Share2, Check,
} from 'lucide-react';
import { ScoreRing, MeterBar, getScoreConfig, CompetitionLabel } from '@/components/explore/ScoreBadge';

/* ── Helpers ─────────────────────────────────────────────────── */
function getDifficulty(score: number) {
  if (score <= 35) return { label: 'Easy', num: '3/10', color: '#C5FF00', pct: 30 };
  if (score <= 55) return { label: 'Medium', num: '5/10', color: '#fbbf24', pct: 50 };
  return { label: 'Hard', num: '8/10', color: '#f87171', pct: 80 };
}

function getBuildRec(score: number): { label: string; color: string; bg: string } {
  if (score >= 85) return { label: 'STRONG BUY', color: '#C5FF00', bg: 'bg-[#C5FF00]/10 border-[#C5FF00]/25' };
  if (score >= 70) return { label: 'BUY', color: '#34d399', bg: 'bg-emerald-400/10 border-emerald-400/25' };
  if (score >= 55) return { label: 'WATCH', color: '#fbbf24', bg: 'bg-amber-400/10 border-amber-400/25' };
  return { label: 'PASS', color: '#f87171', bg: 'bg-red-400/10 border-red-400/25' };
}

function getFounderRec(score: number): { verdict: string; color: string; icon: string } {
  if (score >= 80) return { verdict: 'YES', color: '#C5FF00', icon: '✓' };
  if (score >= 60) return { verdict: 'MAYBE', color: '#fbbf24', icon: '~' };
  return { verdict: 'PASS', color: '#f87171', icon: '✗' };
}

type Competitor = { name: string; revenue: string; downloads: string; growth: string; pricing: string; strength: number; weakness: number };

function getCompetitors(cat: string): Competitor[] {
  const map: Record<string, Competitor[]> = {
    'AI': [
      { name: 'ChatGPT', revenue: '$80M MRR', downloads: '100M+', growth: '+55%', pricing: '$20/mo', strength: 95, weakness: 30 },
      { name: 'Jasper', revenue: '$6M MRR', downloads: '1M+', growth: '+28%', pricing: '$39/mo', strength: 72, weakness: 55 },
      { name: 'Copy.ai', revenue: '$3M MRR', downloads: '500K+', growth: '+21%', pricing: '$49/mo', strength: 65, weakness: 60 },
    ],
    'Health': [
      { name: 'Noom', revenue: '$50M MRR', downloads: '50M+', growth: '+18%', pricing: '$59/mo', strength: 82, weakness: 48 },
      { name: 'MyFitnessPal', revenue: '$30M MRR', downloads: '80M+', growth: '+8%', pricing: '$19.99/mo', strength: 78, weakness: 55 },
      { name: 'Headspace', revenue: '$25M MRR', downloads: '65M+', growth: '+12%', pricing: '$12.99/mo', strength: 80, weakness: 40 },
    ],
    'Education': [
      { name: 'Duolingo', revenue: '$15M MRR', downloads: '500M+', growth: '+30%', pricing: '$6.99/mo', strength: 92, weakness: 35 },
      { name: 'Coursera', revenue: '$120M MRR', downloads: '50M+', growth: '+22%', pricing: '$39/mo', strength: 85, weakness: 50 },
      { name: 'Skillshare', revenue: '$20M MRR', downloads: '12M+', growth: '+15%', pricing: '$32/mo', strength: 70, weakness: 52 },
    ],
    'Finance': [
      { name: 'Mint', revenue: '$25M MRR', downloads: '25M+', growth: '+5%', pricing: 'Free', strength: 75, weakness: 62 },
      { name: 'QuickBooks', revenue: '$250M MRR', downloads: '7M+', growth: '+12%', pricing: '$30/mo', strength: 90, weakness: 45 },
      { name: 'Wave', revenue: '$15M MRR', downloads: '5M+', growth: '+18%', pricing: 'Free', strength: 68, weakness: 55 },
    ],
    'B2B SaaS': [
      { name: 'Salesforce', revenue: '$2B MRR', downloads: '150K+', growth: '+10%', pricing: '$25/seat/mo', strength: 98, weakness: 30 },
      { name: 'HubSpot', revenue: '$600M MRR', downloads: '200K+', growth: '+18%', pricing: '$45/mo', strength: 90, weakness: 35 },
      { name: 'Monday.com', revenue: '$80M MRR', downloads: '180K+', growth: '+25%', pricing: '$9/seat/mo', strength: 80, weakness: 42 },
    ],
  };
  return map[cat] ?? map['B2B SaaS'];
}

function getComplaints(cat: string): string[] {
  const map: Record<string, string[]> = {
    'AI': ['Hallucinations and inaccurate outputs','Expensive subscription tiers','Context window limitations','No offline mode','Slow response during peak hours'],
    'Health': ['Generic advice that doesn\'t personalise','Tedious manual data entry','Expensive premium plans','Poor integration with wearables','Inaccurate calorie/macro tracking'],
    'Education': ['One-size-fits-all curriculum','Lack of real-time expert feedback','Gamification feels childish','No offline access','Overpriced certification courses'],
    'Finance': ['Confusing dashboards for non-accountants','Lack of multi-currency support','Poor customer support','No real-time bank sync','Hidden transaction fees'],
    'B2B SaaS': ['Steep learning curve','Hidden pricing and surprise bills','Poor mobile experience','No API or webhook access','Slow onboarding and support'],
    'Consumer': ['Too many push notifications','App crashes on older devices','Difficult to cancel subscription','Poor dark mode','Limited customisation options'],
    'Productivity': ['Feature bloat that slows performance','No keyboard shortcut support','Collaboration features are clunky','Slow sync across devices','No offline mode'],
  };
  return map[cat] ?? map['B2B SaaS'];
}

function getLovedFeatures(cat: string): string[] {
  const map: Record<string, string[]> = {
    'AI': ['Fast response speed','Multi-language support','Smart context memory','Clean minimal UI','Accurate suggestions'],
    'Health': ['Streak and habit tracking','Community challenges','Personalised meal plans','Wearable integration','Progress visualisation'],
    'Education': ['Bite-sized lessons','Instant feedback','Certification on completion','Leaderboards','Offline download'],
    'Finance': ['Auto-categorisation','Budget alerts','Clean mobile app','Tax export','Bank-level security'],
    'B2B SaaS': ['Zapier/API integrations','Real-time collaboration','Detailed analytics','Bulk import/export','Role-based permissions'],
    'Consumer': ['Simple clean UI','One-tap actions','Social sharing','Personalised feed','Dark mode'],
    'Productivity': ['Keyboard shortcuts','Cross-platform sync','Minimal distraction mode','Template library','Time tracking'],
  };
  return map[cat] ?? map['B2B SaaS'];
}

function getMarketGaps(opp: Opportunity): Array<{ title: string; severity: 'Critical'|'High'|'Medium'; demand: number; difficulty: 'Easy'|'Medium'|'Hard'; revenue: string }> {
  const base = [
    { title: `Offline-first ${opp.category} experience`, severity: 'High' as const, demand: 78, difficulty: 'Medium' as const, revenue: '$500K–$2M MRR' },
    { title: 'Family & team account sharing', severity: 'High' as const, demand: 82, difficulty: 'Easy' as const, revenue: '$300K–$1.5M MRR' },
    { title: `AI-powered onboarding for ${opp.category}`, severity: 'Critical' as const, demand: 88, difficulty: 'Medium' as const, revenue: '$800K–$3M MRR' },
    { title: 'Budget pricing tier for emerging markets', severity: 'Medium' as const, demand: 70, difficulty: 'Easy' as const, revenue: '$200K–$800K MRR' },
    { title: 'White-label & API licensing for enterprises', severity: 'High' as const, demand: 75, difficulty: 'Hard' as const, revenue: '$1M–$5M MRR' },
  ];
  return base;
}

function getGrowthChannels(cat: string): Array<{ name: string; potential: string; difficulty: string; cost: string; speed: string; rec: 'Strong'|'Good'|'Test' }> {
  const shared = [
    { name: 'SEO Content Marketing', potential: 'High', difficulty: 'Medium', cost: 'Low', speed: 'Slow', rec: 'Strong' as const },
    { name: 'Community Building', potential: 'High', difficulty: 'Medium', cost: 'Low', speed: 'Medium', rec: 'Strong' as const },
    { name: 'Paid Search (Google)', potential: 'Medium', difficulty: 'Low', cost: 'High', speed: 'Fast', rec: 'Good' as const },
  ];
  if (['Consumer', 'Health', 'Education'].includes(cat)) {
    return [
      { name: 'TikTok Organic', potential: 'Very High', difficulty: 'Low', cost: 'Low', speed: 'Fast', rec: 'Strong' },
      { name: 'Instagram Reels', potential: 'High', difficulty: 'Low', cost: 'Low', speed: 'Medium', rec: 'Strong' },
      { name: 'YouTube Tutorials', potential: 'High', difficulty: 'Medium', cost: 'Low', speed: 'Slow', rec: 'Good' },
      ...shared,
    ];
  }
  return [
    { name: 'LinkedIn Outreach', potential: 'High', difficulty: 'Medium', cost: 'Low', speed: 'Medium', rec: 'Strong' },
    { name: 'Product Hunt Launch', potential: 'High', difficulty: 'Low', cost: 'Low', speed: 'Fast', rec: 'Strong' },
    { name: 'G2 & Capterra', potential: 'Medium', difficulty: 'Low', cost: 'Medium', speed: 'Slow', rec: 'Good' },
    ...shared,
  ];
}

function getMonetizationModels(cat: string): Array<{ name: string; stars: number; potential: string; complexity: string; rec: string }> {
  const iB2B = ['B2B SaaS', 'Finance', 'AI'].includes(cat);
  return [
    { name: 'Subscription (SaaS)', stars: 5, potential: 'Very High', complexity: 'Low', rec: 'Primary model — proven by all category leaders' },
    { name: 'Freemium', stars: iB2B ? 3 : 4, potential: 'High', complexity: 'Medium', rec: iB2B ? 'Works well for PLG but watch CAC' : 'Strong for consumer — converts 3–8% to paid' },
    { name: 'Enterprise Licensing', stars: iB2B ? 5 : 2, potential: iB2B ? 'Very High' : 'Low', complexity: 'High', rec: iB2B ? 'High ACV deals, slow sales cycle' : 'Not recommended for consumer' },
    { name: 'Marketplace / Rev-share', stars: 3, potential: 'Medium', complexity: 'High', rec: 'Secondary channel — adds complexity' },
    { name: 'Affiliate / Partnerships', stars: 3, potential: 'Medium', complexity: 'Low', rec: 'Good passive revenue, low effort' },
    { name: 'Advertising', stars: iB2B ? 1 : 3, potential: iB2B ? 'Low' : 'Medium', complexity: 'Low', rec: iB2B ? 'Not appropriate — kills trust' : 'Viable with large free user base' },
    { name: 'One-time Purchase', stars: 2, potential: 'Low', complexity: 'Low', rec: 'Low LTV — avoid unless niche tool' },
  ];
}

function getKeywords(title: string): Array<{ kw: string; vol: string; diff: number; trend: 'up'|'stable'|'explosive' }> {
  const words = title.split(' ').filter((w) => w.length > 2);
  return [
    { kw: title, vol: '22K/mo', diff: 48, trend: 'explosive' },
    { kw: `best ${title.toLowerCase()}`, vol: '12K/mo', diff: 55, trend: 'up' },
    { kw: `${words[0]?.toLowerCase() ?? ''} app`, vol: '8K/mo', diff: 42, trend: 'up' },
    { kw: `${title.toLowerCase()} alternative`, vol: '5K/mo', diff: 38, trend: 'up' },
    { kw: `free ${title.toLowerCase()}`, vol: '18K/mo', diff: 62, trend: 'stable' },
  ];
}

function generateSparkline(count = 12, trend: 'up'|'explosive'|'flat' = 'up'): number[] {
  const base = trend === 'explosive' ? 20 : trend === 'flat' ? 50 : 30;
  return Array.from({ length: count }, (_, i) => {
    const noise = Math.random() * 15 - 7;
    const growth = trend === 'explosive' ? i * 6 : trend === 'up' ? i * 3 : 0;
    return Math.max(5, Math.min(95, base + growth + noise));
  });
}

function Sparkline({ values, color = '#C5FF00', height = 40 }: { values: number[]; color?: string; height?: number }) {
  const w = 200; const h = height;
  const max = Math.max(...values); const min = Math.min(...values);
  const range = max - min || 1;
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

/* ── Section wrapper ─────────────────────────────────────────── */
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

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-xl border border-white/[0.07] bg-white/[0.02] p-5', className)}>{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-1.5">{children}</p>;
}

function Stars({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={cn('text-xs', i < count ? 'text-[#C5FF00]' : 'text-white/10')}>★</span>
      ))}
    </span>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/** Extract the first JSON array or object from an AI response string */
function extractJSON<T>(text: string): T | null {
  try {
    // Try direct parse first
    return JSON.parse(text) as T;
  } catch {
    // Extract first [...] or {...} block
    const arrMatch = text.match(/\[[\s\S]*\]/);
    const objMatch = text.match(/\{[\s\S]*\}/);
    const raw = arrMatch?.[0] ?? objMatch?.[0];
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  }
}

export default function OpportunityIntelligencePage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, premiumAccess } = useAuth();

  const [opp, setOpp] = useState<Opportunity | null>((location.state as { opp?: Opportunity })?.opp ?? null);
  const [loading, setLoading] = useState(!opp);
  const [related, setRelated] = useState<Opportunity[]>([]);
  const [saved, setSaved] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);
  const [blueprintLoading, setBlueprintLoading] = useState(false);
  const [dbCompetitors, setDbCompetitors] = useState<any[]>([]);

  // Paywall modal state
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportModalType, setReportModalType] = useState('blueprint');
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // AI-streamed section state
  type SummaryItem = { label: string; text: string };
  type GapItem = { title: string; severity: 'Critical' | 'High' | 'Medium'; demand: number; difficulty: 'Easy' | 'Medium' | 'Hard'; revenue: string };

  const [aiSummary, setAiSummary] = useState<SummaryItem[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [aiComplaints, setAiComplaints] = useState<string[]>([]);
  const [aiLoved, setAiLoved] = useState<string[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [aiGaps, setAiGaps] = useState<GapItem[]>([]);
  const [gapsLoading, setGapsLoading] = useState(false);
  const aiAbortRef = useRef<AbortController | null>(null);

  // Fetch opp by slug (title match) if not in state
  useEffect(() => {
    if (opp) { setLoading(false); return; }
    const titleFromSlug = slug?.replace(/-/g, ' ') ?? '';
    supabase.from('opportunities').select('*').ilike('title', titleFromSlug).maybeSingle()
      .then(({ data }) => {
        if (data) setOpp(data);
        setLoading(false);
      });
  }, [slug, opp]);

  // Fetch related opps
  useEffect(() => {
    if (!opp) return;
    supabase.from('opportunities').select('*')
      .eq('category', opp.category).neq('id', opp.id)
      .order('opportunity_score', { ascending: false }).limit(6)
      .then(({ data }) => { if (data) setRelated(data); });
  }, [opp]);

  // Fetch real competitors from DB
  useEffect(() => {
    if (!opp) return;
    supabase.from('competitors')
      .select('*')
      .ilike('category', opp.category)
      .order('growth_percent', { ascending: false })
      .limit(6)
      .then(({ data }) => { if (data && data.length > 0) setDbCompetitors(data); });
  }, [opp]);

  // Check saved state
  useEffect(() => {
    if (!opp || !user) return;
    supabase.from('saved_items').select('id').eq('user_id', user.id).eq('item_type', 'opportunity').eq('item_id', opp.id).maybeSingle()
      .then(({ data }) => { if (data) setSaved(true); });
  }, [opp, user]);

  // AI-stream Executive Summary, Customer Intelligence, Market Gaps
  useEffect(() => {
    if (!opp) return;
    aiAbortRef.current?.abort();
    const ctrl = new AbortController();
    aiAbortRef.current = ctrl;

    const functionUrl = `${supabaseUrl}/functions/v1/ai-search`;
    const base = { functionUrl, supabaseAnonKey, signal: ctrl.signal };

    // ── Executive Summary ───────────────────────────────────────
    setSummaryLoading(true);
    let summaryBuf = '';
    sendAiSearchRequest({
      ...base,
      contents: [{
        role: 'user',
        parts: [{ text: `Analyze this startup opportunity and return ONLY a valid JSON array of exactly 6 objects, each with keys "label" and "text". Use these exact labels in order: "Opportunity Summary", "Why It Exists", "Current Market State", "Opportunity Assessment", "Potential Risks", "Potential Rewards". Each text should be 2-3 insightful sentences. No markdown, no explanation — only the JSON array.\n\nOpportunity:\nTitle: ${opp.title}\nCategory: ${opp.category}\nMarket Size: ${opp.market_size ?? 'unknown'}\nRevenue Estimate: ${opp.revenue_estimate ?? 'unknown'}\nOpportunity Score: ${opp.opportunity_score ?? 'unknown'}/100\nCompetition Score: ${opp.competition_score ?? 'unknown'}/100\nGrowth: ${opp.growth_percent != null ? `+${opp.growth_percent}%` : opp.growth_velocity ?? 'unknown'}\nDescription: ${opp.description ?? 'N/A'}` }],
      }],
      onData: (chunk) => { summaryBuf += chunk; },
      onComplete: () => {
        setSummaryLoading(false);
        const parsed = extractJSON<{ label: string; text: string }[]>(summaryBuf);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) setAiSummary(parsed);
      },
      onError: () => setSummaryLoading(false),
    });

    // ── Customer Intelligence ───────────────────────────────────
    setCustomerLoading(true);
    let customerBuf = '';
    sendAiSearchRequest({
      ...base,
      contents: [{
        role: 'user',
        parts: [{ text: `Return ONLY a valid JSON object with two keys: "complaints" and "loved". Each is an array of exactly 5 short strings (max 12 words each). "complaints" = top user complaints about existing ${opp.category} apps similar to "${opp.title}". "loved" = most-loved features users praise in top ${opp.category} apps. No markdown, no explanation — only the JSON object.` }],
      }],
      onData: (chunk) => { customerBuf += chunk; },
      onComplete: () => {
        setCustomerLoading(false);
        const parsed = extractJSON<{ complaints: string[]; loved: string[] }>(customerBuf);
        if (parsed && Array.isArray(parsed.complaints)) setAiComplaints(parsed.complaints);
        if (parsed && Array.isArray(parsed.loved)) setAiLoved(parsed.loved);
      },
      onError: () => setCustomerLoading(false),
    });

    // ── Market Gaps ─────────────────────────────────────────────
    setGapsLoading(true);
    let gapsBuf = '';
    sendAiSearchRequest({
      ...base,
      contents: [{
        role: 'user',
        parts: [{ text: `Return ONLY a valid JSON array of exactly 5 market gap objects for the "${opp.title}" opportunity in the ${opp.category} category. Each object must have: "title" (string, max 8 words), "severity" (one of "Critical", "High", "Medium"), "demand" (integer 60–95), "difficulty" (one of "Easy", "Medium", "Hard"), "revenue" (string like "$500K–$2M MRR"). No markdown, no explanation — only the JSON array.` }],
      }],
      onData: (chunk) => { gapsBuf += chunk; },
      onComplete: () => {
        setGapsLoading(false);
        const parsed = extractJSON<{ title: string; severity: 'Critical' | 'High' | 'Medium'; demand: number; difficulty: 'Easy' | 'Medium' | 'Hard'; revenue: string }[]>(gapsBuf);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) setAiGaps(parsed);
      },
      onError: () => setGapsLoading(false),
    });

    return () => ctrl.abort();
  }, [opp]);

  const handleSave = async () => {
    if (!opp) return;
    if (!user) { navigate('/login'); return; }
    setSavingLoading(true);
    if (saved) {
      const { error } = await supabase.from('saved_items').delete().eq('user_id', user.id).eq('item_type', 'opportunity').eq('item_id', opp.id);
      if (error) { toast.error('Failed to remove from watchlist'); setSavingLoading(false); return; }
      setSaved(false);
      toast.success('Removed from watchlist');
    } else {
      const { error } = await supabase.from('saved_items').insert({ user_id: user.id, item_type: 'opportunity', item_id: opp.id });
      if (error) { toast.error('Failed to save. Please try again.'); setSavingLoading(false); return; }
      setSaved(true);
      toast.success('Saved to watchlist', {
        action: { label: 'View Watchlist', onClick: () => navigate('/watchlist') },
      });
    }
    setSavingLoading(false);
  };

  const handleBlueprint = () => {
    if (!opp) return;
    if (!premiumAccess) { setReportModalType('blueprint'); setReportModalOpen(true); return; }
    setBlueprintLoading(true);
    setTimeout(() => {
      setBlueprintLoading(false);
      // Route to research agent with ?q= so it auto-triggers the full AI workflow
    navigate(`/blueprint?q=${encodeURIComponent(opp.title)}`)
    }, 800);
  };

  const handleAction = (path: string, extra = '') => {
    if (!opp) return;
    // AI agent pages require subscription — show modal instead of navigating
    const premiumPaths = ['/validation', '/competitors', '/mvp-planner', '/launch-agent', '/research'];
    if (!premiumAccess && premiumPaths.some(p => path.startsWith(p))) {
      const typeMap: Record<string, string> = {
        '/validation': 'validation', '/competitors': 'competitor',
        '/mvp-planner': 'mvp', '/launch-agent': 'launch', '/research': 'blueprint',
      };
      const key = premiumPaths.find(p => path.startsWith(p)) ?? '/research';
      setReportModalType(typeMap[key] ?? 'default');
      setReportModalOpen(true);
      return;
    }
    navigate(`${path}?q=${encodeURIComponent(opp.title)}${extra}`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#080808] px-4 md:px-8 py-8 max-w-[1600px] mx-auto space-y-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (!opp) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#080808] flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-white/30 text-lg">Opportunity not found</p>
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-[#C5FF00] text-sm hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to Explore
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const diff = getDifficulty(opp.competition_score ?? 50);
  const rec = getBuildRec(opp.opportunity_score ?? 0);
  const founderRec = getFounderRec(opp.opportunity_score ?? 0);
  // Use DB competitors when available; fall back to hardcoded demo data
  const competitors = dbCompetitors.length > 0
    ? dbCompetitors.map((c: any) => ({
        name: c.name,
        revenue: c.revenue_estimate ?? 'Unknown',
        downloads: c.downloads ?? '—',
        growth: c.growth_percent != null ? `+${c.growth_percent}%` : '—',
        pricing: c.pricing ?? '—',
        strength: c.seo_score ?? 70,
        weakness: c.seo_score != null ? Math.max(10, 100 - c.seo_score) : 30,
      }))
    : getCompetitors(opp.category);
  const channels = getGrowthChannels(opp.category);
  const monetization = getMonetizationModels(opp.category);
  const keywords = getKeywords(opp.title);
  const growthData = generateSparkline(12, opp.growth_percent && opp.growth_percent > 50 ? 'explosive' : 'up');
  const demandData = generateSparkline(12, 'up');
  const demand = Math.min(100, (opp.opportunity_score ?? 0) + 4);
  const scoreConf = getScoreConfig(opp.opportunity_score ?? 0);

  const ACTIONS = [
    { label: 'Validate Startup', icon: ShieldCheck, path: '/validation', color: 'bg-[#C5FF00] text-black hover:bg-[#C5FF00]/90' },
    { label: 'Analyze Competitors', icon: BarChart3, path: '/competitors', color: 'border border-white/[0.1] text-white/70 hover:bg-white/[0.05] hover:text-white' },
    { label: 'Generate MVP Plan', icon: Code2, path: '/mvp-planner', color: 'border border-white/[0.1] text-white/70 hover:bg-white/[0.05] hover:text-white' },
    { label: 'Generate PRD', icon: FileText, path: '/research', color: 'border border-white/[0.1] text-white/70 hover:bg-white/[0.05] hover:text-white' },
    { label: 'Launch Strategy', icon: Rocket, path: '/launch-agent', color: 'border border-white/[0.1] text-white/70 hover:bg-white/[0.05] hover:text-white' },
  ];

  const ALL_ACTIONS = [
    { label: 'Generate Validation Report', icon: ShieldCheck, path: '/validation' },
    { label: 'Generate Competitor Analysis', icon: BarChart3, path: '/competitors' },
    { label: 'Generate MVP Plan', icon: Code2, path: '/mvp-planner' },
    { label: 'Generate PRD', icon: FileText, path: '/research', extra: '&type=prd' },
    { label: 'Generate Technical Architecture', icon: Layers, path: '/research', extra: '&type=architecture' },
    { label: 'Generate Launch Strategy', icon: Rocket, path: '/launch-agent' },
    { label: 'Generate Marketing Plan', icon: Map, path: '/launch-agent', extra: '&type=marketing' },
    { label: 'Generate Financial Forecast', icon: PieChart, path: '/research', extra: '&type=financial' },
    { label: 'Generate 100 Content Ideas', icon: Lightbulb, path: '/research', extra: '&type=content' },
    { label: 'Generate Investor Memo', icon: FileText, path: '/research', extra: '&type=investor' },
    { label: 'Generate Database Schema', icon: Layers, path: '/research', extra: '&type=schema' },
  ];

  return (
    <AppLayout>
      {/* Paywall modals */}
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <ReportGenerationModal
        open={reportModalOpen} onClose={() => setReportModalOpen(false)}
        reportType={reportModalType} ideaTitle={opp?.title}
      />
      <WatchlistModal open={watchlistOpen} onClose={() => setWatchlistOpen(false)} />
      <ExportPaywallModal open={exportOpen} onClose={() => setExportOpen(false)} />

      <div className="min-h-screen bg-[#080808]">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 pb-16">

          {/* ── Back nav ─── */}
          <div className="py-5">
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/30 text-sm hover:text-white/70 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Explore Opportunities
            </Link>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* HERO                                                        */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden mb-10">
            {/* glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-10"
                style={{ background: `radial-gradient(circle, ${scoreConf.ring} 0%, transparent 70%)` }} />
              <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full opacity-5"
                style={{ background: `radial-gradient(circle, ${scoreConf.ring} 0%, transparent 70%)` }} />
            </div>

            <div className="relative p-6 md:p-10">
              {/* Title row */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="text-[10px] bg-white/[0.05] text-white/40 border-white/[0.08]">{opp.category}</Badge>
                    {opp.is_hidden_gem && (
                      <Badge className="text-[10px] bg-[#C5FF00]/10 text-[#C5FF00] border-[#C5FF00]/20">
                        <Star className="w-2.5 h-2.5 mr-1" /> Hidden Gem
                      </Badge>
                    )}
                    <Badge className={cn('text-[10px] font-bold border', rec.bg)} style={{ color: rec.color }}>{rec.label}</Badge>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-white leading-tight text-balance">{opp.title}</h1>
                  {opp.description && (
                    <p className="text-white/45 text-sm leading-relaxed max-w-2xl text-pretty">{opp.description}</p>
                  )}
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(opp.tags ?? []).map((tag) => (
                      <span key={tag} className="text-[10px] px-2.5 py-0.5 rounded-full border border-[#C5FF00]/15 bg-[#C5FF00]/[0.04] text-[#C5FF00]/60">{tag}</span>
                    ))}
                  </div>
                </div>
                <ScoreRing score={opp.opportunity_score ?? 0} size={100} />
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                {[
                  { label: 'Revenue Potential', value: opp.revenue_estimate ?? '—', icon: DollarSign },
                  { label: 'Market Demand', value: `${demand}/100`, icon: Target },
                  { label: 'Competition', value: opp.competition_score !== null ? (opp.competition_score <= 40 ? 'Low' : opp.competition_score <= 65 ? 'Medium' : 'High') : '—', icon: ShieldCheck },
                  { label: 'Monthly Growth', value: opp.growth_percent ? `+${opp.growth_percent}%` : '—', icon: TrendingUp },
                  { label: 'Market Size', value: opp.market_size ?? '—', icon: Globe },
                  { label: 'Difficulty', value: diff.num, icon: Activity },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="p-3.5 rounded-xl border border-white/[0.07] bg-white/[0.02] space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3 h-3 text-white/25 shrink-0" />
                      <span className="text-[10px] text-white/30 leading-tight">{label}</span>
                    </div>
                    <p className="text-sm font-bold text-white/85">{value}</p>
                  </div>
                ))}
              </div>

              {/* Primary action buttons */}
              <div className="flex flex-wrap gap-2">
                {ACTIONS.map(({ label, icon: Icon, path, color }) => (
                  <button key={label} onClick={() => handleAction(path)}
                    className={cn('flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold transition-all', color)}>
                    <Icon className="w-3.5 h-3.5 shrink-0" /> {label}
                  </button>
                ))}
                <button onClick={handleSave} disabled={savingLoading}
                  className={cn('flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold border transition-all',
                    saved ? 'border-[#C5FF00]/25 text-[#C5FF00] bg-[#C5FF00]/[0.06]' : 'border-white/[0.1] text-white/50 hover:text-white hover:border-white/20')}>
                  {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                  {saved ? 'Saved' : 'Save'}
                </button>
                <button onClick={() => {
                    if (!premiumAccess) { setExportOpen(true); return; }
                    // Build a markdown export of this opportunity
                    const lines = [
                      `# ${opp.title}`,
                      `**Category:** ${opp.category}`,
                      `**Opportunity Score:** ${opp.opportunity_score ?? 'N/A'}/100`,
                      `**Market Size:** ${opp.market_size ?? 'N/A'}`,
                      `**Revenue Estimate:** ${opp.revenue_estimate ?? 'N/A'}`,
                      `**Growth:** ${opp.growth_percent != null ? `+${opp.growth_percent}%` : (opp.growth_velocity ?? 'N/A')}`,
                      `**Competition Score:** ${opp.competition_score ?? 'N/A'}/100`,
                      `**Downloads:** ${opp.downloads ?? 'N/A'}`,
                      `**Tags:** ${(opp.tags ?? []).join(', ') || 'N/A'}`,
                      '',
                      '## Description',
                      opp.description ?? 'No description available.',
                      '',
                      `*Exported from Kraitin on ${new Date().toLocaleDateString()}*`,
                    ];
                    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${opp.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-opportunity.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success('Opportunity exported');
                  }}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold border border-white/[0.1] text-white/50 hover:text-white hover:border-white/20 transition-all">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
                {/* Share button — copies the current public URL */}
                <button
                  onClick={() => {
                    const url = window.location.href;
                    if (navigator.clipboard?.writeText) {
                      navigator.clipboard.writeText(url).then(() => {
                        setCopied(true);
                        toast.success('Link copied to clipboard');
                        setTimeout(() => setCopied(false), 2000);
                      });
                    } else {
                      // Fallback for environments without clipboard API
                      const el = document.createElement('textarea');
                      el.value = url;
                      el.style.position = 'fixed';
                      el.style.opacity = '0';
                      document.body.appendChild(el);
                      el.select();
                      document.execCommand('copy');
                      document.body.removeChild(el);
                      setCopied(true);
                      toast.success('Link copied to clipboard');
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold border transition-all',
                    copied
                      ? 'border-[#C5FF00]/25 text-[#C5FF00] bg-[#C5FF00]/[0.06]'
                      : 'border-white/[0.1] text-white/50 hover:text-white hover:border-white/20',
                  )}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Share'}
                </button>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* Two-column content layout                                   */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="space-y-10">

            {/* 1. EXECUTIVE SUMMARY */}
            <Section title="Executive Summary" icon={FileText} id="summary">
              <Card>
                {summaryLoading && aiSummary.length === 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="bg-white/[0.05] h-3 w-32 rounded" />
                        <Skeleton className="bg-white/[0.05] h-3 w-full rounded" />
                        <Skeleton className="bg-white/[0.05] h-3 w-5/6 rounded" />
                        <Skeleton className="bg-white/[0.05] h-3 w-4/6 rounded" />
                      </div>
                    ))}
                  </div>
                ) : aiSummary.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {aiSummary.map(({ label, text }) => (
                      <div key={label}>
                        <Label>{label}</Label>
                        <p className="text-sm text-white/55 leading-relaxed text-pretty">{text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Fallback to static data if AI fails
                  <div className="grid md:grid-cols-2 gap-6">
                    {[
                      { label: 'Opportunity Summary', text: `${opp.title} represents a high-growth opportunity in the ${opp.category} category with ${opp.market_size ?? 'a significant'} addressable market. Early movers who solve key pain points around onboarding and pricing stand to capture substantial recurring revenue.` },
                      { label: 'Why It Exists', text: `Growing consumer demand for intelligent, personalised ${opp.category.toLowerCase()} solutions, combined with dissatisfaction with legacy alternatives, has created a clear opening. Search interest is rising and app stores show strong download momentum.` },
                      { label: 'Current Market State', text: `The market is in early growth phase. Several funded competitors exist but none has achieved dominant market share. Customer reviews reveal consistent frustrations that a new entrant can resolve with focused execution.` },
                      { label: 'Opportunity Assessment', text: `Opportunity Score of ${opp.opportunity_score ?? '—'} signals strong fundamentals. Revenue potential up to ${opp.revenue_estimate ?? 'significant MRR'} with proven monetization paths via subscription and freemium. Competition remains fragmented.` },
                      { label: 'Potential Risks', text: `Platform dependency risk, customer acquisition costs rising in the category, and the need for ongoing AI/ML investment. Market may attract well-funded competitors if growth signals remain strong.` },
                      { label: 'Potential Rewards', text: `First-mover advantage in underserved niches, high recurring revenue with strong retention, and potential acquisition interest from strategic buyers within 3–5 years of traction.` },
                    ].map(({ label, text }) => (
                      <div key={label}>
                        <Label>{label}</Label>
                        <p className="text-sm text-white/55 leading-relaxed text-pretty">{text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Section>

            {/* 2. MARKET INTELLIGENCE */}
            <Section title="Market Intelligence" icon={BarChart3} id="market">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { label: 'Market Size', value: opp.market_size ?? '—' },
                  { label: 'Annual Growth', value: opp.growth_percent ? `+${opp.growth_percent}%` : '—' },
                  { label: 'Demand Score', value: `${demand}/100` },
                  { label: 'Market Maturity', value: opp.growth_percent && opp.growth_percent > 50 ? 'Early Stage' : 'Growing' },
                  { label: 'Monetization Score', value: `${Math.round((opp.opportunity_score ?? 70) * 0.92)}/100` },
                  { label: 'Avg Search Volume', value: '18K–55K/mo' },
                ].map(({ label, value }) => (
                  <Card key={label} className="space-y-1">
                    <Label>{label}</Label>
                    <p className="text-lg font-black text-white">{value}</p>
                  </Card>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <Label>5-Year Growth Trend</Label>
                  <div className="mt-3"><Sparkline values={growthData} color="#C5FF00" height={60} /></div>
                  <div className="flex justify-between mt-2 text-[10px] text-white/20 font-mono">
                    <span>2020</span><span>2021</span><span>2022</span><span>2023</span><span>2024</span>
                  </div>
                </Card>
                <Card>
                  <Label>Market Demand Trend</Label>
                  <div className="mt-3"><Sparkline values={demandData} color="#38bdf8" height={60} /></div>
                  <div className="flex justify-between mt-2 text-[10px] text-white/20 font-mono">
                    <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span>
                  </div>
                </Card>
              </div>
              {/* Keywords */}
              <Card>
                <Label>Keyword Intelligence</Label>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="border-b border-white/[0.05]">
                        {['Keyword', 'Monthly Volume', 'Difficulty', 'Trend'].map((h) => (
                          <th key={h} className="py-2 px-3 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {keywords.map((kw) => (
                        <tr key={kw.kw} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-3 text-sm text-white/70 font-medium">{kw.kw}</td>
                          <td className="py-2.5 px-3 text-xs text-white/45 font-mono">{kw.vol}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-amber-400/70" style={{ width: `${kw.diff}%` }} />
                              </div>
                              <span className="text-xs text-white/30 font-mono">{kw.diff}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={cn('text-xs font-semibold',
                              kw.trend === 'explosive' ? 'text-[#C5FF00]' : kw.trend === 'up' ? 'text-emerald-400' : 'text-white/30')}>
                              {kw.trend === 'explosive' ? '🔥 Explosive' : kw.trend === 'up' ? '↑ Rising' : '→ Stable'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </Section>

            {/* 2b. VALIDATION REPORT */}
            <Section title="Validation Report" icon={ShieldCheck} id="validation">
              <PremiumSection
                isPremium={!!premiumAccess}
                title="Validation Report"
                headline="Unlock Validation Report"
                accent="sky"
                benefits={['Customer Pain Points','Reddit Analysis','Market Demand Analysis','Build Recommendation','Risk Assessment','Validation Score']}
                onUpgrade={() => { setReportModalType('validation'); setReportModalOpen(true); }}
                preview={
                  <div className="grid md:grid-cols-3 gap-4 pb-4">
                    {[
                      { label: 'Validation Score', value: String(Math.min(99, (opp.opportunity_score ?? 80) + 5)), accent: '#38bdf8' },
                      { label: 'Demand Score',     value: String(demand),                                         accent: '#C5FF00' },
                      { label: 'Top Pain Point',   value: (aiComplaints[0] ?? getComplaints(opp.category)[0]) ?? 'Inaccurate outputs',                  accent: '#f87171', small: true },
                    ].map(({ label, value, accent: ac, small }) => (
                      <div key={label} className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                        <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1.5">{label}</p>
                        <p className={cn('font-black leading-tight', small ? 'text-sm text-white/70' : 'text-3xl')} style={{ color: small ? undefined : ac }}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                }
              >
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { label: 'Validation Score',    value: String(Math.min(99, (opp.opportunity_score ?? 80) + 5)) + '/100' },
                    { label: 'Demand Score',        value: `${demand}/100` },
                    { label: 'Build Recommendation',value: rec.label },
                    { label: 'Risk Level',          value: (opp.competition_score ?? 50) > 65 ? 'High' : 'Medium' },
                    { label: 'Top Pain Point',      value: (aiComplaints[0] ?? getComplaints(opp.category)[0]) ?? '—' },
                    { label: 'Market Readiness',    value: opp.growth_percent && opp.growth_percent > 40 ? 'High' : 'Moderate' },
                  ].map(({ label, value }) => (
                    <Card key={label} className="space-y-1">
                      <Label>{label}</Label>
                      <p className="text-sm font-bold text-white/80">{value}</p>
                    </Card>
                  ))}
                </div>
              </PremiumSection>
            </Section>

            {/* 2c. MVP PLANNER */}
            <Section title="MVP Planner" icon={Code2} id="mvp">
              <PremiumSection
                isPremium={!!premiumAccess}
                title="MVP Planner"
                headline="Unlock MVP Planner"
                accent="amber"
                benefits={['Feature List','User Stories','Database Schema','API Architecture','Development Roadmap','Tech Stack Recommendations']}
                onUpgrade={() => { setReportModalType('mvp'); setReportModalOpen(true); }}
                preview={
                  <div className="grid md:grid-cols-3 gap-4 pb-4">
                    {[
                      { label: 'MVP Timeline',  value: diff.label === 'Easy' ? '3–4 Weeks' : diff.label === 'Medium' ? '4–6 Weeks' : '6–10 Weeks' },
                      { label: 'Core Features', value: '3 / 10 Visible' },
                      { label: 'Est. Budget',   value: diff.label === 'Easy' ? '$2K–$5K' : '$5K–$15K' },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                        <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1.5">{label}</p>
                        <p className="text-2xl font-black text-amber-400">{value}</p>
                      </div>
                    ))}
                  </div>
                }
              >
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { label: 'MVP Timeline',     value: diff.label === 'Easy' ? '3–4 Weeks' : diff.label === 'Medium' ? '4–6 Weeks' : '6–10 Weeks' },
                    { label: 'Core Features',    value: '10 Prioritised Features' },
                    { label: 'Estimated Budget', value: diff.label === 'Easy' ? '$2,000–$5,000' : '$5,000–$15,000' },
                    { label: 'Recommended Stack',value: ['AI', 'B2B SaaS'].includes(opp.category) ? 'Next.js + Supabase + OpenAI' : 'React Native + Supabase' },
                    { label: 'Database Schema',  value: '8 Core Tables' },
                    { label: 'API Endpoints',    value: '14 REST Endpoints' },
                  ].map(({ label, value }) => (
                    <Card key={label} className="space-y-1">
                      <Label>{label}</Label>
                      <p className="text-sm font-bold text-white/80">{value}</p>
                    </Card>
                  ))}
                </div>
              </PremiumSection>
            </Section>

            {/* 3. COMPETITOR INTELLIGENCE */}
            <Section title="Competitor Intelligence" icon={Users} id="competitors">
              <PremiumSection
                isPremium={!!premiumAccess}
                title="Competitor Intelligence"
                headline="Unlock Competitor Intelligence"
                benefits={['Growth Strategy','Marketing Channels','Acquisition Tactics','Pricing Breakdown','Ad Strategy','Competitive Weaknesses']}
                onUpgrade={() => { setReportModalType('competitor'); setReportModalOpen(true); }}
                preview={
                  <div className="grid md:grid-cols-2 gap-4 pb-4">
                    {competitors.slice(0, 2).map((c) => (
                      <div key={c.name} className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-xs font-black text-white/50">{c.name.charAt(0)}</div>
                          <div><p className="text-sm font-bold text-white/85">{c.name}</p><p className="text-[10px] text-emerald-400">{c.growth}</p></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[{l:'Revenue',v:c.revenue},{l:'Pricing',v:c.pricing}].map(({l,v})=>(
                            <div key={l}><p className="text-[10px] text-white/25">{l}</p><p className="text-xs font-semibold text-white/70">{v}</p></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                }
              >
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {competitors.map((c) => (
                    <Card key={c.name} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-sm font-black text-white/50">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white/85">{c.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-emerald-400 font-semibold">{c.growth}</span>
                            </div>
                          </div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-white/20" />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { l: 'Revenue', v: c.revenue },
                          { l: 'Downloads', v: c.downloads },
                          { l: 'Pricing', v: c.pricing },
                          { l: 'Growth', v: c.growth },
                        ].map(({ l, v }) => (
                          <div key={l}>
                            <p className="text-[10px] text-white/25 mb-0.5">{l}</p>
                            <p className="text-xs font-semibold text-white/70">{v}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-white/30">
                          <span>Strength</span><span className="font-mono">{c.strength}</span>
                        </div>
                        <MeterBar value={c.strength} color="#34d399" />
                        <div className="flex items-center justify-between text-[10px] text-white/30">
                          <span>Weakness</span><span className="font-mono">{c.weakness}</span>
                        </div>
                        <MeterBar value={c.weakness} color="#f87171" />
                      </div>
                      <button onClick={() => handleAction('/competitors')}
                        className="w-full h-7 rounded-lg border border-white/[0.08] text-[11px] text-white/40 hover:border-white/20 hover:text-white/70 transition-all">
                        Analyze Competitor
                      </button>
                    </Card>
                  ))}
                </div>
              </PremiumSection>
            </Section>

            {/* 4. CUSTOMER INTELLIGENCE */}
            <Section title="Customer Intelligence" icon={SearchIcon} id="customers">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <Label>Top User Complaints</Label>
                  <div className="space-y-2.5 mt-2">
                    {customerLoading && aiComplaints.length === 0
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <Skeleton className="bg-white/[0.05] h-3 w-4 rounded shrink-0 mt-1" />
                            <div className="flex-1 space-y-1.5">
                              <Skeleton className="bg-white/[0.05] h-3 w-full rounded" />
                              <Skeleton className="bg-white/[0.05] h-1.5 w-4/5 rounded-full" />
                            </div>
                          </div>
                        ))
                      : (aiComplaints.length > 0 ? aiComplaints : getComplaints(opp.category)).map((c, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="text-[11px] font-bold text-red-400/70 font-mono w-4 shrink-0 mt-0.5">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white/60 leading-snug">{c}</p>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <div className="h-1 bg-red-400/20 rounded-full overflow-hidden" style={{ width: `${90 - i * 12}%` }}>
                                  <div className="h-full bg-red-400/60 rounded-full" style={{ width: '100%' }} />
                                </div>
                                <span className="text-[10px] text-white/20 font-mono shrink-0">{90 - i * 12}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                  </div>
                </Card>
                <Card>
                  <Label>Most Loved Features</Label>
                  <div className="space-y-2.5 mt-2">
                    {customerLoading && aiLoved.length === 0
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <Skeleton className="bg-white/[0.05] h-3.5 w-3.5 rounded-full shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <Skeleton className="bg-white/[0.05] h-3 w-full rounded" />
                              <Skeleton className="bg-white/[0.05] h-1.5 w-3/4 rounded-full" />
                            </div>
                          </div>
                        ))
                      : (aiLoved.length > 0 ? aiLoved : getLovedFeatures(opp.category)).map((f, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#C5FF00]/60 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white/60">{f}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <div className="h-1 bg-[#C5FF00]/10 rounded-full overflow-hidden" style={{ width: `${88 - i * 10}%` }}>
                                  <div className="h-full bg-[#C5FF00]/50 rounded-full" />
                                </div>
                                <span className="text-[10px] text-white/20 font-mono shrink-0">{88 - i * 10}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                  </div>
                </Card>
              </div>
            </Section>

            {/* 5. MARKET GAPS */}
            <Section title="Market Gaps" icon={Target} id="gaps">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gapsLoading && aiGaps.length === 0
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <Card key={i} className="space-y-3">
                        <Skeleton className="bg-white/[0.05] h-4 w-3/4 rounded" />
                        <div className="grid grid-cols-2 gap-2">
                          {[1, 2, 3, 4].map((j) => <Skeleton key={j} className="bg-white/[0.05] h-8 rounded" />)}
                        </div>
                        <Skeleton className="bg-white/[0.05] h-1.5 w-full rounded-full" />
                      </Card>
                    ))
                  : (aiGaps.length > 0 ? aiGaps : getMarketGaps(opp)).map((g) => (
                      <Card key={g.title} className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-white/80 leading-snug">{g.title}</p>
                          <Badge className={cn('text-[10px] shrink-0 border font-semibold',
                            g.severity === 'Critical' ? 'bg-red-400/10 text-red-400 border-red-400/20' :
                            g.severity === 'High' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                            'bg-sky-400/10 text-sky-400 border-sky-400/20')}>{g.severity}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><p className="text-white/25 text-[10px] mb-0.5">Demand</p><span className="font-semibold text-white/70">{g.demand}/100</span></div>
                          <div><p className="text-white/25 text-[10px] mb-0.5">Difficulty</p>
                            <span className={cn('font-semibold', g.difficulty === 'Easy' ? 'text-[#C5FF00]' : g.difficulty === 'Medium' ? 'text-amber-400' : 'text-red-400')}>{g.difficulty}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/25 mb-0.5">Revenue Potential</p>
                          <p className="text-xs font-semibold text-white/70">{g.revenue}</p>
                        </div>
                        <MeterBar value={g.demand} color="#C5FF00" />
                      </Card>
                    ))}
              </div>
            </Section>

            {/* 6. MONETIZATION */}
            <Section title="Monetization Analysis" icon={DollarSign} id="monetization">
              <div className="grid md:grid-cols-2 gap-3">
                {monetization.map((m) => (
                  <Card key={m.name} className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-white/80">{m.name}</p>
                        <Stars count={m.stars} />
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed text-pretty">{m.rec}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-white/25 mb-0.5">Potential</p>
                      <p className="text-xs font-semibold text-white/60">{m.potential}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </Section>

            {/* 7. GROWTH INTELLIGENCE */}
            <Section title="Growth Intelligence" icon={TrendingUp} id="growth">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {channels.map((ch) => (
                  <Card key={ch.name} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white/80">{ch.name}</p>
                      <Badge className={cn('text-[10px] border font-semibold',
                        ch.rec === 'Strong' ? 'bg-[#C5FF00]/10 text-[#C5FF00] border-[#C5FF00]/20' :
                        ch.rec === 'Good' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                        'bg-white/[0.05] text-white/40 border-white/10')}>{ch.rec}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { l: 'Traffic Potential', v: ch.potential },
                        { l: 'Difficulty', v: ch.difficulty },
                        { l: 'Cost', v: ch.cost },
                        { l: 'Speed', v: ch.speed },
                      ].map(({ l, v }) => (
                        <div key={l}>
                          <p className="text-[10px] text-white/25 mb-0.5">{l}</p>
                          <p className="text-xs font-semibold text-white/65">{v}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </Section>

            {/* 8. FOUNDER RECOMMENDATION */}
            <Section title="AI Founder Recommendation" icon={Award} id="recommendation">
              <PremiumSection
                isPremium={!!premiumAccess}
                title="AI Founder Recommendation"
                headline="Unlock AI Founder Recommendation"
                benefits={['Build vs Skip verdict','MVP timeline estimate','Budget estimate','Founder profile match','Risk factors','Ideal market positioning']}
                onUpgrade={() => setUpgradeOpen(true)}
                accent="amber"
                preview={
                  <div className="flex items-center gap-6 pb-4">
                    <div className="text-5xl font-black text-[#C5FF00]">{founderRec.verdict}</div>
                    <div>
                      <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Should You Build This?</p>
                      <p className="text-sm text-white/50">AI-powered recommendation based on market data, competition, and growth signals.</p>
                    </div>
                  </div>
                }
              >
                <Card className="relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10"
                      style={{ background: `radial-gradient(circle, ${founderRec.verdict === 'YES' ? '#C5FF00' : founderRec.verdict === 'MAYBE' ? '#fbbf24' : '#f87171'} 0%, transparent 70%)` }} />
                  </div>
                  <div className="relative grid md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center justify-center text-center space-y-3 py-4">
                      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Should You Build This?</p>
                      <div className="text-6xl font-black" style={{ color: founderRec.verdict === 'YES' ? '#C5FF00' : founderRec.verdict === 'MAYBE' ? '#fbbf24' : '#f87171' }}>
                        {founderRec.verdict}
                      </div>
                      <div className="grid grid-cols-2 gap-2 w-full text-xs">
                        <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5">
                          <p className="text-white/25 text-[10px] mb-1">Est. MVP Time</p>
                          <p className="font-bold text-white/70">{opp.competition_score && opp.competition_score <= 40 ? '3–5 wks' : '5–8 wks'}</p>
                        </div>
                        <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5">
                          <p className="text-white/25 text-[10px] mb-1">Est. Budget</p>
                          <p className="font-bold text-white/70">$2K–$8K</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Analysis</p>
                      {[
                        { icon: CheckCircle2, cls: 'text-[#C5FF00]', text: `Demand is growing — ${opp.growth_percent ? `+${opp.growth_percent}%` : 'strong signals'} monthly growth` },
                        { icon: CheckCircle2, cls: 'text-[#C5FF00]', text: `Monetization is proven — competitors are generating real recurring revenue` },
                        { icon: CheckCircle2, cls: 'text-[#C5FF00]', text: `Customer frustrations are clearly documented — you know exactly what to fix` },
                        { icon: AlertTriangle, cls: 'text-amber-400', text: `Competition exists — differentiation strategy is required from day one` },
                      ].map(({ icon: Icon, cls, text }, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <Icon className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', cls)} />
                          <p className="text-sm text-white/55 leading-snug">{text}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Ideal Founder Profile</p>
                      <div className="space-y-2">
                        {[
                          `Strong ${['AI', 'B2B SaaS'].includes(opp.category) ? 'technical' : 'product'} background`,
                          `Experience in ${opp.category} industry`,
                          'Ability to ship fast and iterate',
                          'Community building skills',
                          'Customer-obsessed mindset',
                        ].map((t) => (
                          <div key={t} className="flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 text-[#C5FF00]/50 shrink-0 mt-0.5" />
                            <p className="text-sm text-white/50">{t}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </PremiumSection>
            </Section>

            {/* 9. ACTION CENTER */}
            <Section title="Action Center" icon={Zap} id="actions">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ALL_ACTIONS.map(({ label, icon: Icon, path, extra }) => (
                  <button key={label} onClick={() => handleAction(path, extra ?? '')}
                    className="flex items-center gap-3 h-12 px-4 rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm text-white/60 font-medium hover:bg-white/[0.05] hover:text-white hover:border-white/20 transition-all group text-left">
                    <Icon className="w-4 h-4 text-[#C5FF00]/50 shrink-0 group-hover:text-[#C5FF00] transition-colors" />
                    {label}
                  </button>
                ))}
              </div>
            </Section>

            {/* 10. RELATED OPPORTUNITIES */}
            {related.length > 0 && (
              <Section title="Related Opportunities" icon={Flame} id="related">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {related.map((r) => (
                    <button key={r.id} onClick={() => navigate(`/opportunity/${slugify(r.title)}`, { state: { opp: r } })}
                      className="text-left p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#C5FF00]/20 transition-all group space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-white/80 leading-snug group-hover:text-white transition-colors text-balance">{r.title}</p>
                        {r.is_hidden_gem && <Star className="w-3 h-3 text-[#C5FF00] shrink-0 mt-0.5" />}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div><p className="text-white/25 text-[10px] mb-0.5">Score</p>
                          <span className={cn('font-bold', getScoreConfig(r.opportunity_score ?? 0).color)}>{r.opportunity_score ?? '—'}</span></div>
                        <div><p className="text-white/25 text-[10px] mb-0.5">Growth</p>
                          <span className="font-semibold text-[#C5FF00]">{r.growth_percent ? `+${r.growth_percent}%` : '—'}</span></div>
                        <div><p className="text-white/25 text-[10px] mb-0.5">Revenue</p>
                          <span className="text-white/50 font-mono text-[10px]">{r.revenue_estimate ?? '—'}</span></div>
                      </div>
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* 11. BUILD A BETTER VERSION */}
            <Section title="Build A Better Version" icon={Lightbulb} id="blueprint">
              <PremiumSection
                isPremium={!!premiumAccess}
                title="Startup Blueprint"
                headline="Generate Complete Startup Blueprint"
                ctaLabel="Generate Blueprint"
                benefits={['Validation Report','Competitor Analysis','MVP Plan','Technical Architecture','Launch Strategy','Marketing Plan','Financial Forecast','Growth Strategy']}
                onUpgrade={() => { setReportModalType('blueprint'); setReportModalOpen(true); }}
                preview={
                  <div className="flex items-center justify-between pb-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-white/25 uppercase tracking-wider">Blueprint Score</p>
                      <p className="text-3xl font-black text-[#C5FF00]">92</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] text-white/25 uppercase tracking-wider">Potential Market</p>
                      <p className="text-3xl font-black text-white">$2.4B</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Feature Gap Analysis','MVP Roadmap','GTM Plan'].map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border border-[#C5FF00]/15 text-[#C5FF00]/50">{t}</span>
                      ))}
                    </div>
                  </div>
                }
              >
                <div className="relative rounded-2xl border border-[#C5FF00]/15 bg-[#C5FF00]/[0.03] overflow-hidden p-8 md:p-10">
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
                      style={{ background: 'radial-gradient(circle, #C5FF00 0%, transparent 70%)' }} />
                  </div>
                  <div className="relative max-w-2xl space-y-4">
                    <Badge className="text-[10px] bg-[#C5FF00]/10 text-[#C5FF00] border-[#C5FF00]/20">Signature Feature</Badge>
                    <h3 className="text-2xl md:text-3xl font-black text-white text-balance">Outperform Every Competitor in This Market</h3>
                    <p className="text-white/45 text-sm leading-relaxed text-pretty">
                      Kraitin will generate a complete startup blueprint revealing exactly how to build a better version of {opp.title} —
                      including feature gaps, unique positioning, MVP roadmap, pricing strategy, and full go-to-market plan.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['Feature Gap Analysis', 'Competitive Differentiation', 'MVP Roadmap', 'Pricing Strategy', 'GTM Plan', 'Launch Timeline'].map((tag) => (
                        <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full border border-[#C5FF00]/15 text-[#C5FF00]/60">{tag}</span>
                      ))}
                    </div>
                    <button onClick={handleBlueprint} disabled={blueprintLoading}
                      className="inline-flex items-center gap-2 h-11 px-7 rounded-xl bg-[#C5FF00] text-black text-sm font-black hover:bg-[#C5FF00]/90 transition-all disabled:opacity-70 mt-2">
                      {blueprintLoading ? (
                        <><span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Generating…</>
                      ) : (
                        <><Zap className="w-4 h-4" /> Generate Startup Blueprint</>
                      )}
                    </button>
                    <p className="text-white/20 text-xs flex items-center gap-1.5">
                      <Lightbulb className="w-3 h-3" /> Generates a complete report saved to your workspace in ~30 seconds
                    </p>
                  </div>
                </div>
              </PremiumSection>
            </Section>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
