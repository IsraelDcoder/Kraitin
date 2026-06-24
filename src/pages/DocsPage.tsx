import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Compass, FlaskConical, ShieldCheck, Users, Code2, Rocket,
  FileText, Bookmark, Sparkles, Coins, CreditCard, BookOpen,
  ChevronRight, ArrowRight, ExternalLink, Zap,
} from 'lucide-react';
import { KraitinLogo } from '@/components/ui/KraitinLogo';
import PageMeta from '@/components/common/PageMeta';
import { cn } from '@/lib/utils';

/* ── Section definitions ─────────────────────────────────────────── */
interface DocSection {
  id: string;
  icon: React.ElementType;
  title: string;
  eyebrow: string;
  summary: string;
  steps: Array<{ step: string; detail: string }>;
  tips?: string[];
  cta?: { label: string; path: string };
}

const SECTIONS: DocSection[] = [
  {
    id: 'getting-started',
    icon: Sparkles,
    eyebrow: 'Overview',
    title: 'Getting Started with Kraitin',
    summary:
      'Kraitin is your AI cofounder — a full startup intelligence platform that helps you discover validated opportunities, run deep research, analyze competitors, plan MVPs, and launch with confidence. Here\'s how to get the most out of it.',
    steps: [
      { step: 'Complete onboarding', detail: 'Set your founder profile, budget range, and skill set. Kraitin uses this to personalize opportunity scores and AI recommendations.' },
      { step: 'Browse Opportunities', detail: 'Start on the Opportunity Discovery page. Every idea is scored 0–100 based on market demand, competition, and growth velocity.' },
      { step: 'Run your first AI agent', detail: 'Pick an opportunity or type your own idea into the Research Agent. You\'ll get a full intelligence dashboard in under a minute.' },
      { step: 'Save reports to your workspace', detail: 'Every agent output can be saved to your Reports library. Revisit, compare, and share them any time.' },
    ],
    tips: [
      'Use the Command Center (dashboard) as your daily home base — it surfaces today\'s top opportunities, competitor alerts, and trending keywords automatically.',
      'Credits reset every billing cycle. Pro users get 500 credits/month — enough for ~50 full research runs.',
    ],
    cta: { label: 'Go to Dashboard', path: '/dashboard' },
  },
  {
    id: 'opportunities',
    icon: Compass,
    eyebrow: 'Opportunities Module',
    title: 'Opportunity Discovery',
    summary:
      'Browse 600+ AI-scored startup opportunities across SaaS, mobile apps, health, education, finance, productivity, and more. Every opportunity is ranked by market demand, growth rate, and competitive landscape.',
    steps: [
      { step: 'Filter by category', detail: 'Use the category chips at the top to narrow by vertical — AI, Health, Education, Finance, Mobile Apps, Productivity, or all at once.' },
      { step: 'Sort by growth or score', detail: 'The score (0–100) reflects overall opportunity quality. Growth rate shows month-over-month momentum. Hidden Gems filter surfaces high-score, low-competition niches.' },
      { step: 'Click any card to deep-dive', detail: 'Opportunity detail pages show full market context, estimated revenue, and quick-launch AI analysis buttons for Research, Validation, and MVP planning.' },
      { step: 'Save to watchlist', detail: 'Star any opportunity to add it to your Watchlist for ongoing tracking.' },
    ],
    tips: [
      'The "Hidden Gems" filter is the most valuable — these are high-potential niches that aren\'t yet saturated.',
      'Growth rate above 50% is a strong signal. Above 100% means explosive momentum.',
    ],
    cta: { label: 'Browse Opportunities', path: '/opportunities' },
  },
  {
    id: 'research-agent',
    icon: FlaskConical,
    eyebrow: 'AI Agent',
    title: 'Research Agent',
    summary:
      'The Research Agent runs a full AI-powered intelligence sweep on any startup idea. It returns market size, demand signals, competitor landscape, monetization models, founder recommendations, and a scored opportunity summary — all in under 60 seconds.',
    steps: [
      { step: 'Enter your idea', detail: 'Type a natural language description of your idea. Be specific — "An AI meal scanner app that tracks nutrition from food photos for weight loss" gets better results than "nutrition app".' },
      { step: 'Review the intelligence dashboard', detail: 'You\'ll get: Opportunity Score, Market Demand, Competition Level, TAM estimate, top competitors, monetization models, and a "green light / red flag" summary.' },
      { step: 'Use the action buttons', detail: 'After research, one-click buttons let you continue to Validation, Competitor Intel, or MVP Planning — passing your idea through automatically.' },
      { step: 'Save the report', detail: 'Click "Save Report" to store the full output in your Reports library. Reports are persistent and can be exported as JSON.' },
    ],
    tips: [
      'Research costs 5 credits per run. A Pro plan gives you ~100 research runs per month.',
      'The more context you provide, the better. Include your target market, key feature, and differentiation angle.',
      'Saved reports can be reopened later — no need to re-run research if you already have a saved analysis.',
    ],
    cta: { label: 'Open Research Agent', path: '/research' },
  },
  {
    id: 'validation',
    icon: ShieldCheck,
    eyebrow: 'AI Agent',
    title: 'Validation Agent',
    summary:
      'The Validation Agent checks whether your idea has real demand — not just theoretical interest. It cross-references Reddit threads, App Store reviews, competitor complaints, and search signals to surface whether people are actively looking for what you\'re building.',
    steps: [
      { step: 'Describe your solution', detail: 'Enter your product idea including the problem it solves and who it\'s for. The more specific the target audience, the sharper the validation data.' },
      { step: 'Review demand evidence', detail: 'You\'ll see: Reddit discussion volume, real user pain quotes, competitor gaps, willingness-to-pay signals, and a demand confidence score (0–100).' },
      { step: 'Check the red flags', detail: 'The agent explicitly calls out reasons it might not work — market saturation, weak monetization signal, or niche-too-small warnings.' },
      { step: 'Iterate on the idea', detail: 'If validation is weak, use the agent\'s suggestions to pivot the idea angle and re-run.' },
    ],
    tips: [
      'Validation costs 10 credits per run.',
      'A confidence score above 70 is a strong go signal. Below 40 means rethink the positioning.',
      'The "user pain quotes" section is gold — these are real words from real people you can use in your landing page copy.',
    ],
    cta: { label: 'Open Validation Agent', path: '/validation' },
  },
  {
    id: 'competitor-intel',
    icon: Users,
    eyebrow: 'AI Agent',
    title: 'Competitor Intelligence',
    summary:
      'The Competitor Intel agent builds a full dossier on any competitor — their pricing, feature set, estimated revenue, growth channels, social media strategy, influencer partnerships, and the gaps you can exploit.',
    steps: [
      { step: 'Enter a competitor name', detail: 'Type the name of any app, SaaS product, or company. You can also arrive here directly from an opportunity card or competitor alert on your dashboard.' },
      { step: 'Review the dossier', detail: 'The report covers: pricing tiers, feature comparison, estimated MRR, growth channels (paid ads, SEO, influencer, community), and key weaknesses.' },
      { step: 'Find the gap', detail: 'The "Attack Surface" section tells you exactly where this competitor is vulnerable — features users complain about, prices they charge too much for, and segments they ignore.' },
      { step: 'Export the report', detail: 'Save to your Reports library or export as JSON to use in pitch decks or planning docs.' },
    ],
    tips: [
      'Competitor Intel costs 10 credits per run.',
      'Run analysis on 2–3 competitors before building your MVP — the gap analysis alone can save months of wasted effort.',
      'You can deep-link to a competitor from your dashboard\'s Competitor Alerts panel — just click any competitor name.',
    ],
    cta: { label: 'Open Competitor Intel', path: '/competitors/intelligence' },
  },
  {
    id: 'mvp-planner',
    icon: Code2,
    eyebrow: 'AI Agent',
    title: 'MVP Planner',
    summary:
      'The MVP Planner generates a complete, technical MVP roadmap for your idea — feature prioritization using the MoSCoW framework, tech stack recommendation, sprint breakdown, and a launch timeline. No engineering background required.',
    steps: [
      { step: 'Input your validated idea', detail: 'Paste your idea, or pull it forward from the Research or Validation agent using the action buttons.' },
      { step: 'Review the feature matrix', detail: 'Features are ranked Must-have, Should-have, Could-have, and Won\'t-have. The Must-haves define your v1 scope.' },
      { step: 'Check the tech stack', detail: 'The agent recommends a specific stack based on your idea type, team size, and budget. It explains why each choice was made.' },
      { step: 'Review the sprint plan', detail: 'A week-by-week sprint breakdown with concrete deliverables gets you from zero to launch-ready.' },
    ],
    tips: [
      'MVP Planner costs 10 credits per run.',
      'Use the "Could-have" features as your v2 backlog — don\'t build them in v1.',
      'If you already have a tech preference, mention it in your idea description (e.g. "using React and Supabase") and the agent will adapt.',
    ],
    cta: { label: 'Open MVP Planner', path: '/mvp-planner' },
  },
  {
    id: 'launch-agent',
    icon: Rocket,
    eyebrow: 'AI Agent',
    title: 'Launch Agent',
    summary:
      'The Launch Agent creates a complete go-to-market strategy — distribution channels, launch copy, community seeding plan, influencer list, early adopter strategy, and a 30-day launch checklist tailored to your product.',
    steps: [
      { step: 'Describe your product and audience', detail: 'Enter your product name, what it does, who it\'s for, and your pricing model. The agent uses this to tailor every output to your specific go-to-market.' },
      { step: 'Review distribution channels', detail: 'You\'ll get a ranked list of channels (Product Hunt, Reddit, Twitter/X, LinkedIn, TikTok, newsletters) with specific playbooks for each.' },
      { step: 'Copy the launch messaging', detail: 'Pre-written Product Hunt taglines, Twitter thread starters, LinkedIn post hooks, and cold email templates are all included.' },
      { step: 'Follow the 30-day checklist', detail: 'A day-by-day action plan from pre-launch buzz-building to post-launch retention loops.' },
    ],
    tips: [
      'Launch Agent costs 10 credits per run.',
      'Run this 2 weeks before your intended launch date — some tasks (building waitlist, community seeding) need time.',
      'The influencer list section suggests micro-influencers in your niche. Outreach while building your product for authentic reviews.',
    ],
    cta: { label: 'Open Launch Agent', path: '/launch-agent' },
  },
  {
    id: 'teardown',
    icon: FileText,
    eyebrow: 'AI Agent',
    title: 'Startup Teardown',
    summary:
      'Startup Teardown gives you a reverse-engineered breakdown of any successful product — how it grew, how it monetizes, what its playbook looks like, and what you can steal. Learn from $10M+ products before you build.',
    steps: [
      { step: 'Pick a startup to analyze', detail: 'Enter a product name or URL. Works best with established consumer apps, B2B SaaS products, and marketplace businesses.' },
      { step: 'Review the growth playbook', detail: 'The teardown covers: founding story, growth levers, monetization model, key metrics milestones, and the specific tactics that drove scale.' },
      { step: 'Extract the lessons', detail: 'The "Steal This" section calls out tactics directly applicable to early-stage founders building in a similar space.' },
      { step: 'Apply to your own roadmap', detail: 'Use the insights to shape your own positioning, pricing, and growth strategy before you build.' },
    ],
    tips: [
      'Teardown costs 15 credits per run — it\'s the most in-depth analysis in the platform.',
      'Start by tearing down your top 2–3 competitors. Then look at adjacent successful products for growth inspiration.',
    ],
    cta: { label: 'Open Startup Teardown', path: '/teardown' },
  },
  {
    id: 'kira',
    icon: Sparkles,
    eyebrow: 'AI Advisor',
    title: 'Kira — Your AI Advisor',
    summary:
      'Kira is your always-on AI cofounder. Unlike the specialist agents, Kira remembers your context across sessions and can answer any founder question — from pricing strategy to hiring decisions to investor positioning. Think of Kira as a senior advisor on call 24/7.',
    steps: [
      { step: 'Start a conversation', detail: 'Open Kira from the sidebar. You can type any question or describe what you\'re trying to figure out. Kira has memory — she remembers what you\'ve discussed before.' },
      { step: 'Reference your ideas and context', detail: 'Kira is aware of your founder profile and preferences. Mention "my idea" or "the app I\'m building" and she\'ll respond in that context.' },
      { step: 'Ask for second opinions', detail: 'Use Kira to pressure-test decisions. "Should I charge $49/month or $29/month?" or "What\'s the biggest risk with my go-to-market plan?" are both great prompts.' },
      { step: 'Use the chat history', detail: 'All conversations are saved. Scroll back to revisit earlier advice or continue threads from previous sessions.' },
    ],
    tips: [
      'Kira works best for strategic, open-ended questions. For structured analysis (market research, validation), use the dedicated agents.',
      'Start sessions with context: "I\'m building X for Y audience, currently at Z stage. I need help with..."',
    ],
    cta: { label: 'Talk to Kira', path: '/kira' },
  },
  {
    id: 'blueprint',
    icon: Bookmark,
    eyebrow: 'AI Agent',
    title: 'Blueprint Generator',
    summary:
      'Blueprint takes your idea and generates a formatted, exportable startup blueprint — a single document combining your market research, validation summary, MVP scope, tech stack, and 30-day launch plan into a shareable artifact.',
    steps: [
      { step: 'Enter your idea', detail: 'Provide your startup concept. The more context you give, the more tailored the blueprint.' },
      { step: 'Review the full blueprint', detail: 'The output is structured as: Problem → Solution → Market → Competition → MVP → Tech Stack → Go-to-Market → Financials → Risks.' },
      { step: 'Export or share', detail: 'Download as JSON or share a read-only link. Blueprints are perfect for co-founders, investors, and early team members.' },
      { step: 'Save to workspace', detail: 'Blueprints are saved to your Reports library alongside your other agent outputs.' },
    ],
    tips: [
      'Blueprint costs 15 credits. It\'s the most comprehensive single output on the platform.',
      'Great for creating a "pitch deck substitute" when talking to early angels or accelerator programs.',
    ],
    cta: { label: 'Open Blueprint Generator', path: '/blueprint' },
  },
  {
    id: 'credits',
    icon: Coins,
    eyebrow: 'Credits & Usage',
    title: 'Credits & Usage',
    summary:
      'Kraitin uses a credit system to manage AI agent usage. Pro users receive 500 credits per billing cycle. Free users have limited access. Credits are deducted per agent run.',
    steps: [
      { step: 'Check your balance', detail: 'Your credit balance is always visible in the sidebar footer and on the Billing page. A low-balance warning appears when you have under 20% remaining.' },
      { step: 'Understand per-agent costs', detail: 'Research: 5 credits · Validation: 10 credits · Competitor Intel: 10 credits · MVP Planner: 10 credits · Launch Agent: 10 credits · Teardown: 15 credits · Blueprint: 15 credits · Kira chat: 1 credit/message.' },
      { step: 'Credits reset monthly', detail: 'On your billing anniversary date, credits reset to 500 (Pro) or 0 (Free). Unused credits do not roll over.' },
      { step: 'Upgrade for more', detail: 'If you hit your limit, visit the Billing page to upgrade or wait for your next reset.' },
    ],
    tips: [
      'A Pro plan gives ~50 full research runs per month — more than enough for active founders building 1–2 products.',
      'Credits are never charged for failed or interrupted runs.',
    ],
    cta: { label: 'View Billing', path: '/billing' },
  },
  {
    id: 'billing',
    icon: CreditCard,
    eyebrow: 'Billing',
    title: 'Billing & Plans',
    summary:
      'Kraitin offers a Free tier and a Pro plan. The Free tier gives you access to the Opportunity Discovery feed. Pro unlocks all AI agents, workspace tools, saved reports, watchlists, and 500 monthly credits.',
    steps: [
      { step: 'Free tier', detail: 'Access to the Opportunity Discovery database (600+ ideas), trending opportunities, and basic search & filtering. No AI agents.' },
      { step: 'Pro plan — $49/month or $490/year', detail: 'All 7 AI agents, Kira AI Advisor, workspace, saved reports, watchlists, exports, and 500 credits per month. Cancel anytime.' },
      { step: 'Managing your subscription', detail: 'Visit the Billing page to upgrade, downgrade, or cancel. Stripe powers all payments — Kraitin never stores your card details.' },
      { step: 'Cancellation policy', detail: 'Cancel anytime — you keep Pro access until the end of your current billing period. No penalties.' },
    ],
    tips: [
      'The annual plan saves 17% ($490 vs $588 monthly). Best for founders committing to building something serious.',
      'If you\'re between ideas, cancel and re-subscribe when you need the agents again.',
    ],
    cta: { label: 'Manage Billing', path: '/billing' },
  },
];

/* ── Sidebar nav ─────────────────────────────────────────────────── */
function DocsSidebar({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  return (
    <nav className="space-y-0.5">
      {SECTIONS.map(({ id, icon: Icon, title, eyebrow }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all group',
            activeId === id
              ? 'bg-[#C5FF00]/[0.08] text-[#C5FF00]'
              : 'text-white/30 hover:text-white/65 hover:bg-white/[0.04]'
          )}
        >
          <Icon className={cn('w-3.5 h-3.5 shrink-0', activeId === id ? 'text-[#C5FF00]' : 'text-white/25 group-hover:text-white/50')} />
          <div className="min-w-0 flex-1">
            <p className={cn('text-[11px] font-medium truncate', activeId === id ? 'text-[#C5FF00]' : '')}>{title}</p>
            <p className="text-[10px] text-white/20 truncate">{eyebrow}</p>
          </div>
          {activeId === id && <ChevronRight className="w-3 h-3 shrink-0 text-[#C5FF00]/60" />}
        </button>
      ))}
    </nav>
  );
}

/* ── Section renderer ────────────────────────────────────────────── */
function SectionCard({ section }: { section: DocSection }) {
  const navigate = useNavigate();
  const Icon = section.icon;
  return (
    <article id={section.id} className="scroll-mt-24 space-y-6 pb-16 border-b border-white/[0.05] last:border-0">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#C5FF00]/10 border border-[#C5FF00]/15 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#C5FF00]" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-1">{section.eyebrow}</p>
          <h2 className="text-xl font-bold text-white text-balance">{section.title}</h2>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-white/55 leading-relaxed text-pretty">{section.summary}</p>

      {/* Steps */}
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/20">How it works</p>
        <div className="space-y-2">
          {section.steps.map(({ step, detail }, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="w-5 h-5 rounded-full bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-[#C5FF00]">{i + 1}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/75 text-balance">{step}</p>
                <p className="text-xs text-white/35 mt-1 leading-relaxed text-pretty">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      {section.tips && section.tips.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/20">Pro tips</p>
          <div className="space-y-2">
            {section.tips.map((tip, i) => (
              <div key={i} className="flex gap-2.5 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <Zap className="w-3.5 h-3.5 text-[#C5FF00]/50 shrink-0 mt-0.5" />
                <p className="text-xs text-white/40 leading-relaxed text-pretty">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      {section.cta && (
        <button
          onClick={() => navigate(section.cta!.path)}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 text-sm font-semibold text-[#C5FF00] hover:bg-[#C5FF00]/15 transition-all"
        >
          {section.cta.label}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </article>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function DocsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Scroll to anchor on mount / hash change
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        setActiveId(hash);
      }
    }
  }, [location.hash]);

  // Track active section via IntersectionObserver
  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const handleSelect = (id: string) => {
    setActiveId(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    navigate(`/docs#${id}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#080a0e] text-white">
      <PageMeta
        title="Docs & Guides — Kraitin"
        description="Learn how to use Kraitin's AI agents — Research, Validation, Competitor Intel, MVP Planner, Launch Agent, Teardown, Kira, and more."
        ogUrl="https://kraitin.com/docs"
      />

      {/* Top nav */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-14 border-b border-white/[0.06] bg-[#080a0e]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <KraitinLogo size="sm" />
          <span className="text-white/20 text-sm">/</span>
          <span className="text-sm text-white/50 font-medium">Docs & Guides</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-xs text-white/30 hover:text-white/60 transition-colors hidden md:block">
            Dashboard
          </Link>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#C5FF00]/10 border border-[#C5FF00]/20 text-xs font-semibold text-[#C5FF00] hover:bg-[#C5FF00]/15 transition-all"
          >
            Back to app <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex gap-0">
        {/* Sticky left sidebar — desktop only */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto py-8 px-4 border-r border-white/[0.05]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 px-3 mb-3">Contents</p>
          <DocsSidebar activeId={activeId} onSelect={handleSelect} />
        </aside>

        {/* Main content */}
        <main
          ref={scrollRef}
          className="flex-1 min-w-0 px-6 md:px-12 py-12 space-y-16"
        >
          {/* Hero */}
          <div className="pb-8 border-b border-white/[0.05]">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#C5FF00]/10 border border-[#C5FF00]/15 flex items-center justify-center">
                <BookOpen className="w-4.5 h-4.5 text-[#C5FF00]" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/25">Documentation</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white text-balance mb-3">
              Docs & Guides
            </h1>
            <p className="text-sm text-white/40 max-w-xl text-pretty leading-relaxed">
              Everything you need to get from idea to launch using Kraitin's AI agents, opportunity database, and workspace tools.
            </p>
            {/* Mobile section picker */}
            <div className="flex flex-wrap gap-2 mt-6 lg:hidden">
              {SECTIONS.map(({ id, title, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleSelect(id)}
                  className={cn(
                    'flex items-center gap-1.5 h-7 px-3 rounded-full border text-[11px] font-medium transition-all',
                    activeId === id
                      ? 'border-[#C5FF00]/30 bg-[#C5FF00]/10 text-[#C5FF00]'
                      : 'border-white/[0.08] text-white/30 hover:text-white/60 hover:border-white/20'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {title.split(' ').slice(0, 2).join(' ')}
                </button>
              ))}
            </div>
          </div>

          {/* All sections */}
          <div className="space-y-16 pt-4">
            {SECTIONS.map(section => (
              <SectionCard key={section.id} section={section} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
