import { useNavigate, Link } from 'react-router-dom';
import { Check, ArrowRight, X, Plus, Menu, Clock, Zap, TrendingUp, Shield, ChevronRight, Lock, AlertTriangle, Wrench, Target } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { KraitinLogo } from '@/components/ui/KraitinLogo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import PageMeta from '@/components/common/PageMeta';

/* ─── DATA ─────────────────────────────────────────────── */

const heroChecks = [
  'Discover the fastest-growing startup opportunities',
  'Validate ideas with real Reddit & review data',
  'Spy on competitors — revenue, ads, influencers',
  'Generate full MVP plans & launch strategies in minutes',
];

const socialAvatars = [
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Mia&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Oscar&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Luna&backgroundColor=b6e3f4',
];

const navLinks = ['Features', 'Pricing', 'Agents', 'Roadmap', 'Changelog', 'Affiliate'];

const mockTableRows = [
  { rank: 1, name: 'AI Meal Scanner', cat: 'Health & Fit.', growth: '+117.3%', rev: '$3M', score: 94 },
  { rank: 2, name: 'Voice Study Coach', cat: 'Education', growth: '+89.1%', rev: '$1.2M', score: 88 },
  { rank: 3, name: 'Legal AI Assistant', cat: 'Productivity', growth: '+74.5%', rev: '$5M', score: 91 },
  { rank: 4, name: 'AI Companion App', cat: 'Lifestyle', growth: '+62.8%', rev: '$800K', score: 82 },
  { rank: 5, name: 'B2B Outreach AI', cat: 'B2B SaaS', growth: '+55.4%', rev: '$2.1M', score: 87 },
];

const logoApps = [
  { name: 'Cal AI',    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_afa1afee-3d51-4def-9f83-fcf450037cbf.jpg' },
  { name: 'Duolingo',  img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_06f7df1b-e774-4b08-b74b-c56ba54ee8b0.jpg' },
  { name: 'Notion',    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_34f80538-5084-4349-bb81-2ab665279e02.jpg' },
  { name: 'Linear',    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_1a8eafef-0449-4ca3-8bfc-17049afc6db6.jpg' },
  { name: 'Loom',      img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_09c99e89-87df-4f17-864b-d6151708f036.jpg' },
  { name: 'Figma',     img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_02e5ca15-be59-4ca6-8d3c-b5413ba8c565.jpg' },
  { name: 'Arc',       img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_eb865546-85d0-4f27-9f0b-764dba01207f.jpg' },
  { name: 'Raycast',   img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_caf5f41c-2b2a432d-a63a-381ae5329445.jpg' },
  { name: 'Snapchat',  img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_04521c70-221d-4c03-abeb-a314d8e93fa9.jpg' },
  { name: 'TikTok',    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_e3fe344e-8fc1-41c2-8fa7-bdd299db15c3.jpg' },
  { name: 'Instagram', img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_dc51236d-ce8a-4b9a-ad32-582bb6aca0b0.jpg' },
  { name: 'Stripe',    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_5bb4208d-f723-424b-a796-8c9d8df419f5.jpg' },
];

const features = [
  {
    title: 'Opportunity Discovery Engine',
    bullets: ['Track app revenue & downloads (iOS/Android)', 'Advanced niche segmentation filters', 'Find high-growth opportunities before they peak'],
    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b7c9db39-c8cb-46c4-a414-7c0dcbe50081.jpg',
  },
  {
    title: 'Competitor Ad Spy',
    bullets: ["Track your competitors' winning ads", 'Copy winning ad formats & hooks', 'Invest in ads knowing what works'],
    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_57a50091-afb6-4344-a3f4-1d0a2f67b033.jpg',
  },
  {
    title: 'Validation Agent',
    bullets: ['Mine Reddit & community pain points', 'App Store review intelligence', 'Demand & monetization scoring'],
    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_a8b99d96-016f-4e4e-829e-69959efdee82.jpg',
  },
  {
    title: 'Creator & Influencer Tracker',
    bullets: ['See creators winning apps collaborate with', 'Get inspired by their viral ideas', 'Grow organically on TikTok and IG'],
    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_1dc75ecd-1039-4c53-a0d3-a058d46e640e.jpg',
  },
  {
    title: 'MVP Planner & PRD Generator',
    bullets: ['Auto-generate full PRD documents', 'Sprint roadmaps & user stories', 'DB schema & technical architecture'],
    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_a051dfac-6840-4439-84af-e8f55209b108.jpg',
  },
  {
    title: 'Launch Agent',
    bullets: ['SEO, ASO & TikTok strategies', 'Content calendar generation', '90-day KPI roadmap'],
    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_2e5c0330-1b40-4dc9-bea2-c56c17ecef88.jpg',
  },
];

const withoutKraitin = [
  'Building ideas nobody wants',
  'Guessing which keywords to target',
  'Wasting money on untested ads',
  'Missing the influencers that matter',
  'Arriving late to viral trends',
  'Watching competitors dominate',
  'Getting 0 views on TikTok',
  'Researching manually with no real data',
];

const withKraitin = [
  'Replicating validated, profitable ideas',
  'Ranking with high-traffic keywords',
  'Copying winning ad creatives',
  'Partnering with proven influencers',
  'First to spot viral opportunities',
  'Dominating any market globally',
  'Go viral with proven content formats',
  'Leveraging a massive live startup database',
];

const userLogos = [
  { name: 'Notion',      rev: '$10B Valuation',   img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_34f80538-5084-4349-bb81-2ab665279e02.jpg' },
  { name: 'Snapchat',    rev: '$4B ARR',           img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_04521c70-221d-4c03-abeb-a314d8e93fa9.jpg' },
  { name: 'Superhuman',  rev: '$100M ARR',         img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_d9216f56-d532-414c-83df-e7f6454bf6fd.jpg' },
  { name: 'Linear',      rev: '$500M Valuation',   img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_1a8eafef-0449-4ca3-8bfc-17049afc6db6.jpg' },
  { name: 'Stripe',      rev: 'Fintech Leader',    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_5bb4208d-f723-424b-a796-8c9d8df419f5.jpg' },
  { name: 'Bolt',        rev: '$100M ARR',         img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_f4bc563f-93a5-4f5d-85b2-74d3c78fbb6b.jpg' },
  { name: 'Wander',      rev: '€200M+ Users',      img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_e6e23c85-7964-4d54-9851-5cb3659a1144.jpg' },
  { name: 'Arc Browser', rev: '$35M Raised',       img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_eb865546-85d0-4f27-9f0b-764dba01207f.jpg' },
  { name: 'Cal AI',      rev: '$1M+ raised',       img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_afa1afee-3d51-4def-9f83-fcf450037cbf.jpg' },
  { name: 'Duolingo',    rev: '$500M ARR',          img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_06f7df1b-e774-4b08-b74b-c56ba54ee8b0.jpg' },
  { name: 'Figma',       rev: '$20B Acquisition',  img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_02e5ca15-be59-4ca6-8d3c-b5413ba8c565.jpg' },
  { name: 'Loom',        rev: '$975M Exit',        img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_09c99e89-87df-4f17-864b-d6151708f036.jpg' },
  { name: 'Raycast',     rev: 'Y Combinator',      img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_caf5f41c-2b2a432d-a63a-381ae5329445.jpg' },
  { name: 'TikTok',      rev: '$20B+ Revenue',     img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_e3fe344e-8fc1-41c2-8fa7-bdd299db15c3.jpg' },
  { name: 'Instagram',   rev: '$24B Revenue',      img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_dc51236d-ce8a-4b9a-ad32-582bb6aca0b0.jpg' },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    sub: '/month',
    billed: 'No credit card required',
    features: [
      'Opportunity Database',
      'Trending & Rising Opportunities',
      'Hidden Gems',
      'AI Apps, B2B SaaS, Consumer Apps',
      'Opportunity Search & Filtering',
      'Startup Scores & Growth Metrics',
      'Revenue Estimates',
    ],
    cta: 'Get Started Free',
    highlight: false,
    badge: null,
  },
  {
    name: 'Pro',
    price: '$49',
    sub: '/month',
    billed: '$490/year — save 17% · 500 AI credits included monthly',
    features: [
      'Everything in Free',
      'Research Agent (5 credits)',
      'Validation Agent (10 credits)',
      'Competitor Intelligence (10 credits)',
      'Startup Teardown (15 credits)',
      'MVP Planner (10 credits)',
      'Launch Agent (10 credits)',
      'Workspace, Watchlists & Blueprints',
      'Saved Reports & Export Features',
      'Priority Processing',
    ],
    cta: 'Start Pro',
    highlight: true,
    badge: 'Most Popular',
  },
];

// ─── REAL APP DEMO SCREENS ───────────────────────────────────────────────────

const CYCLE_MS = 5000;

const DEMO_SCREENS = [
  { id: 'Opportunities', label: 'Opportunity Database', url: 'app.kraitin.com/dashboard' },
  { id: 'Intelligence',  label: 'Opportunity Intelligence', url: 'app.kraitin.com/opportunity/ai-meal-scanner' },
  { id: 'Validation',    label: 'Validation Agent', url: 'app.kraitin.com/validation' },
  { id: 'MVP Planner',   label: 'MVP Planner', url: 'app.kraitin.com/mvp-planner' },
  { id: 'Launch Agent',  label: 'Launch Agent', url: 'app.kraitin.com/launch-agent' },
];

/* ── Screen 1: Opportunity Database (real dashboard table) ── */
function ScreenOpportunities({ visible }: { visible: boolean }) {
  const rows = [
    { rank: 1, name: 'AI Meal Scanner',      cat: 'Health',    growth: '+117%', rev: '$3M MRR',   score: 94, gem: true },
    { rank: 2, name: 'Voice Study Coach',    cat: 'Education', growth: '+89%',  rev: '$1.2M MRR', score: 88, gem: false },
    { rank: 3, name: 'Legal AI Assistant',   cat: 'Productivity', growth: '+74%', rev: '$5M MRR', score: 91, gem: true },
    { rank: 4, name: 'AI Companion App',     cat: 'Lifestyle', growth: '+62%',  rev: '$800K MRR', score: 82, gem: false },
    { rank: 5, name: 'B2B Outreach AI',      cat: 'B2B SaaS',  growth: '+55%',  rev: '$2.1M MRR', score: 87, gem: false },
    { rank: 6, name: 'Sleep Tracker Pro',    cat: 'Health',    growth: '+48%',  rev: '$650K MRR', score: 79, gem: false },
  ];
  return (
    <div className="flex flex-col h-full">
      {/* mini top-bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#060608]">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="w-5 h-5 rounded bg-[#C5FF00]/15 border border-[#C5FF00]/20 flex items-center justify-center shrink-0">
            <span className="text-[#C5FF00] text-[8px] font-black">K</span>
          </div>
          <span className="text-white/25 text-[10px] font-mono truncate">Opportunity Database</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#C5FF00]/25 text-[#C5FF00]/70">5 filters</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30">Sort: Score ↓</span>
        </div>
      </div>
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-0 border-b border-white/[0.05]">
        {[
          { l: 'Total Opps', v: '2,847' },
          { l: 'New This Week', v: '+124' },
          { l: 'Avg Growth', v: '+67%' },
          { l: 'High Potential', v: '389' },
        ].map(({ l, v }) => (
          <div key={l} className="px-3 py-2 border-r border-white/[0.04] last:border-0">
            <p className="text-[9px] text-white/25 mb-0.5">{l}</p>
            <p className="text-[12px] font-black text-white/80">{v}</p>
          </div>
        ))}
      </div>
      {/* table */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['#', 'Opportunity', 'Category', 'Growth', 'Revenue', 'Score'].map(h => (
                <th key={h} className="px-2.5 py-1.5 text-left text-[9px] text-white/25 font-medium uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={r.rank}
                className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-all duration-400"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(5px)',
                  transitionDelay: `${idx * 60}ms`,
                }}
              >
                <td className="px-2.5 py-2 text-white/25 font-mono">{r.rank}</td>
                <td className="px-2.5 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/85 font-semibold whitespace-nowrap">{r.name}</span>
                    {r.gem && <span className="text-[8px] px-1 py-0.5 rounded-full bg-[#C5FF00]/10 text-[#C5FF00] border border-[#C5FF00]/20">★ Gem</span>}
                  </div>
                </td>
                <td className="px-2.5 py-2 text-white/40 whitespace-nowrap">{r.cat}</td>
                <td className="px-2.5 py-2 text-[#C5FF00] font-bold whitespace-nowrap">{r.growth}</td>
                <td className="px-2.5 py-2 text-white/55 font-mono whitespace-nowrap">{r.rev}</td>
                <td className="px-2.5 py-2">
                  <span className="text-[#C5FF00] font-black text-[11px]">{r.score}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* pagination stub */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/[0.05] bg-[#060608]">
        <span className="text-[9px] text-white/20">Showing 1–6 of 2,847 opportunities</span>
        <div className="flex items-center gap-1">
          {['‹', '1', '2', '3', '›'].map((p, i) => (
            <span key={i} className={`w-5 h-5 flex items-center justify-center rounded text-[9px] cursor-default ${i === 1 ? 'bg-[#C5FF00]/15 text-[#C5FF00]' : 'text-white/25'}`}>{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Screen 2: Opportunity Intelligence page ── */
function ScreenIntelligence({ visible }: { visible: boolean }) {
  const metrics = [
    { l: 'Revenue Potential', v: '$3M MRR' },
    { l: 'Market Demand',     v: '94/100' },
    { l: 'Competition',       v: 'Medium' },
    { l: 'Monthly Growth',    v: '+117%' },
    { l: 'Market Size',       v: '$12.4B' },
    { l: 'Build Difficulty',  v: '5/10' },
  ];
  const premBenefits = ['Customer Pain Points', 'Reddit Analysis', 'Demand Analysis', 'Risk Assessment'];
  return (
    <div className="flex flex-col h-full text-[10px] overflow-hidden">
      {/* back + title */}
      <div className="px-3 pt-2 pb-1 border-b border-white/[0.05] flex items-center gap-2">
        <span className="text-white/20 text-[9px]">← Explore</span>
        <span className="text-white/15 text-[9px]">/</span>
        <span className="text-white/50 text-[9px] font-semibold">AI Meal Scanner</span>
        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded border border-[#C5FF00]/25 bg-[#C5FF00]/10 text-[#C5FF00]">STRONG BUY</span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden px-3 py-2 space-y-2"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease', transitionDelay: '100ms' }}>
        {/* hero row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1 mb-1">
              <span className="text-[8px] px-1.5 py-0.5 rounded-full border border-white/10 text-white/35">Health & Fitness</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full border border-[#C5FF00]/20 bg-[#C5FF00]/[0.06] text-[#C5FF00]/70">★ Hidden Gem</span>
            </div>
            <p className="text-[14px] font-black text-white leading-tight">AI Meal Scanner</p>
            <p className="text-[9px] text-white/35 mt-0.5 leading-relaxed line-clamp-2">
              Snap a photo, get instant macros. CV-powered food recognition eliminates manual calorie logging.
            </p>
          </div>
          {/* score ring */}
          <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 border-[#C5FF00]/60 bg-[#C5FF00]/[0.04]">
            <span className="text-[18px] font-black text-[#C5FF00] leading-none">94</span>
            <span className="text-[7px] text-white/30">score</span>
          </div>
        </div>
        {/* metrics grid */}
        <div className="grid grid-cols-3 gap-1">
          {metrics.map(({ l, v }) => (
            <div key={l} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
              <p className="text-[8px] text-white/25 mb-0.5 truncate">{l}</p>
              <p className="text-[10px] font-bold text-white/80">{v}</p>
            </div>
          ))}
        </div>
        {/* Validation Report premium section */}
        <div className="relative rounded-lg border border-white/[0.06] overflow-hidden">
          {/* blurred preview */}
          <div className="blur-sm opacity-30 pointer-events-none p-2 space-y-1">
            <div className="h-2 w-2/3 rounded bg-white/10" />
            <div className="h-2 w-1/2 rounded bg-white/10" />
            <div className="h-2 w-3/4 rounded bg-white/10" />
          </div>
          {/* glass overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#08090d]/80 p-2">
            <div className="w-5 h-5 rounded-lg border border-sky-400/30 bg-sky-400/10 flex items-center justify-center mb-1">
              <span className="text-sky-400 text-[9px]">🔒</span>
            </div>
            <p className="text-[8px] font-black text-white mb-1 text-center">Unlock Validation Report</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mb-1.5">
              {premBenefits.map(b => (
                <div key={b} className="flex items-center gap-0.5">
                  <span className="text-sky-400 text-[7px]">✓</span>
                  <span className="text-[7px] text-white/35">{b}</span>
                </div>
              ))}
            </div>
            <div className="w-full h-5 rounded-md bg-[#C5FF00] flex items-center justify-center">
              <span className="text-black text-[8px] font-black">Upgrade To Pro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Screen 3: Validation Agent ── */
function ScreenValidation({ visible }: { visible: boolean }) {
  const [streamIdx, setStreamIdx] = useState(0);
  const lines = [
    { icon: '🔍', text: 'Scanning Reddit r/fitness — 2,847 posts analyzed…', color: 'text-white/60' },
    { icon: '📊', text: 'Top complaint: "manual logging takes too long" — 1,203 mentions', color: 'text-amber-400/80' },
    { icon: '💡', text: 'Demand signal: "+calorie scanner app" searches up 340% YoY', color: 'text-[#C5FF00]/80' },
    { icon: '🏆', text: 'App Store reviews: 78% mention "wish it scanned food photos"', color: 'text-sky-400/80' },
    { icon: '✅', text: 'Validation Score: 94/100 — STRONG BUY recommendation', color: 'text-[#C5FF00] font-semibold' },
  ];
  useEffect(() => {
    if (!visible) { setStreamIdx(0); return; }
    setStreamIdx(0);
    let i = 0;
    const id = setInterval(() => { i++; setStreamIdx(i); if (i >= lines.length) clearInterval(id); }, 500);
    return () => clearInterval(id);
  }, [visible]);

  const scores = [
    { label: 'Market Demand', value: 94, color: '#C5FF00' },
    { label: 'Monetization Potential', value: 88, color: '#C5FF00' },
    { label: 'Competition Gap', value: 78, color: '#38bdf8' },
    { label: 'Viral Potential', value: 85, color: '#C5FF00' },
  ];
  const [animated, setAnimated] = useState(false);
  useEffect(() => { if (!visible) { setAnimated(false); return; } const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, [visible]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-2 pb-1.5 border-b border-white/[0.05] flex items-center gap-2">
        <span className="text-[10px] font-bold text-white/60">Validation Agent</span>
        <span className="ml-auto text-[9px] text-white/25 font-mono">AI Meal Scanner</span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-2 gap-0">
        {/* stream */}
        <div className="border-r border-white/[0.05] p-2.5 space-y-1.5 overflow-hidden">
          <p className="text-[9px] text-white/25 uppercase tracking-wider mb-2">Live Analysis</p>
          {lines.map((line, idx) => (
            <div key={idx} className={`flex items-start gap-1.5 transition-all duration-500 ${line.color}`}
              style={{ opacity: idx < streamIdx ? 1 : 0, transform: idx < streamIdx ? 'none' : 'translateY(4px)' }}>
              <span className="text-[10px] shrink-0 mt-0.5">{line.icon}</span>
              <span className="text-[9px] leading-snug">{line.text}</span>
            </div>
          ))}
        </div>
        {/* scores */}
        <div className="p-2.5 space-y-2.5 overflow-hidden">
          <p className="text-[9px] text-white/25 uppercase tracking-wider mb-2">Scores</p>
          {scores.map(s => (
            <div key={s.label}>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] text-white/45">{s.label}</span>
                <span className="text-[9px] font-bold" style={{ color: s.color }}>{s.value}</span>
              </div>
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: animated ? `${s.value}%` : '0%', backgroundColor: s.color }} />
              </div>
            </div>
          ))}
          <div className="mt-3 rounded-lg border border-[#C5FF00]/25 bg-[#C5FF00]/[0.06] p-2 text-center">
            <p className="text-[9px] font-black text-[#C5FF00]">HIGH POTENTIAL</p>
            <p className="text-[8px] text-[#C5FF00]/60 mt-0.5">Build it — strong signals across all dimensions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Screen 4: MVP Planner ── */
function ScreenMVP({ visible }: { visible: boolean }) {
  const sprints = [
    { week: 'Wk 1–2', title: 'Core Camera + ML Model', items: ['Food recognition model', 'Barcode scanner fallback', 'Macro database (500K+ items)'], done: true },
    { week: 'Wk 3–4', title: 'User Dashboard', items: ['Daily macro tracker', 'Goal setting flow', 'Progress charts'], done: true },
    { week: 'Wk 5–6', title: 'Social + Gamification', items: ['Streak system', 'Friend challenges', 'Shareable cards'], done: false },
  ];
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-2 pb-1.5 border-b border-white/[0.05] flex items-center gap-2">
        <span className="text-[10px] font-bold text-white/60">MVP Planner</span>
        <span className="ml-auto flex items-center gap-1">
          <span className="text-[9px] px-1.5 py-0.5 rounded border border-amber-400/25 text-amber-400/70">4–6 Weeks</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30">$5K–$15K</span>
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-5 gap-0">
        {/* sprints */}
        <div className="col-span-3 border-r border-white/[0.05] p-2.5 space-y-2 overflow-hidden">
          <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1.5">Sprint Roadmap</p>
          {sprints.map((s, idx) => (
            <div key={s.week} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 transition-all duration-500"
              style={{ opacity: visible ? 1 : 0, transitionDelay: `${idx * 120}ms` }}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[8px] text-white/25 font-mono">{s.week}</span>
                <span className={`text-[8px] font-bold ${s.done ? 'text-[#C5FF00]' : 'text-amber-400'}`}>{s.title}</span>
              </div>
              <div className="space-y-0.5">
                {s.items.map(item => (
                  <div key={item} className="flex items-center gap-1">
                    <span className={`text-[8px] ${s.done ? 'text-[#C5FF00]/60' : 'text-white/25'}`}>{s.done ? '✓' : '○'}</span>
                    <span className="text-[8px] text-white/45">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* stack */}
        <div className="col-span-2 p-2.5 space-y-2 overflow-hidden">
          <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1.5">Tech Stack</p>
          {[
            { layer: 'Frontend', tech: 'React Native' },
            { layer: 'Backend', tech: 'Supabase' },
            { layer: 'AI / ML', tech: 'TensorFlow Lite' },
            { layer: 'Payments', tech: 'Stripe' },
            { layer: 'Analytics', tech: 'Mixpanel' },
          ].map(({ layer, tech }) => (
            <div key={layer} className="rounded border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 transition-all duration-500"
              style={{ opacity: visible ? 1 : 0, transitionDelay: '200ms' }}>
              <p className="text-[8px] text-white/25">{layer}</p>
              <p className="text-[9px] font-bold text-white/70">{tech}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Screen 5: Launch Agent ── */
function ScreenLaunch({ visible }: { visible: boolean }) {
  const channels = [
    { name: 'TikTok Organic', score: 94, rec: 'Strong', color: '#C5FF00' },
    { name: 'App Store SEO',  score: 88, rec: 'Strong', color: '#C5FF00' },
    { name: 'Micro-Influencers', score: 91, rec: 'Strong', color: '#C5FF00' },
    { name: 'Reddit Communities', score: 76, rec: 'Good', color: '#34d399' },
  ];
  const timeline = [
    { day: 'Day 1–7',   task: 'Soft launch + TikTok seeding', status: 'active' },
    { day: 'Day 8–21',  task: 'Influencer outreach (10 micro)', status: 'pending' },
    { day: 'Day 22–45', task: 'Paid social (validated creative)', status: 'pending' },
    { day: 'Day 46–90', task: 'Scale winners + App Store push', status: 'pending' },
  ];
  const [animated, setAnimated] = useState(false);
  useEffect(() => { if (!visible) { setAnimated(false); return; } const t = setTimeout(() => setAnimated(true), 150); return () => clearTimeout(t); }, [visible]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-2 pb-1.5 border-b border-white/[0.05] flex items-center gap-2">
        <span className="text-[10px] font-bold text-white/60">Launch Agent</span>
        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded border border-[#C5FF00]/25 bg-[#C5FF00]/10 text-[#C5FF00]/70">LAUNCH READY</span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-2 gap-0">
        {/* channels */}
        <div className="border-r border-white/[0.05] p-2.5 space-y-2 overflow-hidden">
          <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1.5">Channel Scores</p>
          {channels.map(ch => (
            <div key={ch.name} className="space-y-0.5" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}>
              <div className="flex justify-between">
                <span className="text-[9px] text-white/50">{ch.name}</span>
                <span className="text-[9px] font-bold" style={{ color: ch.color }}>{ch.score}</span>
              </div>
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: animated ? `${ch.score}%` : '0%', backgroundColor: ch.color }} />
              </div>
            </div>
          ))}
        </div>
        {/* timeline */}
        <div className="p-2.5 space-y-1.5 overflow-hidden">
          <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1.5">90-Day Timeline</p>
          {timeline.map((t, idx) => (
            <div key={t.day} className="flex items-start gap-1.5 transition-all duration-400"
              style={{ opacity: visible ? 1 : 0, transitionDelay: `${idx * 80}ms` }}>
              <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${t.status === 'active' ? 'bg-[#C5FF00]' : 'bg-white/20'}`} />
              <div>
                <p className="text-[8px] text-white/25 font-mono">{t.day}</p>
                <p className="text-[8px] text-white/55 leading-tight">{t.task}</p>
              </div>
            </div>
          ))}
          <div className="mt-2 rounded-lg border border-[#C5FF00]/20 bg-[#C5FF00]/[0.04] p-1.5 text-center">
            <p className="text-[8px] text-[#C5FF00]/80 font-bold">Projected: 10K users in 90 days</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── DEMO PLAYER shell (browser chrome + screen switcher) ── */
function DemoPlayer({ activeIdx, onTabChange, progress }: {
  activeIdx: number;
  onTabChange: (idx: number) => void;
  progress: number;
}) {
  const [screenVisible, setScreenVisible] = useState(true);
  const [screenKey, setScreenKey] = useState(0);
  const prevIdx = useRef(activeIdx);

  useEffect(() => {
    if (prevIdx.current !== activeIdx) {
      setScreenVisible(false);
      setScreenKey(k => k + 1);
      const t = setTimeout(() => setScreenVisible(true), 80);
      prevIdx.current = activeIdx;
      return () => clearTimeout(t);
    }
  }, [activeIdx]);

  const screen = DEMO_SCREENS[activeIdx];

  return (
    <div className="w-full h-full flex flex-col">
      {/* url bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.07] bg-[#0d0d0d]">
        <span className="text-[10px] text-white/30 font-mono flex-1 truncate">{screen.url}</span>
        <div className="flex items-center gap-1 shrink-0">
          <div className="w-2 h-2 rounded-full bg-[#C5FF00]/70" />
          <span className="text-[8px] text-white/25">Live</span>
        </div>
      </div>

      {/* screen content */}
      <div
        key={screenKey}
        className="flex-1 min-h-0 overflow-hidden"
        style={{ transition: 'opacity 0.3s ease', opacity: screenVisible ? 1 : 0 }}
      >
        {activeIdx === 0 && <ScreenOpportunities visible={screenVisible} />}
        {activeIdx === 1 && <ScreenIntelligence visible={screenVisible} />}
        {activeIdx === 2 && <ScreenValidation visible={screenVisible} />}
        {activeIdx === 3 && <ScreenMVP visible={screenVisible} />}
        {activeIdx === 4 && <ScreenLaunch visible={screenVisible} />}
      </div>

      {/* progress bar */}
      <div className="h-[2px] bg-white/[0.04] shrink-0">
        <div className="h-full bg-[#C5FF00]" style={{ width: `${progress}%`, transition: 'width 50ms linear' }} />
      </div>

      {/* screen tabs — mobile only */}
      <div className="flex md:hidden gap-1 px-2 py-1.5 border-t border-white/[0.05] overflow-x-auto shrink-0">
        {DEMO_SCREENS.map((s, i) => (
          <button key={s.id} onClick={() => onTabChange(i)}
            className={`shrink-0 text-[8px] px-2 py-1 rounded-md transition-all duration-200 whitespace-nowrap ${
              i === activeIdx ? 'bg-[#C5FF00]/15 text-[#C5FF00] border border-[#C5FF00]/30' : 'text-white/30 hover:text-white/55'
            }`}>
            {s.id}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── DEMO WRAPPER — sidebar + player with shared state ── */
function DemoWrapper({ fadeVisible }: { fadeVisible: boolean }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCycle = useCallback((fromIdx: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(0);
    let p = 0;
    progressRef.current = setInterval(() => {
      p += 100 / (CYCLE_MS / 50);
      setProgress(Math.min(p, 100));
    }, 50);
    intervalRef.current = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % DEMO_SCREENS.length);
      setProgress(0); p = 0;
    }, CYCLE_MS);
  }, []);

  useEffect(() => {
    startCycle(0);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [startCycle]);

  const handleTabChange = (idx: number) => {
    setActiveIdx(idx);
    startCycle(idx);
  };

  return (
    <div className="flex" style={{ minHeight: 340 }}>
      {/* sidebar — desktop only */}
      <div className="hidden md:flex flex-col w-44 shrink-0 border-r border-white/[0.07] p-3 space-y-1">
        {DEMO_SCREENS.map((screen, i) => (
          <button
            key={screen.id}
            onClick={() => handleTabChange(i)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded text-[11px] w-full text-left transition-all duration-300 ${
              i === activeIdx ? 'bg-[#C5FF00]/10 text-[#C5FF00]' : 'text-white/40 hover:text-white/60'
            }`}
            style={{ opacity: fadeVisible ? 1 : 0, transitionDelay: `${i * 60}ms` }}
          >
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-300 ${i === activeIdx ? 'bg-[#C5FF00]' : 'bg-white/20'}`} />
            {screen.id}
          </button>
        ))}
      </div>
      {/* player */}
      <div className="flex-1 min-w-0 flex flex-col">
        <DemoPlayer activeIdx={activeIdx} onTabChange={handleTabChange} progress={progress} />
      </div>
    </div>
  );
}

/* ─── SCROLL FADE-IN HOOK ───────────────────────────────── */
function useFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── MAIN COMPONENT ────────────────────────────────────── */

/* ── FAQ Item ───────────────────────────────────────────────── */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-white/[0.06] first:border-t-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">{question}</span>
        <span className={`w-5 h-5 rounded-full border border-white/[0.12] flex items-center justify-center shrink-0 transition-all ${open ? 'bg-lime/10 border-lime/30 rotate-45' : 'group-hover:border-white/25'}`}>
          <Plus className="w-3 h-3 text-white/40" />
        </span>
      </button>
      {open && (
        <p className="pb-5 text-sm text-white/40 leading-relaxed pr-8">{answer}</p>
      )}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroFade = useFadeIn(0);
  const mockupFade = useFadeIn(0.1);
  const featuresFade = useFadeIn(0.1);
  const usersFade = useFadeIn(0.1);

  return (
    <div className="bg-landing text-white min-h-screen overflow-x-hidden">
      <PageMeta
        title="Kraitin — The AI Cofounder That Tells You What To Build"
        description="Kraitin is the AI-powered startup intelligence platform for founders. Discover 600+ validated startup ideas, run AI market research, validate demand, analyze competitors, plan your MVP, and get a full go-to-market launch strategy — all in one place."
        ogTitle="Kraitin — Discover & Validate Startup Ideas with AI"
        ogDescription="600+ AI-scored startup opportunities. Research, validate, competitor analysis, MVP planning, and launch strategy — in minutes. Built for serious founders."
        ogUrl="https://kraitin.com/"
      />

      {/* ── NAV ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 border-b border-white/[0.06] bg-black/80 backdrop-blur-md">
        <KraitinLogo size="md" />
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <button key={l} onClick={() => {
              if (l === 'Affiliate') { navigate('/affiliate'); return; }
              const id = l.toLowerCase();
              const el = document.getElementById(id);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }} className="text-sm text-white/60 hover:text-white transition-colors">{l}</button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="text-sm text-white/70 hover:text-white transition-colors hidden md:block">Log in</button>
          <button
            onClick={() => navigate('/login?tab=register')}
            className="bg-lime text-black text-sm font-bold px-4 py-2 rounded-full hover:bg-lime/90 transition-all hover:scale-105"
          >
            Upgrade To Pro
          </button>
          {/* Mobile hamburger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-white/[0.08] text-white/60 hover:text-white transition-colors">
                <Menu className="w-4 h-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0 bg-[#060709] border-l border-white/[0.06]">
              <div className="flex flex-col h-full p-6 gap-2">
                <div className="mb-4"><KraitinLogo size="sm" /></div>
                {navLinks.map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (l === 'Affiliate') { navigate('/affiliate'); return; }
                      const id = l.toLowerCase();
                      setTimeout(() => {
                        const el = document.getElementById(id);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 300);
                    }}
                    className="text-left py-3 text-sm text-white/60 hover:text-white border-b border-white/[0.05] transition-colors"
                  >{l}</button>
                ))}
                <div className="mt-auto flex flex-col gap-3 pt-6">
                  <button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                    className="w-full py-3 rounded-xl border border-white/[0.08] text-sm text-white/70 hover:text-white transition-colors">
                    Log in
                  </button>
                  <button onClick={() => { setMobileMenuOpen(false); navigate('/login?tab=register'); }}
                    className="w-full py-3 rounded-xl bg-lime text-black text-sm font-bold hover:bg-lime/90 transition-all">
                    Get Started Free
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-40 pb-24 px-6 text-center overflow-hidden">
        {/* faint lime radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-lime/[0.06] blur-[120px]" />
        </div>

        <div
          ref={heroFade.ref}
          className="transition-all duration-700"
          style={{ opacity: heroFade.visible ? 1 : 0, transform: heroFade.visible ? 'translateY(0)' : 'translateY(28px)' }}
        >
          <h1 className="relative text-4xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight text-balance">
            Stop guessing<br />
            what to <span className="text-lime">build</span>
          </h1>
          <p className="relative mt-5 text-base md:text-lg text-white/50 max-w-lg mx-auto text-balance">
            Discover validated startup opportunities, analyze competitors, and launch faster — before you waste months building the wrong thing.
          </p>

          <div className="relative mt-10 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
            {heroChecks.map((c, i) => (
              <div
                key={c}
                className="flex items-start gap-2.5 transition-all duration-500"
                style={{
                  opacity: heroFade.visible ? 1 : 0,
                  transform: heroFade.visible ? 'translateY(0)' : 'translateY(16px)',
                  transitionDelay: `${200 + i * 80}ms`,
                }}
              >
                <Check className="w-4 h-4 text-lime mt-0.5 shrink-0" />
                <span className="text-white/70 text-sm">{c}</span>
              </div>
            ))}
          </div>

          <div
            className="relative mt-10 flex flex-col items-center gap-4 transition-all duration-700"
            style={{ opacity: heroFade.visible ? 1 : 0, transitionDelay: '500ms' }}
          >
            <button
              onClick={() => navigate('/login?tab=register')}
              className="inline-flex items-center gap-2 bg-lime text-black font-bold text-base px-8 py-4 rounded-full hover:bg-lime/90 transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(197,255,0,0.4)]"
            >
              Get Started for Free <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {socialAvatars.map((url, i) => (
                  <img key={i} src={url} alt="user" className="w-7 h-7 rounded-full border-2 border-black bg-white/10 object-cover" />
                ))}
              </div>
              <span className="text-white/50 text-sm">Used by top founders, studios &amp; growth teams</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCT DEMO (animated) ── */}
      <section className="px-4 md:px-8 pb-24">
        <div className="max-w-5xl mx-auto">
          <div
            ref={mockupFade.ref}
            className="transition-all duration-700"
            style={{ opacity: mockupFade.visible ? 1 : 0, transform: mockupFade.visible ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.98)' }}
          >
            {/* outer lime glow ring */}
            <div className="relative rounded-2xl p-[2px]"
              style={{ background: 'linear-gradient(180deg,rgba(197,255,0,0.55) 0%,rgba(197,255,0,0.08) 100%)' }}>
              {/* diffuse bloom */}
              <div className="absolute inset-x-0 bottom-0 h-32 rounded-b-2xl pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 110%,rgba(197,255,0,0.35) 0%,transparent 70%)' }} />
              <div className="relative rounded-2xl border border-lime/10 overflow-hidden bg-[#0a0a0a]">
                {/* browser chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.07] bg-[#111]">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
                  <div className="w-3 h-3 rounded-full bg-lime/50" />
                  <div className="flex-1 mx-4 bg-white/[0.06] rounded px-3 py-1 text-[11px] text-white/30 font-mono">
                    app.kraitin.com
                  </div>
                </div>
                <DemoWrapper fadeVisible={mockupFade.visible} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── APP LOGOS MARQUEE ── */}
      <section className="pb-24 overflow-hidden">
        <p className="text-center text-xs text-white/40 uppercase tracking-[0.2em] mb-8">Observe and replicate how the best apps win</p>
        <div className="relative">
          {/* fade edges */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
          <div className="flex animate-marquee whitespace-nowrap gap-6">
            {[...logoApps, ...logoApps].map((app, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                  <img src={app.img} alt={app.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-white/50 text-xs">{app.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="px-6 md:px-12 pb-24 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block text-xs border border-white/20 text-white/60 rounded-full px-4 py-1.5 mb-4 tracking-widest uppercase">Features</span>
          <h2 className="text-2xl md:text-4xl font-black text-balance">Everything you can do with <span className="text-lime">kraitin</span></h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {features.map((feat) => (
            <div key={feat.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden hover:border-white/[0.12] transition-colors">
              {/* screenshot */}
              <div className="border-b border-white/[0.07] overflow-hidden" style={{ height: 180 }}>
                <img
                  src={feat.img}
                  alt={feat.title}
                  className="w-full h-full object-cover object-top opacity-90 hover:opacity-100 transition-opacity"
                />
              </div>
              {/* text */}
              <div className="p-5">
                <h3 className="font-bold text-white mb-3">{feat.title}</h3>
                <ul className="space-y-1.5">
                  {feat.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-white/60">
                      <Check className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section className="px-6 md:px-12 pb-24 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block text-xs border border-white/20 text-white/60 rounded-full px-4 py-1.5 mb-4 tracking-widest uppercase">The Difference</span>
          <h2 className="text-2xl md:text-4xl font-black">Build Startups That <span className="text-lime">Win</span></h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Without */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-6">
            <h3 className="font-bold text-red-400 mb-5 text-sm uppercase tracking-wider">Without Kraitin</h3>
            <ul className="space-y-3">
              {withoutKraitin.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-red-500/70 shrink-0 mt-0.5" />
                  <span className="text-white/50 text-sm line-through decoration-red-500/30">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* With */}
          <div className="rounded-2xl border border-lime/20 bg-lime/[0.03] p-6">
            <h3 className="font-bold text-lime mb-5 text-sm uppercase tracking-wider">With Kraitin</h3>
            <ul className="space-y-3">
              {withKraitin.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-lime shrink-0 mt-0.5" />
                  <span className="text-white/80 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF STATS ── */}
      <section className="px-6 md:px-12 pb-24 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-8 py-10">
          <p className="text-center text-[11px] text-white/30 uppercase tracking-widest mb-8 font-semibold">Built for founders, indie hackers, developers and startup teams</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-white/[0.06]">
            {[
              { value: '300+',    label: 'Startup opportunities\nanalyzed and validated' },
              { value: '5',       label: 'AI agents working\ntogether as one cofounder' },
              { value: 'Weekly',  label: 'New opportunities\nadded every week' },
              { value: '$49/mo',  label: 'Everything included.\nNo hidden add-ons.' },
            ].map(({ value, label }) => (
              <div key={value} className="text-center md:px-8">
                <p className="text-2xl md:text-3xl font-black text-white mb-1.5">{value}</p>
                <p className="text-[11px] text-white/30 leading-snug whitespace-pre-line">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AGENTS SECTION ── */}
      <section id="agents" className="px-6 md:px-12 pb-24 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block text-xs border border-white/20 text-white/60 rounded-full px-4 py-1.5 mb-4 tracking-widest uppercase">AI Agents</span>
          <h2 className="text-2xl md:text-4xl font-black text-balance">Five agents. <span className="text-lime">One cofounder.</span></h2>
          <p className="text-white/40 mt-4 text-base max-w-xl mx-auto">Each agent is purpose-built to take you from raw idea to funded startup, step by step.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: '🔬', name: 'Research Agent',   desc: 'Deep-dives into any market or idea. Returns a full landscape report with signals, trends, and real data.',              badge: 'Research' },
            { icon: '✅', name: 'Validation Agent', desc: 'Tests your idea against real demand signals, competitor gaps, and willingness-to-pay before you build.',               badge: 'Validate' },
            { icon: '👁️', name: 'Competitor Intel', desc: 'Tracks what competitors are doing — ad spend, growth rate, positioning shifts, and exploitable weaknesses.',           badge: 'Intel'    },
            { icon: '⚙️', name: 'MVP Planner',      desc: 'Generates a week-by-week build plan for your minimum viable product, scoped to your skill level and timeline.',        badge: 'Plan'     },
            { icon: '🚀', name: 'Launch Agent',     desc: 'Creates a complete go-to-market plan: channels, messaging, early growth levers, and a day-one launch checklist.',      badge: 'Launch'   },
          ].map((agent) => (
            <div key={agent.name} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-lime/20 hover:bg-lime/[0.02] transition-all p-6 flex gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-xl shrink-0">{agent.icon}</div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-sm font-bold text-white">{agent.name}</p>
                  <span className="text-[10px] text-lime border border-lime/25 bg-lime/[0.06] px-2 py-0.5 rounded-full font-semibold">{agent.badge}</span>
                </div>
                <p className="text-[13px] text-white/40 leading-relaxed">{agent.desc}</p>
              </div>
            </div>
          ))}
          <div className="rounded-2xl border border-lime/15 bg-lime/[0.03] p-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-black text-white mb-1">All 5 agents.</p>
              <p className="text-white/40 text-sm mb-4">Included in every plan. No add-ons.</p>
              <button onClick={() => navigate('/login?tab=register')}
                className="bg-lime text-black text-sm font-bold px-5 py-2 rounded-full hover:bg-lime/90 transition-all">
                Try them free →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── STARTUP TEARDOWN DEMO ── */}
      <section id="teardown" className="px-6 md:px-12 py-24 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 text-[11px] border border-[#C5FF00]/25 text-[#C5FF00]/70 rounded-full px-4 py-1.5 mb-5 tracking-widest uppercase font-semibold">
            <Zap className="w-3 h-3" /> Teardown Engine · New
          </span>
          <h2 className="text-2xl md:text-4xl font-black mb-4 text-balance">
            Reverse-engineer any startup<br className="hidden md:block" /> in <span className="text-lime">seconds</span>
          </h2>
          <p className="text-white/40 max-w-xl mx-auto text-sm md:text-base text-balance">
            Type any company. Get a full intelligence dossier — business model, growth playbook, weaknesses, and a blueprint to clone it.
          </p>
        </div>

        {/* Demo shell */}
        <div className="relative max-w-4xl mx-auto rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">

          {/* Window chrome */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.05] bg-white/[0.015]">
            <span className="w-3 h-3 rounded-full bg-red-500/40" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/40" />
            <span className="w-3 h-3 rounded-full bg-[#C5FF00]/40" />
            <div className="flex-1 mx-4">
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 max-w-xs mx-auto">
                <div className="w-2.5 h-2.5 rounded-full bg-[#C5FF00]/40" />
                <span className="text-[11px] text-white/30 font-mono">kraitin.com/teardown</span>
              </div>
            </div>
          </div>

          {/* Search bar (static demo state — "already searched") */}
          <div className="px-6 py-5 border-b border-white/[0.05]">
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 max-w-lg">
              <div className="w-4 h-4 text-white/25">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </div>
              <span className="text-sm text-white/80 font-medium flex-1">Duolingo</span>
              <div className="w-7 h-7 rounded-lg bg-[#C5FF00] flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 text-black" />
              </div>
            </div>
          </div>

          {/* Dossier content */}
          <div className="px-6 pb-0 pt-6 space-y-8">

            {/* Company title */}
            <div>
              <h3 className="text-xl font-black text-white">Duolingo — Startup Intelligence Dossier</h3>
              <p className="text-white/35 text-xs mt-1">Generated by Kraitin Teardown Engine · Deep analysis · 13 sections</p>
            </div>

            {/* Executive summary cards */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">📊 Executive Summary</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Annual Revenue', value: '$700M+' },
                  { label: 'Registered Users', value: '100M+' },
                  { label: 'Est. MRR', value: '$58M+' },
                  { label: 'Growth Score', value: '92 / 100', highlight: true },
                  { label: 'Moat Score', value: '94 / 100', highlight: true },
                  { label: 'Funding', value: '$521M' },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{label}</p>
                    <p className={`text-base font-black ${highlight ? 'text-[#C5FF00]' : 'text-white'}`}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-2.5">
                <p className="text-xs text-white/50 italic">
                  "Duolingo wins because they turned language learning into a dopamine machine — daily streaks, XP, and loss aversion create a habit loop that no traditional course can compete with."
                </p>
              </div>
            </div>

            {/* Why They Win */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">🏆 Why They Win</p>
              <div className="space-y-2.5">
                {[
                  { icon: TrendingUp, title: 'Gamification at Scale', desc: 'Streaks, XP, leaderboards, and hearts create compulsive daily engagement. Users don\'t want to lose their streak — that\'s more powerful than any reminder.' },
                  { icon: Target, title: 'Freemium Acquisition Machine', desc: '100M+ free users generate data, word-of-mouth, and ad revenue — then the platform converts 8–12% to paid subscriptions at $7–13/month.' },
                  { icon: Shield, title: 'Platform-Level Distribution', desc: 'App Store #1 Education for 2,000+ days. SEO domination on "learn [language]" queries. TikTok\'s most recognizable mascot.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                    <div className="w-7 h-7 rounded-lg bg-[#C5FF00]/10 border border-[#C5FF00]/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-[#C5FF00]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
                      <p className="text-xs text-white/45 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitor Weaknesses */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">⚠️ Competitor Weaknesses</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 px-3 text-white/25 font-semibold uppercase tracking-wider">Weakness</th>
                      <th className="text-left py-2 px-3 text-white/25 font-semibold uppercase tracking-wider">Severity</th>
                      <th className="text-left py-2 px-3 text-white/25 font-semibold uppercase tracking-wider">The Opportunity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { weakness: 'No African language coverage', severity: 'High', opp: 'Build for 1.4B underserved speakers' },
                      { weakness: 'Weak social / multiplayer features', severity: 'Medium', opp: 'Co-learning & accountability pairs' },
                      { weakness: 'No creator economy integration', severity: 'Medium', opp: 'Native speaker teachers + revenue share' },
                      { weakness: 'Poor adult professional learning', severity: 'High', opp: 'B2B SaaS for enterprise language training' },
                    ].map(({ weakness, severity, opp }) => (
                      <tr key={weakness} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3 text-white/65">{weakness}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${severity === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                            {severity}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-white/40">{opp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Clone This Startup */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">🛠 Clone This Startup</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Build Cost', value: '$8K – $25K' },
                  { label: 'Solo Dev Time', value: '10–14 weeks' },
                  { label: 'Tech Stack', value: 'React Native + Supabase + OpenAI' },
                  { label: 'Complexity', value: 'Medium–Hard' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-[13px] font-bold text-white/80">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Blurred locked sections */}
            <div className="relative">
              {/* Gradient overlay */}
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-t from-[#06070a] via-[#06070a]/80 to-transparent rounded-xl">
                <div className="text-center px-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/[0.04] mb-3">
                    <Lock className="w-4 h-4 text-white/40" />
                  </div>
                  <p className="text-white/70 font-semibold text-sm mb-1">9 more sections unlocked on Pro</p>
                  <p className="text-white/30 text-xs mb-4">Business model flow · Revenue breakdown · Growth strategy · Content intelligence · Viral hooks · Marketing deep-dive · Opportunity gaps · Copy this framework · AI Verdict</p>
                  <button
                    onClick={() => navigate('/login?tab=register')}
                    className="inline-flex items-center gap-2 bg-[#C5FF00] text-black text-sm font-bold px-6 py-2.5 rounded-full hover:bg-[#C5FF00]/90 transition-all hover:scale-105"
                  >
                    Unlock Full Dossier <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Blurred preview content */}
              <div className="blur-sm select-none pointer-events-none space-y-6 py-6">
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">📈 Growth Strategy</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['TikTok — Primary', 'App Store SEO', 'YouTube', 'Instagram', 'Influencers', 'Email'].map(ch => (
                      <div key={ch} className="bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-2 text-xs text-white/50 flex items-center gap-1.5">
                        <ChevronRight className="w-3 h-3 text-[#C5FF00]/40 shrink-0" />{ch}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">🎬 Viral Hooks</p>
                  {['"You\'ve been learning Spanish wrong."', '"Your streak is in danger."', '"Can you beat this level?"'].map(h => (
                    <div key={h} className="border-l-2 border-[#C5FF00]/30 pl-3 py-1 text-xs text-white/50 italic mb-2">{h}</div>
                  ))}
                </div>
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">🤖 AI Verdict</p>
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                    <p className="text-sm text-white/60 leading-relaxed">The real moat isn't the lessons. It's the habit loop. Duolingo has trained 100M people to open the app every day out of fear of losing their streak...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10">
          <p className="text-white/30 text-sm mb-4">Search any startup — Notion, Figma, Linear, Cal AI, Superhuman, Loom…</p>
          <button
            onClick={() => navigate('/login?tab=register')}
            className="inline-flex items-center gap-2 bg-[#C5FF00] text-black font-bold px-8 py-3.5 rounded-full hover:bg-[#C5FF00]/90 transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(197,255,0,0.35)]"
          >
            Try the Teardown Engine Free <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="px-6 md:px-12 pb-24 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block text-xs border border-white/20 text-white/60 rounded-full px-4 py-1.5 mb-4 tracking-widest uppercase">Pricing</span>
          <h2 className="text-2xl md:text-4xl font-black">Simple, <span className="text-lime">transparent</span> pricing</h2>
          {/* Latest Update badge */}
          <div className="inline-flex items-center gap-3 mt-6 border border-white/[0.07] bg-white/[0.02] rounded-xl px-4 py-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
              <span className="text-[11px] font-bold text-lime uppercase tracking-wider">Latest · Kraitin v92</span>
            </span>
            <span className="text-white/20 text-[11px]">·</span>
            <span className="text-[11px] text-white/35">Faster validation · Improved startup scoring · Kira AI Advisor</span>
            <span className="text-[10px] text-white/20 hidden md:block">— Released 3 days ago</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {pricingPlans.map((plan) => (
            <div key={plan.name} className={`rounded-2xl p-7 flex flex-col border transition-all relative ${plan.highlight ? 'border-lime/30 bg-lime/[0.04] glow-lime-sm' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12]'}`}>
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-black text-black bg-lime px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">{plan.badge}</span>
              )}
              <h3 className={`font-bold text-lg mb-1 ${plan.highlight ? 'text-lime' : 'text-white'}`}>{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-black font-mono-num text-white">{plan.price}</span>
                <span className="text-white/40 text-sm">{plan.sub}</span>
              </div>
              <p className="text-white/30 text-xs mb-6">{plan.billed}</p>
              <ul className="space-y-2.5 flex-1 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${plan.highlight ? 'text-white/70' : 'text-white/55'}`}>
                    <Check className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/login?tab=register')}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${plan.highlight ? 'bg-lime text-black hover:bg-lime/90 hover:shadow-[0_0_20px_rgba(197,255,0,0.35)]' : 'border border-white/15 text-white/70 hover:border-white/30 hover:text-white'}`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
        <p className="text-center text-white/25 text-xs mt-4">Instant access. Cancel anytime.</p>

        {/* ── PRICING FAQ ── */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className="text-center text-sm font-semibold text-white/40 uppercase tracking-widest mb-8">Frequently Asked Questions</h3>
          <div className="space-y-px">
            {[
              {
                q: 'What is Kraitin?',
                a: 'Kraitin is an AI cofounder that helps founders discover startup opportunities, validate ideas, analyze competitors, and create launch plans — before you waste months building the wrong thing.',
              },
              {
                q: 'What can I do on the Free plan?',
                a: 'Free users get full access to the opportunity database — browse trending, rising, and hidden-gem startup ideas across AI apps, B2B SaaS, consumer apps, and mobile. No credit card required.',
              },
              {
                q: 'What are credits and how do they work?',
                a: 'Credits control AI consumption on the Pro plan. Each AI generation costs credits: Research Agent costs 5, all other agents cost 10 each. You receive 500 credits every month. Credits reset on your billing renewal date and do not roll over.',
              },
              {
                q: 'What happens if I run out of credits?',
                a: 'AI generation is paused until your credits reset at the start of your next billing cycle. You can still browse all opportunities and access your workspace — only new AI generations are gated.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Cancel from your billing settings at any time. You keep full Pro access until the end of your current billing period. No penalties, no fees.',
              },
              {
                q: 'Is there a free trial?',
                a: 'No trial needed. The Free plan gives you immediate access to the full opportunity database so you can experience Kraitin\'s core value before deciding to upgrade.',
              },
            ].map(({ q, a }, i) => (
              <FaqItem key={i} question={q} answer={a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FOUNDER STORY ── */}
      <section id="story" className="px-6 md:px-12 py-24 max-w-4xl mx-auto">
        {/* Label */}
        <div className="mb-14">
          <span className="text-xs border border-white/20 text-white/40 rounded-full px-4 py-1.5 tracking-widest uppercase">Why I Built Kraitin</span>
        </div>

        <div className="grid md:grid-cols-[220px_1fr] gap-12 md:gap-20 items-start">
          {/* Left: identity card — sticky on desktop */}
          <div className="md:sticky md:top-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center text-base font-black text-lime shrink-0">IT</div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Israel Thompson</p>
                <p className="text-[11px] text-white/30 mt-0.5">Founder · Age 18</p>
              </div>
            </div>
            <div className="space-y-3 border-t border-white/[0.06] pt-5">
              {[
                { label: 'First startup', value: 'Failed', dim: true },
                { label: 'Apps, 0 downloads', value: 'Multiple', dim: true },
                { label: 'Years building products', value: 'Still growing', dim: true },
              ].map(({ label, value, dim }) => (
                <div key={label} className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] text-white/25">{label}</span>
                  <span className={`text-[11px] font-semibold ${dim ? 'text-white/40' : 'text-lime'}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: long-form story */}
          <div className="space-y-6">
            <h2 className="text-2xl md:text-[2rem] font-black text-white leading-tight text-balance">
              My name is Israel Thompson.<br />I'm 18 years old.
            </h2>

            <div className="space-y-5 text-[15px] text-white/45 leading-[1.75]">
              <p>For years, I had the same problem almost every founder faces:</p>

              <p className="text-white/70 font-semibold text-base">I never knew what to build.</p>

              <p>I built products nobody wanted. I launched apps that got almost no downloads. I spent weeks researching ideas, only to abandon them halfway through.</p>

              <p>My Google Docs became a graveyard of startup ideas, market analyses, random notes, and unfinished plans.</p>

              <p>Every time I thought I had found the perfect idea, I'd discover someone had already done it better — or worse, I'd spend months building something nobody actually wanted.</p>

              <p>But the problem wasn't just building.</p>

              <p>It was knowing what was worth building in the first place.</p>

              <p>Every new idea raised the same questions:</p>

              <div className="border-l-2 border-white/[0.08] pl-5 space-y-2 my-6">
                {[
                  'Is there actually a market?',
                  'Are people willing to pay for this?',
                  'Is the competition too strong?',
                  'Am I about to waste months on the wrong thing?',
                ].map((q) => (
                  <p key={q} className="text-[14px] text-white/40">{q}</p>
                ))}
              </div>

              <p>Eventually I realized I wasn't the only one asking these questions.</p>

              <p>Thousands of founders, indie hackers, developers, creators, and entrepreneurs were struggling with exactly the same thing.</p>

              <p>Everyone was asking:</p>

              <div className="border-l-2 border-white/[0.08] pl-5 space-y-2 my-6">
                {[
                  '"What should I build?"',
                  '"How do I know if this idea is worth pursuing?"',
                  '"How do I validate it before spending months building?"',
                  '"How do I avoid wasting six months on something nobody wants?"',
                ].map((q) => (
                  <p key={q} className="text-[14px] text-white/40 italic">{q}</p>
                ))}
              </div>

              <p>The answers existed. But they were scattered across Reddit threads, App Store reviews, competitor websites, startup communities, research papers, and endless spreadsheets.</p>

              <p className="text-white/70 font-semibold">So I built Kraitin.</p>

              <p>Kraitin is the AI startup co-founder I wish I had when I started.</p>

              <p>It helps founders discover startup opportunities, validate ideas, analyze competitors, plan MVPs, and launch with confidence.</p>

              <p>Instead of guessing.<br />Instead of gambling.<br />Instead of building in the dark.</p>

              <p className="border-l-2 border-lime/40 pl-4 text-white/60 font-medium">
                Our mission is simple: help founders build smarter. Because the world doesn't need more abandoned startups. It needs more successful ones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROADMAP ── */}
      <section id="roadmap" className="px-6 md:px-12 py-24 max-w-4xl mx-auto">
        <div className="mb-14">
          <span className="text-xs border border-white/20 text-white/40 rounded-full px-4 py-1.5 tracking-widest uppercase">Public Roadmap</span>
          <h2 className="text-2xl md:text-3xl font-black text-white mt-6 mb-2">We build in public.<br /><span className="text-lime">You see everything.</span></h2>
          <p className="text-white/30 text-sm max-w-md">This is what's live, what's being built right now, and what's coming next. Updated as we ship.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* In Progress */}
          <div className="rounded-2xl border border-lime/15 bg-lime/[0.02] p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-lime animate-pulse" />
              <span className="text-xs font-bold text-lime uppercase tracking-wider">In Progress</span>
            </div>
            <ul className="space-y-3.5">
              {[
                'Opportunity Database V2',
                'Improved AI Validation',
                'Advanced Competitor Tracking',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-[13px] text-white/60">
                  <Check className="w-3.5 h-3.5 text-lime/70 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Coming Next */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-3.5 h-3.5 text-white/25" />
              <span className="text-xs font-bold text-white/30 uppercase tracking-wider">Coming Next</span>
            </div>
            <ul className="space-y-3.5">
              {[
                'Opportunity Alerts',
                'Weekly Startup Intelligence Reports',
                'Team Workspaces',
                'AI Opportunity Forecasting',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-[13px] text-white/35">
                  <ArrowRight className="w-3 h-3 text-white/20 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-[11px] text-white/20 mt-6">
          Want something on this list?{' '}
          <a href="/contact" className="text-white/35 hover:text-white/60 transition-colors underline underline-offset-2">Send a request →</a>
        </p>
      </section>

      {/* ── CHANGELOG ── */}
      <section id="changelog" className="px-6 md:px-12 py-24 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-[200px_1fr] gap-12 md:gap-20 items-start">
          {/* Left label col */}
          <div className="md:sticky md:top-8">
            <span className="text-xs border border-white/20 text-white/40 rounded-full px-4 py-1.5 tracking-widest uppercase">Changelog</span>
            <h2 className="text-xl md:text-2xl font-black text-white mt-6 mb-2 leading-tight">Every update.<br />Nothing hidden.</h2>
            <p className="text-[12px] text-white/25 leading-relaxed">We ship constantly. Every improvement, addition, and fix gets logged here.</p>
          </div>

          {/* Right: entries */}
          <div className="space-y-0 relative border-l border-white/[0.06] ml-1">
            {[
              {
                date: 'June 2026',
                version: 'v92',
                added: ['Opportunity Discovery Engine', 'Kira AI Startup Advisor', 'Validation Agent V2', 'Competitor Intel'],
                improved: ['Dashboard Performance', 'Report Generation Speed'],
                fixed: ['Subscription Sync Issues'],
              },
              {
                date: 'May 2026',
                version: 'v85–88',
                added: ['Blueprint Agent', 'Content Generator', 'Affiliate Dashboard'],
                improved: ['Research Agent accuracy', 'Startup scoring algorithm'],
                fixed: ['Credit deduction edge cases', 'Mobile layout overflow'],
              },
              {
                date: 'May 2026',
                version: 'v80 — Public Launch',
                added: ['Opportunity database (300+ ideas)', 'Research, Validation, Competitor, MVP, Launch agents', 'Stripe billing', 'Free + Pro plans'],
                improved: [],
                fixed: [],
              },
            ].map((entry) => (
              <div key={entry.version} className="relative pl-8 pb-12 last:pb-0">
                <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-white/15 border border-white/25" />
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-[11px] font-semibold text-white/60">{entry.date}</span>
                  <span className="text-[10px] text-white/20 font-mono bg-white/[0.04] border border-white/[0.07] px-2 py-0.5 rounded-full">{entry.version}</span>
                </div>
                <div className="space-y-4">
                  {entry.added.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-lime/60 uppercase tracking-widest mb-1.5">Added</p>
                      <ul className="space-y-1">
                        {entry.added.map(i => (
                          <li key={i} className="flex items-start gap-2 text-[12px] text-white/45">
                            <span className="text-lime/40 shrink-0 mt-0.5">+</span>{i}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {entry.improved.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-blue-400/50 uppercase tracking-widest mb-1.5">Improved</p>
                      <ul className="space-y-1">
                        {entry.improved.map(i => (
                          <li key={i} className="flex items-start gap-2 text-[12px] text-white/35">
                            <span className="text-blue-400/40 shrink-0 mt-0.5">↑</span>{i}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {entry.fixed.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-orange-400/50 uppercase tracking-widest mb-1.5">Fixed</p>
                      <ul className="space-y-1">
                        {entry.fixed.map(i => (
                          <li key={i} className="flex items-start gap-2 text-[12px] text-white/30">
                            <span className="text-orange-400/40 shrink-0 mt-0.5">✕</span>{i}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOCUMENTATION ── */}
      <section id="docs" className="px-6 md:px-12 py-24 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-[200px_1fr] gap-12 md:gap-20 items-start">
          {/* Left label */}
          <div>
            <span className="text-xs border border-white/20 text-white/40 rounded-full px-4 py-1.5 tracking-widest uppercase">Help Center</span>
            <h2 className="text-xl md:text-2xl font-black text-white mt-6 mb-2 leading-tight">Docs &amp; Guides</h2>
            <p className="text-[12px] text-white/25 leading-relaxed">Everything you need to get the most out of Kraitin.</p>
          </div>

          {/* Right: article list */}
          <div className="divide-y divide-white/[0.05]">
            {[
              { title: 'Getting Started',               desc: 'Create your account, explore the opportunity database, and run your first AI research — in under 5 minutes.', href: '/contact' },
              { title: 'Using the Research Agent',      desc: 'How to get deep market reports on any idea or industry. What inputs to use for the best results.',             href: '/contact' },
              { title: 'Using the Validation Agent',    desc: 'Test your idea against real demand signals before you build. Learn how to interpret your validation score.',    href: '/contact' },
              { title: 'Understanding Startup Scores',  desc: "What the opportunity score means, how it's calculated, and how to use it to compare ideas quickly.",           href: '/contact' },
              { title: 'How Credits Work',              desc: 'Pro plan includes 500 credits/month. Research costs 5, all other agents cost 10. Credits reset monthly.',      href: '#pricing' },
              { title: 'Billing FAQ',                   desc: 'What happens at renewal, how to cancel, what free vs Pro includes, and answers to every billing question.',    href: '#pricing' },
              { title: 'Best Practices',                desc: 'How the best founders use Kraitin: combining agents, sequencing research, and going from idea to launch.',     href: '/contact' },
            ].map(({ title, desc, href }) => (
              <a key={title} href={href}
                className="group flex items-start justify-between gap-4 py-4 hover:bg-white/[0.01] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white/70 group-hover:text-white transition-colors mb-0.5">{title}</p>
                  <p className="text-[11px] text-white/25 leading-relaxed text-pretty">{desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/15 group-hover:text-lime/60 transition-colors shrink-0 mt-1" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-6 py-28 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-lime/[0.07] blur-[120px] rounded-full" />
        </div>
        <h2 className="relative text-3xl md:text-5xl lg:text-7xl font-black text-balance mb-6">
          Your next startup<br />starts <span className="text-lime">here</span>
        </h2>
        <p className="relative text-white/50 mb-8 text-base md:text-lg">Join thousands of founders building smarter with Kraitin.</p>
        <button
          onClick={() => navigate('/login?tab=register')}
          className="relative inline-flex items-center gap-2 bg-lime text-black font-bold text-base md:text-lg px-8 md:px-10 py-4 rounded-full hover:bg-lime/90 transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(197,255,0,0.45)]"
        >
          Get Started for Free <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] px-6 md:px-12 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <KraitinLogo size="sm" />
              <p className="text-[12px] text-white/25 mt-3 leading-relaxed max-w-[180px]">The AI cofounder that tells you what to build.</p>
            </div>
            {/* Product */}
            <div>
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">Product</p>
              <ul className="space-y-2">
                {[
                  { label: 'Features', href: '#features' },
                  { label: 'Pricing',  href: '#pricing' },
                  { label: 'Agents',   href: '#agents' },
                  { label: 'Ask Kira', href: '/kira' },
                  { label: 'Roadmap',  href: '#roadmap' },
                ].map(l => (
                  <li key={l.label}><a href={l.href} className="text-[12px] text-white/30 hover:text-white/70 transition-colors">{l.label}</a></li>
                ))}
              </ul>
            </div>
            {/* Updates */}
            <div>
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">Updates</p>
              <ul className="space-y-2">
                {[
                  { label: 'Changelog',     href: '#changelog' },
                  { label: 'Roadmap',       href: '#roadmap' },
                  { label: 'Founder Story', href: '#story' },
                  { label: 'Affiliate',     href: '/affiliate' },
                ].map(l => (
                  <li key={l.label}><a href={l.href} className="text-[12px] text-white/30 hover:text-white/70 transition-colors">{l.label}</a></li>
                ))}
                <li><Link to="/docs" className="text-[12px] text-white/30 hover:text-white/70 transition-colors">Docs & Guides</Link></li>
                <li><Link to="/blog" className="text-[12px] text-white/30 hover:text-white/70 transition-colors">Blog</Link></li>
              </ul>
            </div>
            {/* Legal */}
            <div>
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">Legal</p>
              <ul className="space-y-2">
                {[
                  { label: 'Privacy', href: '/privacy' },
                  { label: 'Terms',   href: '/terms' },
                  { label: 'Contact', href: '/contact' },
                ].map(l => (
                  <li key={l.label}><Link to={l.href} className="text-[12px] text-white/30 hover:text-white/70 transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.05] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-white/20 text-[11px]">© 2026 Kraitin · Built by Israel Thompson, age 18.</p>
            <p className="text-white/15 text-[11px]">The AI Cofounder That Tells You What To Build.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
