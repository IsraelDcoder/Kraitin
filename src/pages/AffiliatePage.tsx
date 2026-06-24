import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, Link2, BarChart2, ChevronDown, ChevronUp,
  Zap, Users, TrendingUp, Clock, Shield, Gift,
  MousePointer, UserCheck, PlayCircle, CreditCard,
  ArrowUpRight, Check,
} from 'lucide-react';

/* ─── CONSTANTS ─────────────────────────────────────────── */
const COMMISSION_RATE = 0.30;
const MONTHLY_PRICE = 49; // Actual plan price
const PER_CUSTOMER = MONTHLY_PRICE * COMMISSION_RATE; // $29.70

const EXAMPLE_ROWS = [5, 10, 25, 50, 100, 250, 500];

const WHY_CARDS = [
  { icon: DollarSign, title: '30% Recurring Revenue', desc: 'Earn commissions for the lifetime of every customer you refer. Not a one-time payment.' },
  { icon: Clock, title: '90-Day Attribution Window', desc: 'Referrals have 90 days to explore and convert — your cookie and localStorage both track attribution.' },
  { icon: TrendingUp, title: 'High Converting Product', desc: 'Founders actively search for startup validation tools. Kraitin speaks directly to the pain.' },
  { icon: BarChart2, title: 'Real-Time Analytics', desc: 'Track clicks, conversions, trials started, and earnings from a live dashboard.' },
  { icon: Shield, title: 'Reliable Monthly Payouts', desc: 'Consistent payments every month with transparent reporting and no hidden deductions.' },
  { icon: Gift, title: 'Affiliate Resources', desc: 'Marketing assets, banners, swipe copy, screenshots, and launch guides included.' },
];

const WHO_CARDS = [
  { title: 'Startup Content Creators', desc: 'YouTube creators, founders, podcasters, and startup educators.' },
  { title: 'Indie Hackers', desc: 'Share Kraitin with other builders and earn recurring revenue passively.' },
  { title: 'Startup Communities', desc: 'Monetize founder audiences while providing genuine, actionable value.' },
  { title: 'Growth Consultants', desc: 'Recommend Kraitin to clients and earn monthly commissions on every seat.' },
  { title: 'Newsletter Owners', desc: 'Earn from founder-focused newsletters and highly engaged audiences.' },
  { title: 'AI & SaaS Influencers', desc: 'Perfect fit for startup and AI audiences who demand quality tools.' },
];

// Dashboard preview metrics are illustrative examples only — live data lives in /affiliate/dashboard
const DASHBOARD_METRIC_LABELS = [
  { label: 'Total Clicks',        example: '4,800+' },
  { label: 'Signups',             example: '300+' },
  { label: 'Paid Customers',      example: '80+' },
  { label: 'MRR Generated',       example: '$3,900+' },
  { label: 'Monthly Commission',  example: '$1,170+' },
  { label: 'Lifetime Earnings',   example: '$14,000+' },
  { label: 'Conversion Rate',     example: '25%+' },
  { label: 'Cookie Duration',     example: '90 days' },
];

const FAQS = [
  { q: 'How much can I earn?', a: 'There is no earning cap. The more founders you refer who stay subscribed, the more you earn — indefinitely.' },
  { q: 'When do payouts happen?', a: 'Payouts are processed monthly, typically within the first week of each month for the prior month\'s commissions.' },
  { q: 'How are commissions calculated?', a: `30% of every recurring payment your referral makes. If they pay $${MONTHLY_PRICE}/month, you earn $${(MONTHLY_PRICE * 0.30).toFixed(2)} every month they remain subscribed.` },
  { q: 'Do I need to be a Kraitin customer?', a: 'No. Anyone can apply to become an affiliate regardless of whether they use Kraitin themselves.' },
  { q: 'How long does attribution last?', a: 'Your referral cookie and localStorage attribution last 90 days from the time someone clicks your link.' },
  { q: 'Can I refer unlimited customers?', a: 'Yes. There are no referral caps or earning limits of any kind.' },
  { q: 'What promotional assets are provided?', a: 'You receive banners in multiple sizes, email swipe copy, social media templates, product screenshots, demo videos, and launch guides.' },
];

const SOCIAL_LOGOS = ['Buildspace', 'IndieHackers', 'Product Hunt', 'Y Combinator', 'AngelList', 'Hacker News'];

/* ─── ANIMATED BG ────────────────────────────────────────── */
function AnimatedBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* primary lime glow — top center */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-[#C5FF00]/[0.05] blur-[140px] animate-pulse-glow" />
      {/* secondary blue glow — bottom right */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-[#5B8CFF]/[0.04] blur-[120px]" />
      {/* fine grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />
    </div>
  );
}

/* ─── FLOATING STAT CARD ─────────────────────────────────── */
function FloatCard({ label, value, delay = 0 }: { label: string; value: string; delay?: number }) {
  return (
    <div
      className="animate-float rounded-2xl border border-white/[0.08] px-5 py-4 backdrop-blur-md"
      style={{
        background: 'rgba(255,255,255,0.03)',
        animationDelay: `${delay}s`,
        animationDuration: `${4 + delay * 0.5}s`,
      }}
    >
      <p className="text-[#C5FF00] text-2xl font-black">{value}</p>
      <p className="text-white/40 text-xs mt-0.5">{label}</p>
    </div>
  );
}

/* ─── SECTION WRAPPER ────────────────────────────────────── */
const Section = React.forwardRef<HTMLElement, { children: React.ReactNode; className?: string; style?: React.CSSProperties }>(
  ({ children, className = '', style }, ref) => (
    <section ref={ref} className={`relative py-24 md:py-32 ${className}`} style={style}>
      {children}
    </section>
  )
);

/* ─── SCROLL COUNTER ─────────────────────────────────────── */
function useCountUp(target: number, duration = 600) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.round(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

/* ─── EARNINGS CALCULATOR ────────────────────────────────── */
function EarningsCalculator() {
  const [referrals, setReferrals] = useState(25);
  const monthly = referrals * PER_CUSTOMER;
  const annual = monthly * 12;
  const displayMonthly = useCountUp(Math.round(monthly), 400);
  const displayAnnual = useCountUp(Math.round(annual), 400);

  return (
    <div className="rounded-2xl border border-white/[0.08] overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div className="p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:items-end gap-8 mb-10">
          {/* slider */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-white/50">Active Referrals</label>
              <span className="text-[#C5FF00] font-black text-2xl">{referrals}</span>
            </div>
            <input
              type="range" min={1} max={500} value={referrals}
              onChange={(e) => setReferrals(Number(e.target.value))}
              className="w-full accent-[#C5FF00] h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-white/20 mt-1.5">
              <span>1</span><span>500</span>
            </div>
          </div>
          {/* output cards */}
          <div className="flex gap-4 shrink-0">
            <div className="text-center">
              <p className="text-xs text-white/40 mb-1">Monthly</p>
              <p className="text-3xl font-black text-white">${displayMonthly.toLocaleString()}</p>
            </div>
            <div className="w-px bg-white/[0.08]" />
            <div className="text-center">
              <p className="text-xs text-white/40 mb-1">Annual</p>
              <p className="text-3xl font-black text-[#C5FF00]">${displayAnnual.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* example table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-2 pr-4 text-white/30 font-medium">Customers</th>
                <th className="text-right py-2 pr-4 text-white/30 font-medium">Monthly Revenue</th>
                <th className="text-right py-2 text-white/30 font-medium">Annual Revenue</th>
              </tr>
            </thead>
            <tbody>
              {EXAMPLE_ROWS.map((n) => {
                const mo = n * PER_CUSTOMER;
                const yr = mo * 12;
                const isActive = referrals >= n && (EXAMPLE_ROWS[EXAMPLE_ROWS.indexOf(n) + 1] === undefined || referrals < EXAMPLE_ROWS[EXAMPLE_ROWS.indexOf(n) + 1]);
                return (
                  <tr
                    key={n}
                    className={`border-b border-white/[0.04] transition-colors ${isActive ? 'bg-[#C5FF00]/[0.04]' : 'hover:bg-white/[0.02]'}`}
                  >
                    <td className={`py-3 pr-4 font-medium ${isActive ? 'text-[#C5FF00]' : 'text-white/60'}`}>{n} customers</td>
                    <td className={`py-3 pr-4 text-right font-mono ${isActive ? 'text-[#C5FF00] font-bold' : 'text-white/50'}`}>
                      ${mo.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                    </td>
                    <td className={`py-3 text-right font-mono ${isActive ? 'text-[#C5FF00] font-bold' : 'text-white/40'}`}>
                      ${yr.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/yr
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-white/25 text-xs mt-5 text-center">
          As long as your referrals stay subscribed, your commissions continue — month after month.
        </p>
      </div>
    </div>
  );
}

/* ─── FAQ ACCORDION ──────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full py-5 text-left gap-4 group"
      >
        <span className="text-sm md:text-base font-semibold text-white/80 group-hover:text-white transition-colors">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-[#C5FF00] shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/30 shrink-0 group-hover:text-white/60 transition-colors" />}
      </button>
      {open && (
        <p className="text-sm text-white/50 pb-5 leading-relaxed pr-8">{a}</p>
      )}
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────── */
export default function AffiliatePage() {
  const calcRef = useRef<HTMLElement>(null);

  const scrollToCalc = () => {
    calcRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-black text-white font-montserrat overflow-x-hidden">

      {/* ── NAV ────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06]" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#C5FF00] flex items-center justify-center">
              <span className="text-black font-black text-sm">K</span>
            </div>
            <span className="font-bold text-white/80 text-sm">kraitin</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/40">
            <Link to="/" className="hover:text-white/70 transition-colors">Product</Link>
            <Link to="/login?tab=register" className="hover:text-white/70 transition-colors">Pricing</Link>
            <Link to="/affiliate" className="text-[#C5FF00]">Affiliate</Link>
          </div>
          <Link
            to="/login?tab=register"
            className="inline-flex items-center gap-1.5 bg-[#C5FF00] text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#C5FF00]/90 transition-all"
          >
            Join Program <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 overflow-hidden">
        <AnimatedBg />
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* badge */}
          <div className="inline-flex items-center gap-2 border border-[#C5FF00]/20 bg-[#C5FF00]/[0.06] rounded-full px-4 py-1.5 text-xs font-semibold text-[#C5FF00] mb-8">
            <DollarSign className="w-3.5 h-3.5" />
            Affiliate Program
          </div>

          <h1 className="text-4xl md:text-6xl font-black leading-[1.08] tracking-tight mb-6 text-balance">
            Earn 30% Recurring Revenue<br />
            <span className="text-[#C5FF00]">for Every Founder You Refer</span>
          </h1>

          <p className="text-white/50 text-lg md:text-xl leading-relaxed mb-4 max-w-2xl mx-auto text-pretty">
            Promote Kraitin — the AI Cofounder founders use to discover opportunities,
            validate ideas, analyze competitors, and launch faster.
            Get paid every month for every customer you bring.
          </p>
          <p className="text-white/25 text-sm mb-10 flex items-center justify-center gap-3 flex-wrap">
            <span>No caps.</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>No limits.</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>No expiration.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link
              to="/login?tab=register"
              className="inline-flex items-center gap-2 bg-[#C5FF00] text-black font-bold text-base px-8 py-4 rounded-xl hover:bg-[#C5FF00]/90 transition-all hover:shadow-[0_0_40px_rgba(197,255,0,0.35)] hover:scale-[1.02] w-full sm:w-auto justify-center"
            >
              <Zap className="w-4 h-4" />
              Join Affiliate Program
            </Link>
            <button
              onClick={scrollToCalc}
              className="inline-flex items-center gap-2 border border-white/[0.1] bg-white/[0.04] text-white/70 hover:text-white hover:border-white/20 font-semibold text-base px-8 py-4 rounded-xl transition-all w-full sm:w-auto justify-center"
            >
              <BarChart2 className="w-4 h-4" />
              View Earnings Calculator
            </button>
          </div>

          {/* hero stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <FloatCard value="30%" label="Recurring Commission" delay={0} />
            <FloatCard value="30 Days" label="Cookie Window" delay={0.5} />
            <FloatCard value="Monthly" label="Payouts" delay={1} />
            <FloatCard value="∞" label="Earning Potential" delay={1.5} />
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ───────────────────────────────────── */}
      <Section className="border-y border-white/[0.05]" style={{ background: 'rgba(255,255,255,0.01)' } as React.CSSProperties}>
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-white/25 text-xs uppercase tracking-widest mb-10">Trusted by Founders Building the Next Generation of Startups</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {SOCIAL_LOGOS.map((name) => (
              <div key={name} className="flex items-center justify-center border border-white/[0.06] rounded-xl px-4 py-4 bg-white/[0.02] hover:border-white/[0.1] transition-colors">
                <span className="text-white/25 text-xs font-semibold text-center">{name}</span>
              </div>
            ))}
          </div>
          {/* founder metrics strip */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { metric: '12,000+', label: 'Active Founders' },
              { metric: '$2.4M+', label: 'Opportunities Discovered' },
              { metric: '94%', label: 'Founder Satisfaction Rate' },
            ].map(({ metric, label }) => (
              <div key={label} className="text-center py-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-3xl font-black text-white">{metric}</p>
                <p className="text-white/40 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <Section>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#C5FF00] text-xs font-semibold uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-black text-balance">Start Earning in Three Simple Steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: UserCheck,
                title: 'Create Your Affiliate Account',
                desc: 'Create your account in less than a minute and get your unique referral link instantly.',
              },
              {
                step: '02',
                icon: Link2,
                title: 'Share Your Unique Link',
                desc: 'Promote through X, LinkedIn, YouTube, newsletters, communities, and blogs.',
              },
              {
                step: '03',
                icon: DollarSign,
                title: 'Earn Every Month',
                desc: 'Get 30% commission every time your referrals pay — not once, but every month they stay subscribed.',
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div
                key={step}
                className="relative rounded-2xl border border-white/[0.06] p-8 bg-white/[0.02] hover:border-white/[0.1] transition-all group opacity-0 intersect:opacity-100 intersect:translate-y-0 translate-y-4 duration-700"
              >
                <div className="absolute top-6 right-6 text-[#C5FF00]/10 font-black text-5xl leading-none select-none">{step}</div>
                <div className="w-10 h-10 rounded-xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-[#C5FF00]" />
                </div>
                <p className="text-xs text-[#C5FF00]/60 font-semibold uppercase tracking-widest mb-2">Step {step}</p>
                <h3 className="font-bold text-white mb-3">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── WHY PROMOTE ────────────────────────────────────── */}
      <Section style={{ background: 'rgba(255,255,255,0.01)' } as React.CSSProperties} className="border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#C5FF00] text-xs font-semibold uppercase tracking-widest mb-3">Why Promote Kraitin</p>
            <h2 className="text-3xl md:text-4xl font-black text-balance">Built for Long-Term Recurring Income</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHY_CARDS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/[0.06] p-6 bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.03] transition-all group h-full opacity-0 intersect:opacity-100 duration-700"
              >
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4 group-hover:border-[#C5FF00]/30 group-hover:bg-[#C5FF00]/[0.06] transition-all">
                  <Icon className="w-4.5 h-4.5 text-[#C5FF00]" />
                </div>
                <h3 className="font-bold text-white text-sm mb-2">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── EARNINGS CALCULATOR ────────────────────────────── */}
      <Section ref={calcRef as React.RefObject<HTMLElement>}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[#C5FF00] text-xs font-semibold uppercase tracking-widest mb-3">Earnings Calculator</p>
            <h2 className="text-3xl md:text-4xl font-black text-balance">See What You Could Earn</h2>
            <p className="text-white/40 text-sm mt-3">
              Based on ${MONTHLY_PRICE}/mo plan · {(COMMISSION_RATE * 100).toFixed(0)}% commission = ${PER_CUSTOMER}/customer/month
            </p>
          </div>
          <EarningsCalculator />
        </div>
      </Section>

      {/* ── WHO SHOULD JOIN ────────────────────────────────── */}
      <Section style={{ background: 'rgba(255,255,255,0.01)' } as React.CSSProperties} className="border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#C5FF00] text-xs font-semibold uppercase tracking-widest mb-3">Who Should Join</p>
            <h2 className="text-3xl md:text-4xl font-black">Perfect For</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHO_CARDS.map(({ title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/[0.06] p-6 bg-white/[0.02] hover:border-[#C5FF00]/20 hover:bg-[#C5FF00]/[0.02] transition-all h-full opacity-0 intersect:opacity-100 duration-700"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5FF00]" />
                  <h3 className="font-bold text-white text-sm">{title}</h3>
                </div>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── DASHBOARD PREVIEW ──────────────────────────────── */}
      <Section>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[#C5FF00] text-xs font-semibold uppercase tracking-widest mb-3">Affiliate Dashboard</p>
            <h2 className="text-3xl md:text-4xl font-black text-balance">Track Everything in Real Time</h2>
          </div>

          {/* dashboard mockup */}
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)' }}>
            {/* mock toolbar */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
              </div>
              <div className="flex-1 h-5 rounded-md bg-white/[0.04] max-w-xs" />
              <div className="w-20 h-5 rounded-md bg-white/[0.04]" />
            </div>
            {/* metrics grid */}
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {DASHBOARD_METRIC_LABELS.map(({ label, example }) => (
                <div key={label} className="rounded-xl border border-white/[0.06] p-4 bg-white/[0.02]">
                  <p className="text-white/35 text-xs mb-2">{label}</p>
                  <p className="text-white font-black text-xl">{example}</p>
                  <p className="text-white/20 text-[10px] mt-1">example</p>
                </div>
              ))}
            </div>
            {/* mock chart bar */}
            <div className="px-6 pb-6">
              <div className="rounded-xl border border-white/[0.06] p-5 bg-white/[0.02]">
                <div className="flex items-end justify-between gap-1.5 h-20">
                  {[30, 45, 35, 60, 50, 70, 65, 80, 72, 90, 85, 100].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm bg-[#C5FF00]/20 hover:bg-[#C5FF00]/40 transition-colors" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m) => (
                    <span key={m} className="text-[9px] text-white/20">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <Section style={{ background: 'rgba(255,255,255,0.01)' } as React.CSSProperties} className="border-y border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[#C5FF00] text-xs font-semibold uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-black">Common Questions</h2>
          </div>
          <div>
            {FAQS.map(({ q, a }) => <FaqItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </Section>

      {/* ── FINAL CTA ──────────────────────────────────────── */}
      <Section>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="relative rounded-3xl border border-white/[0.08] p-12 md:p-16 overflow-hidden" style={{ background: 'rgba(197,255,0,0.03)' }}>
            {/* bg glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[400px] h-[200px] rounded-full bg-[#C5FF00]/[0.06] blur-[80px]" />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#C5FF00] flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(197,255,0,0.4)]">
                <DollarSign className="w-7 h-7 text-black" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-4 text-balance">
                Start Building Recurring Revenue Today
              </h2>
              <p className="text-white/50 text-lg mb-8 max-w-lg mx-auto text-pretty">
                Join the Kraitin Affiliate Program and earn every month by helping founders discover better startup opportunities.
              </p>
              {/* feature list */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-8 text-sm text-white/50">
                {['Free to join', '30% recurring commission', 'Monthly payouts', 'No limits'].map((feat) => (
                  <span key={feat} className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#C5FF00]" />
                    {feat}
                  </span>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/login?tab=register"
                  className="inline-flex items-center gap-2 bg-[#C5FF00] text-black font-bold text-base px-8 py-4 rounded-xl hover:bg-[#C5FF00]/90 transition-all hover:shadow-[0_0_40px_rgba(197,255,0,0.35)] hover:scale-[1.02] w-full sm:w-auto justify-center"
                >
                  <Zap className="w-4 h-4" />
                  Join Affiliate Program
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 border border-white/[0.1] bg-white/[0.04] text-white/70 hover:text-white hover:border-white/20 font-semibold text-base px-8 py-4 rounded-xl transition-all w-full sm:w-auto justify-center"
                >
                  Contact Partnerships
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#C5FF00] flex items-center justify-center">
              <span className="text-black font-black text-sm">K</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm">kraitin</p>
              <p className="text-white/25 text-xs">The AI Cofounder That Tells You What To Build</p>
            </div>
          </div>
          <div className="flex items-center gap-6 flex-wrap justify-center text-sm text-white/35">
            <Link to="/" className="hover:text-white/60 transition-colors">Product</Link>
            <Link to="/login?tab=register" className="hover:text-white/60 transition-colors">Pricing</Link>
            <Link to="/affiliate" className="text-[#C5FF00]/70 hover:text-[#C5FF00] transition-colors">Affiliate</Link>
            <Link to="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
            <Link to="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
          </div>
          <p className="text-white/20 text-xs">© 2026 Kraitin</p>
        </div>
      </footer>
    </div>
  );
}
