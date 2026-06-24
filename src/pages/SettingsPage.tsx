import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  User, Sparkles, Compass, Bell, Plug, Layout, CreditCard,
  Shield, Database, ChevronRight, Check, Camera, Globe, Link,
  Twitter, Linkedin, Building2, AlertTriangle, Download,
  RefreshCw, LogOut, Zap, Star, TrendingUp, Save, X,
  Activity, DollarSign, Brain, Settings,
} from 'lucide-react';

/* ── Nav sections ───────────────────────────────────────────── */
const NAV_SECTIONS = [
  { id: 'profile',       label: 'Profile',             icon: User },
  { id: 'preferences',   label: 'Founder Preferences', icon: Sparkles },
  { id: 'ai-cofounder',  label: 'AI Cofounder',        icon: Brain },
  { id: 'opportunity',   label: 'Opportunity Feed',    icon: Compass },
  { id: 'notifications', label: 'Notifications',       icon: Bell },
  { id: 'integrations',  label: 'Integrations',        icon: Plug },
  { id: 'workspace',     label: 'Workspace',           icon: Layout },
  { id: 'billing',       label: 'Billing',             icon: CreditCard },
  { id: 'security',      label: 'Security',            icon: Shield },
  { id: 'privacy',       label: 'Data & Privacy',      icon: Database },
];

/* ── Design atoms ───────────────────────────────────────────── */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-black text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-[13px] text-white/35 mt-1 leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-white/[0.07] bg-[#0a0b0f] p-5', className)}>
      {children}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-2">
      {children}{required && <span className="text-[#C5FF00]/60 ml-1">*</span>}
    </label>
  );
}

function Divider() {
  return <div className="h-px bg-white/[0.04] my-6" />;
}

function ToggleRow({ label, description, value, onChange }: {
  label: string; description?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-white/70">{label}</p>
        {description && <p className="text-[11px] text-white/30 mt-0.5">{description}</p>}
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        className="shrink-0 data-[state=checked]:bg-[#C5FF00] data-[state=checked]:[--switch-thumb-color:#000]"
      />
    </div>
  );
}

function ChipSelect({ options, selected, onChange, multi = true }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void; multi?: boolean;
}) {
  const toggle = (opt: string) => {
    if (multi) {
      onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
    } else {
      onChange(selected[0] === opt ? [] : [opt]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt} onClick={() => toggle(opt)}
          className={cn('h-7 px-3 rounded-full border text-xs font-medium transition-all',
            selected.includes(opt)
              ? 'bg-[#C5FF00]/10 border-[#C5FF00]/30 text-[#C5FF00]'
              : 'border-white/[0.07] text-white/35 hover:border-white/20 hover:text-white/65')}>
          {selected.includes(opt) && <span className="mr-1">✓</span>}
          {opt}
        </button>
      ))}
    </div>
  );
}

function RadioCard({ options, value, onChange }: {
  options: Array<{ key: string; label: string; desc?: string }>;
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map(opt => (
        <button key={opt.key} onClick={() => onChange(opt.key)}
          className={cn('text-left p-3.5 rounded-xl border transition-all',
            value === opt.key
              ? 'bg-[#C5FF00]/[0.06] border-[#C5FF00]/25 text-[#C5FF00]'
              : 'border-white/[0.06] text-white/50 hover:border-white/15 hover:text-white/75')}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold">{opt.label}</span>
            {value === opt.key && <Check className="w-3.5 h-3.5 text-[#C5FF00]" />}
          </div>
          {opt.desc && <p className="text-[11px] text-white/30 mt-1 leading-snug">{opt.desc}</p>}
        </button>
      ))}
    </div>
  );
}

function IntegrationRow({ name, icon, connected, lastSync }: {
  name: string; icon: string; connected: boolean; lastSync?: string;
}) {
  const [state, setState] = useState(connected);
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-base shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-medium text-white/75">{name}</p>
          {state && lastSync && <p className="text-[10px] text-white/25 mt-0.5">Synced {lastSync}</p>}
          {!state && <p className="text-[10px] text-white/20 mt-0.5">Not connected</p>}
        </div>
      </div>
      <button onClick={() => setState(s => !s)}
        className={cn('h-7 px-3 rounded-lg border text-[11px] font-semibold transition-all',
          state
            ? 'border-white/[0.08] text-white/35 hover:border-red-400/30 hover:text-red-400'
            : 'border-[#C5FF00]/25 text-[#C5FF00] bg-[#C5FF00]/[0.06] hover:bg-[#C5FF00]/10')}>
        {state ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────── */
export default function SettingsPage() {
  const { user, profile, subscription, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  /* ── Profile fields ─────────────────────────────────────── */
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('Founder');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');

  /* ── Founder preferences ─────────────────────────────────── */
  const [startupTypes, setStartupTypes] = useState<string[]>(['AI Apps', 'B2B SaaS']);
  const [revenueGoal, setRevenueGoal] = useState('$100K MRR');
  const [founderType, setFounderType] = useState('Solo Founder');
  const [techExp, setTechExp] = useState('Intermediate');
  const [budget, setBudget] = useState('$500-$5,000');
  const [timeAvail, setTimeAvail] = useState('Part Time');
  const [goals, setGoals] = useState<string[]>(['Build Startup', 'Launch SaaS']);

  /* ── AI Cofounder ────────────────────────────────────────── */
  const [aiMode, setAiMode] = useState('Founder Advisor');
  const [responseStyle, setResponseStyle] = useState('Balanced');
  const [reportDepth, setReportDepth] = useState('Standard Analysis');
  const [recStyle, setRecStyle] = useState('Balanced');
  const [autoInsights, setAutoInsights] = useState(true);

  /* ── Opportunity Feed ────────────────────────────────────── */
  const [priorityCats, setPriorityCats] = useState<string[]>(['AI', 'Health', 'Finance']);
  const [hideCats, setHideCats] = useState<string[]>([]);
  const [scoreThreshold, setScoreThreshold] = useState([70]);
  const [compPref, setCompPref] = useState('Any');
  const [revenueFilter, setRevenueFilter] = useState('Any');
  const [growthFilter, setGrowthFilter] = useState('Any');
  const [defaultView, setDefaultView] = useState('Opportunities');

  /* ── Notifications ───────────────────────────────────────── */
  const [digestEmails, setDigestEmails] = useState(profile?.digest_emails ?? true);
  const [weeklyDigestEmails, setWeeklyDigestEmails] = useState(profile?.weekly_digest_emails ?? true);
  const [emailNotifs, setEmailNotifs] = useState({
    newOpps: true, competitorAlerts: true, weeklyReports: false,
    marketTrends: true, researchDone: true, launchReady: false,
    productUpdates: true, billingUpdates: true, affiliateEarnings: false,
  });
  const [inAppNotifs, setInAppNotifs] = useState({
    newOpps: true, competitorAlerts: true, weeklyReports: true,
    marketTrends: true, researchDone: true, launchReady: true,
    productUpdates: false, billingUpdates: true, affiliateEarnings: true,
  });
  const [notifFreq, setNotifFreq] = useState('Daily Digest');

  /* ── Workspace ───────────────────────────────────────────── */
  const [theme, setTheme] = useState('Dark');
  const [density, setDensity] = useState('Compact');
  const [landingPage, setLandingPage] = useState('Opportunities');
  const [autoSave, setAutoSave] = useState(true);
  const [exportFmt, setExportFmt] = useState('PDF');
  const [storeDuration, setStoreDuration] = useState('90 Days');

  /* ── Security ────────────────────────────────────────────── */
  const [twoFactor, setTwoFactor] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  /* ── Privacy ─────────────────────────────────────────────── */
  const [allowPersonalized, setAllowPersonalized] = useState(true);
  const [allowAILearning, setAllowAILearning] = useState(true);
  const [allowAnalytics, setAllowAnalytics] = useState(true);

  /* ── Dirty tracking ──────────────────────────────────────── */
  const markDirty = () => setIsDirty(true);

  /* ── Profile completeness ────────────────────────────────── */
  const completeness = Math.round([
    !!fullName, !!username, !!company, !!bio, !!location,
    !!website, !!linkedin, !!twitter, startupTypes.length > 0, goals.length > 0,
  ].filter(Boolean).length / 10 * 100);

  /* ── Scroll spy ──────────────────────────────────────────── */
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
    }, { rootMargin: '-20% 0px -60% 0px' });
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  /* ── Save ────────────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName, username,
      digest_emails: digestEmails,
      weekly_digest_emails: weeklyDigestEmails,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Failed to save settings'); return; }
    toast.success('Settings saved successfully');
    setIsDirty(false);
  }, [user, fullName, username, digestEmails, weeklyDigestEmails]);

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const NOTIF_LABELS: Record<string, string> = {
    newOpps: 'New Opportunities', competitorAlerts: 'Competitor Alerts',
    weeklyReports: 'Weekly Reports', marketTrends: 'Market Trend Alerts',
    researchDone: 'Research Completed', launchReady: 'Launch Strategy Ready',
    productUpdates: 'Product Updates', billingUpdates: 'Billing Updates',
    affiliateEarnings: 'Affiliate Earnings',
  };

  const INTEGRATIONS = [
    { name: 'Google',   icon: '🔵', connected: true,  lastSync: '2h ago' },
    { name: 'GitHub',   icon: '⚫', connected: false },
    { name: 'LinkedIn', icon: '🔷', connected: false },
    { name: 'Reddit',   icon: '🟠', connected: false },
    { name: 'Twitter/X',icon: '⬛', connected: false },
    { name: 'Notion',   icon: '⬜', connected: false },
    { name: 'Slack',    icon: '🟣', connected: false },
    { name: 'Discord',  icon: '🟦', connected: false },
    { name: 'Stripe',   icon: '🔵', connected: !!subscription?.stripe_customer_id, lastSync: 'Active' },
    { name: 'OpenAI',   icon: '🟢', connected: false },
    { name: 'Anthropic',icon: '🟡', connected: false },
  ];

  const BILLING_ROWS = [
    { date: 'Jun 1, 2025',  amount: '$99.00', status: 'Paid',   inv: 'INV-0023' },
    { date: 'May 1, 2025',  amount: '$99.00', status: 'Paid',   inv: 'INV-0022' },
    { date: 'Apr 1, 2025',  amount: '$99.00', status: 'Paid',   inv: 'INV-0021' },
  ];

  return (
    <AppLayout>
      <div className="flex min-h-full bg-[#050507]">

        {/* ── Left Settings Nav ──────────────────────────────── */}
        <aside className="hidden xl:flex flex-col w-56 shrink-0 border-r border-white/[0.05] sticky top-0 h-screen overflow-y-auto py-6 px-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20 px-3 mb-3">Settings</p>
          <nav className="space-y-0.5">
            {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => scrollTo(id)}
                className={cn('flex items-center gap-2.5 w-full h-8 px-3 rounded-lg text-[13px] font-medium transition-all text-left',
                  activeSection === id
                    ? 'bg-[#C5FF00]/[0.07] text-[#C5FF00]'
                    : 'text-white/30 hover:text-white/65 hover:bg-white/[0.03]')}>
                <Icon className={cn('w-3.5 h-3.5 shrink-0',
                  activeSection === id ? 'text-[#C5FF00]' : 'text-white/20')} />
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-auto px-3 pt-6">
            <button onClick={handleSignOut}
              className="flex items-center gap-2 text-[12px] text-white/25 hover:text-red-400 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main Content ───────────────────────────────────── */}
        <div className="flex-1 min-w-0 overflow-x-hidden">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 pb-28 space-y-12">

            {/* Page header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <Settings className="w-4 h-4 text-white/30" />
                  <h1 className="text-xl font-black text-white tracking-tight">Settings</h1>
                </div>
                <p className="text-[13px] text-white/30 leading-relaxed max-w-md">
                  Configure your AI Cofounder and personalize your startup intelligence experience.
                </p>
              </div>
            </div>

            {/* ── Profile Completeness Card ─────────────────── */}
            <Card className="border-[#C5FF00]/15 bg-[#C5FF00]/[0.02]">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#C5FF00]/50 mb-1">Founder Profile</p>
                  <p className="text-2xl font-black text-white">{completeness}% Complete</p>
                  <p className="text-[12px] text-white/30 mt-0.5">The more you share, the smarter Kraitin gets</p>
                </div>
                <div className="relative w-14 h-14 shrink-0">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none" />
                    <circle cx="28" cy="28" r="24" stroke="#C5FF00" strokeWidth="4" fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2*Math.PI*24}`}
                      strokeDashoffset={`${2*Math.PI*24*(1-completeness/100)}`}
                      className="transition-all duration-700" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-[#C5FF00]">{completeness}</span>
                </div>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden mb-4">
                <div className="h-full bg-[#C5FF00] rounded-full transition-all duration-700" style={{width:`${completeness}%`}} />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {['Better startup recommendations','Accurate validation reports','Personalized MVP plans','Smarter launch strategies'].map(b => (
                  <div key={b} className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-[#C5FF00]/60 shrink-0" />
                    <span className="text-[11px] text-white/40">{b}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* ══════════════════════════════════════════════ */}
            {/* SECTION 1 — PROFILE                           */}
            {/* ══════════════════════════════════════════════ */}
            <div id="profile" ref={el => { sectionRefs.current['profile'] = el; }} className="scroll-mt-6">
              <SectionHeader title="Profile" subtitle="Your public identity and professional information." />
              <Card className="space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center text-xl font-black text-[#C5FF00]">
                      {(fullName || profile?.email || 'F')[0].toUpperCase()}
                    </div>
                    <button className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-white/70">Profile Picture</p>
                    <p className="text-[11px] text-white/25 mt-0.5">Recommended: 400×400px</p>
                    <button className="text-[11px] text-[#C5FF00]/60 hover:text-[#C5FF00] transition-colors mt-1.5">Upload photo</button>
                  </div>
                </div>
                <Divider />
                {/* Fields */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>Full Name</FieldLabel>
                    <Input value={fullName} onChange={e=>{setFullName(e.target.value);markDirty();}}
                      placeholder="Your full name"
                      className="bg-white/[0.03] border-white/[0.08] text-white placeholder-white/20 focus-visible:border-white/20 focus-visible:ring-0 h-10" />
                  </div>
                  <div>
                    <FieldLabel required>Username</FieldLabel>
                    <Input value={username} onChange={e=>{setUsername(e.target.value);markDirty();}}
                      placeholder="your-handle"
                      className="bg-white/[0.03] border-white/[0.08] text-white placeholder-white/20 focus-visible:border-white/20 focus-visible:ring-0 h-10" />
                  </div>
                  <div>
                    <FieldLabel>Company Name</FieldLabel>
                    <Input value={company} onChange={e=>{setCompany(e.target.value);markDirty();}}
                      placeholder="Your company"
                      className="bg-white/[0.03] border-white/[0.08] text-white placeholder-white/20 focus-visible:border-white/20 focus-visible:ring-0 h-10" />
                  </div>
                  <div>
                    <FieldLabel>Role</FieldLabel>
                    <select value={role} onChange={e=>{setRole(e.target.value);markDirty();}}
                      className="w-full h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/70 text-sm outline-none focus:border-white/20 transition-colors appearance-none">
                      {['Founder','Indie Hacker','Developer','Product Manager','Startup Team','Agency Owner','Investor','Student','Other'].map(r=>(
                        <option key={r} value={r} className="bg-[#0a0b0f]">{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Bio</FieldLabel>
                    <Textarea value={bio} onChange={e=>{setBio(e.target.value);markDirty();}}
                      placeholder="Tell Kraitin about yourself and what you're building..."
                      rows={3}
                      className="bg-white/[0.03] border-white/[0.08] text-white placeholder-white/20 focus-visible:border-white/20 focus-visible:ring-0 resize-none" />
                  </div>
                  <div>
                    <FieldLabel>Location</FieldLabel>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
                      <Input value={location} onChange={e=>{setLocation(e.target.value);markDirty();}}
                        placeholder="City, Country" className="pl-9 bg-white/[0.03] border-white/[0.08] text-white placeholder-white/20 focus-visible:border-white/20 focus-visible:ring-0 h-10" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Website</FieldLabel>
                    <div className="relative">
                      <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
                      <Input value={website} onChange={e=>{setWebsite(e.target.value);markDirty();}}
                        placeholder="https://yoursite.com" className="pl-9 bg-white/[0.03] border-white/[0.08] text-white placeholder-white/20 focus-visible:border-white/20 focus-visible:ring-0 h-10" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>LinkedIn</FieldLabel>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
                      <Input value={linkedin} onChange={e=>{setLinkedin(e.target.value);markDirty();}}
                        placeholder="linkedin.com/in/you" className="pl-9 bg-white/[0.03] border-white/[0.08] text-white placeholder-white/20 focus-visible:border-white/20 focus-visible:ring-0 h-10" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Twitter / X</FieldLabel>
                    <div className="relative">
                      <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
                      <Input value={twitter} onChange={e=>{setTwitter(e.target.value);markDirty();}}
                        placeholder="@yourhandle" className="pl-9 bg-white/[0.03] border-white/[0.08] text-white placeholder-white/20 focus-visible:border-white/20 focus-visible:ring-0 h-10" />
                    </div>
                  </div>
                </div>
                <Divider />
                {/* Auth status */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/20 mb-3">Authentication Status</p>
                  <div className="flex flex-wrap gap-2">
                    {[{label:'Email Verified', ok: !!user?.email_confirmed_at},{label:'Google Connected', ok: false}].map(({label,ok})=>(
                      <div key={label} className={cn('flex items-center gap-1.5 h-7 px-3 rounded-full border text-[11px] font-medium',
                        ok ? 'border-[#C5FF00]/20 text-[#C5FF00]/70 bg-[#C5FF00]/[0.04]' : 'border-white/[0.07] text-white/25')}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', ok ? 'bg-[#C5FF00]' : 'bg-white/20')} />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* ══════════════════════════════════════════════ */}
            {/* SECTION 2 — FOUNDER PREFERENCES              */}
            {/* ══════════════════════════════════════════════ */}
            <div id="preferences" ref={el=>{sectionRefs.current['preferences']=el;}} className="scroll-mt-6">
              <SectionHeader title="Founder Preferences"
                subtitle="Tell Kraitin what you're building so it can personalize every recommendation." />
              <Card className="space-y-6">
                <div>
                  <FieldLabel>Preferred Startup Types</FieldLabel>
                  <p className="text-[11px] text-white/25 mb-3">Select all categories you want Kraitin to focus on</p>
                  <ChipSelect multi
                    options={['AI Apps','Mobile Apps','B2B SaaS','B2C Apps','Marketplaces','Developer Tools','Chrome Extensions','Productivity','HealthTech','FinTech','EdTech','LegalTech','Creator Economy','AI Agents','Enterprise Software','Consumer Social','Gaming','Ecommerce','Travel','Real Estate']}
                    selected={startupTypes} onChange={v=>{setStartupTypes(v);markDirty();}} />
                </div>
                <Divider />
                <div>
                  <FieldLabel>Revenue Goal</FieldLabel>
                  <RadioCard
                    value={revenueGoal} onChange={v=>{setRevenueGoal(v);markDirty();}}
                    options={['$1K MRR','$10K MRR','$100K MRR','$1M MRR','$10M+ MRR'].map(k=>({key:k,label:k}))} />
                </div>
                <Divider />
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <FieldLabel>Founder Type</FieldLabel>
                    <RadioCard value={founderType} onChange={v=>{setFounderType(v);markDirty();}}
                      options={['Solo Founder','Technical Founder','Non-Technical Founder','Startup Team','Agency','Investor'].map(k=>({key:k,label:k}))} />
                  </div>
                  <div>
                    <FieldLabel>Technical Experience</FieldLabel>
                    <RadioCard value={techExp} onChange={v=>{setTechExp(v);markDirty();}}
                      options={['Beginner','Intermediate','Advanced','Expert'].map(k=>({key:k,label:k}))} />
                  </div>
                </div>
                <Divider />
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <FieldLabel>Available Budget</FieldLabel>
                    <RadioCard value={budget} onChange={v=>{setBudget(v);markDirty();}}
                      options={['$0-$500','$500-$5,000','$5,000-$25,000','$25,000-$100,000','$100,000+'].map(k=>({key:k,label:k}))} />
                  </div>
                  <div>
                    <FieldLabel>Time Available</FieldLabel>
                    <RadioCard value={timeAvail} onChange={v=>{setTimeAvail(v);markDirty();}}
                      options={['Weekends Only','Part Time','Full Time','Dedicated Team'].map(k=>({key:k,label:k}))} />
                  </div>
                </div>
                <Divider />
                <div>
                  <FieldLabel>Goals</FieldLabel>
                  <ChipSelect multi
                    options={['Build Side Income','Quit My Job','Build Startup','Raise Funding','Acquire Users','Sell Business','Launch SaaS','Launch Mobile App']}
                    selected={goals} onChange={v=>{setGoals(v);markDirty();}} />
                </div>
              </Card>
            </div>

            {/* ══════════════════════════════════════════════ */}
            {/* SECTION 3 — AI COFOUNDER                     */}
            {/* ══════════════════════════════════════════════ */}
            <div id="ai-cofounder" ref={el=>{sectionRefs.current['ai-cofounder']=el;}} className="scroll-mt-6">
              <SectionHeader title="AI Cofounder"
                subtitle="Customize how your AI Cofounder thinks, advises, and communicates with you." />
              <Card className="space-y-6">
                <div>
                  <FieldLabel>AI Advisor Mode</FieldLabel>
                  <p className="text-[11px] text-white/25 mb-3">Choose the perspective your AI Cofounder uses when giving advice</p>
                  <RadioCard value={aiMode} onChange={v=>{setAiMode(v);markDirty();}}
                    options={[
                      {key:'Founder Advisor',        label:'Founder Advisor',        desc:'Practical, execution-focused advice for building fast.'},
                      {key:'Startup Researcher',     label:'Startup Researcher',     desc:'Deep market analysis and data-driven insights.'},
                      {key:'Growth Strategist',      label:'Growth Strategist',      desc:'Focuses on user acquisition and viral growth loops.'},
                      {key:'Product Strategist',     label:'Product Strategist',     desc:'Product-led thinking, roadmaps, and user experience.'},
                      {key:'YC Partner',             label:'YC Partner',             desc:'Large market opportunities and venture-scale outcomes.'},
                      {key:'Investor',               label:'Investor Lens',          desc:'Due diligence, cap table, valuation, and funding readiness.'},
                      {key:'Bootstrapped Advisor',   label:'Bootstrapped Advisor',   desc:'Lean, profitable, no-code and low-cost path to revenue.'},
                      {key:'Agency Advisor',         label:'Agency Advisor',         desc:'Service-to-product playbook for agency owners.'},
                    ]} />
                </div>
                <Divider />
                <div className="grid sm:grid-cols-3 gap-5">
                  <div>
                    <FieldLabel>Response Style</FieldLabel>
                    <RadioCard value={responseStyle} onChange={v=>{setResponseStyle(v);markDirty();}}
                      options={['Concise','Balanced','Detailed','Extremely Detailed'].map(k=>({key:k,label:k}))} />
                  </div>
                  <div>
                    <FieldLabel>Report Depth</FieldLabel>
                    <RadioCard value={reportDepth} onChange={v=>{setReportDepth(v);markDirty();}}
                      options={['Quick Analysis','Standard Analysis','Deep Research','Institutional Grade'].map(k=>({key:k,label:k}))} />
                  </div>
                  <div>
                    <FieldLabel>Recommendation Style</FieldLabel>
                    <RadioCard value={recStyle} onChange={v=>{setRecStyle(v);markDirty();}}
                      options={['Safe Opportunities','Balanced','High Risk High Reward'].map(k=>({key:k,label:k}))} />
                  </div>
                </div>
                <Divider />
                <ToggleRow label="Auto Insights" description="Kraitin automatically generates insights when you view an opportunity."
                  value={autoInsights} onChange={v=>{setAutoInsights(v);markDirty();}} />
              </Card>
            </div>

            {/* ══════════════════════════════════════════════ */}
            {/* SECTION 4 — OPPORTUNITY FEED                 */}
            {/* ══════════════════════════════════════════════ */}
            <div id="opportunity" ref={el=>{sectionRefs.current['opportunity']=el;}} className="scroll-mt-6">
              <SectionHeader title="Opportunity Feed"
                subtitle="Control which opportunities appear in your dashboard and how they're ranked." />
              <Card className="space-y-6">
                <div>
                  <FieldLabel>Prioritize Categories</FieldLabel>
                  <ChipSelect multi
                    options={['AI','Health','Finance','Education','Productivity','Developer Tools','Consumer Apps','Enterprise SaaS','Marketplaces','Gaming','Travel','Legal','Creator Economy']}
                    selected={priorityCats} onChange={v=>{setPriorityCats(v);markDirty();}} />
                </div>
                <Divider />
                <div>
                  <FieldLabel>Hide Categories</FieldLabel>
                  <ChipSelect multi
                    options={['AI','Health','Finance','Education','Productivity','Developer Tools','Consumer Apps','Enterprise SaaS','Marketplaces','Gaming','Travel','Legal','Creator Economy']}
                    selected={hideCats} onChange={v=>{setHideCats(v);markDirty();}} />
                </div>
                <Divider />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <FieldLabel>Minimum Opportunity Score</FieldLabel>
                    <span className="text-sm font-black text-[#C5FF00]">{scoreThreshold[0]}+</span>
                  </div>
                  <div className="px-1">
                    <Slider min={0} max={100} step={5} value={scoreThreshold}
                      onValueChange={v=>{setScoreThreshold(v);markDirty();}}
                      className="[&_[data-orientation=horizontal]]:h-1 [&_[role=slider]]:w-4 [&_[role=slider]]:h-4 [&_[role=slider]]:border-[#C5FF00]/50 [&_[role=slider]]:bg-[#0a0b0f]" />
                  </div>
                  <div className="flex gap-1.5 mt-3">
                    {[0,50,70,80,90].map(v=>(
                      <button key={v} onClick={()=>{setScoreThreshold([v]);markDirty();}}
                        className={cn('h-6 px-2.5 rounded-full border text-[10px] font-medium transition-all',
                          scoreThreshold[0]===v ? 'bg-[#C5FF00]/10 border-[#C5FF00]/30 text-[#C5FF00]' : 'border-white/[0.07] text-white/30 hover:border-white/20')}>
                        {v===0?'Any':`${v}+`}
                      </button>
                    ))}
                  </div>
                </div>
                <Divider />
                <div className="grid sm:grid-cols-3 gap-5">
                  <div>
                    <FieldLabel>Competition Preference</FieldLabel>
                    <RadioCard value={compPref} onChange={v=>{setCompPref(v);markDirty();}}
                      options={['Low','Medium','High','Any'].map(k=>({key:k,label:k}))} />
                  </div>
                  <div>
                    <FieldLabel>Revenue Filter</FieldLabel>
                    <RadioCard value={revenueFilter} onChange={v=>{setRevenueFilter(v);markDirty();}}
                      options={['Any','<$10K MRR','$10K–$100K MRR','$100K–$1M MRR','$1M–$10M MRR','$10M+ MRR'].map(k=>({key:k,label:k}))} />
                  </div>
                  <div>
                    <FieldLabel>Min. Growth</FieldLabel>
                    <RadioCard value={growthFilter} onChange={v=>{setGrowthFilter(v);markDirty();}}
                      options={['Any','+10%','+25%','+50%','+100%'].map(k=>({key:k,label:k}))} />
                  </div>
                </div>
                <Divider />
                <div>
                  <FieldLabel>Default Dashboard View</FieldLabel>
                  <RadioCard value={defaultView} onChange={v=>{setDefaultView(v);markDirty();}}
                    options={['Opportunities','Trending','Hidden Gems','Watchlist','Workspace'].map(k=>({key:k,label:k}))} />
                </div>
              </Card>
            </div>

            {/* ══════════════════════════════════════════════ */}
            {/* SECTION 5 — NOTIFICATIONS                    */}
            {/* ══════════════════════════════════════════════ */}
            <div id="notifications" ref={el=>{sectionRefs.current['notifications']=el;}} className="scroll-mt-6">
              <SectionHeader title="Notifications"
                subtitle="Control how and when Kraitin alerts you to new opportunities and reports." />
              <div className="space-y-4">

                {/* Daily Digest card */}
                <Card className="border-[#C5FF00]/10 bg-[#C5FF00]/[0.02]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-md bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center shrink-0">
                          <Zap className="w-3.5 h-3.5 text-[#C5FF00]" />
                        </div>
                        <p className="text-sm font-semibold text-white">Daily Opportunity Digest</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#C5FF00]/10 border border-[#C5FF00]/20 text-[#C5FF00]/70 font-mono uppercase tracking-wider">7 AM UTC</span>
                      </div>
                      <p className="text-[12px] text-white/40 leading-relaxed pl-8">
                        Receive a daily email with the top 5 trending startup opportunities, scored and ranked by market momentum. Delivered every morning to keep you ahead of the market.
                      </p>
                      <div className="flex flex-wrap gap-3 mt-3 pl-8">
                        {['Top 5 opportunities','Growth scores','Competitor signals','Direct research links'].map(f => (
                          <div key={f} className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-[#C5FF00]/50 shrink-0" />
                            <span className="text-[11px] text-white/35">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <Switch
                        checked={digestEmails}
                        onCheckedChange={v => { setDigestEmails(v); markDirty(); }}
                        className="data-[state=checked]:bg-[#C5FF00]"
                      />
                      <span className="text-[10px] text-white/25">
                        {digestEmails ? 'Subscribed' : 'Unsubscribed'}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Weekly Digest card */}
                <Card className="border-blue-400/10 bg-blue-400/[0.02]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-md bg-blue-400/10 border border-blue-400/20 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <p className="text-sm font-semibold text-white">Weekly Sunday Roundup</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-400/10 border border-blue-400/20 text-blue-400/70 font-mono uppercase tracking-wider">Sunday 7 AM</span>
                      </div>
                      <p className="text-[12px] text-white/40 leading-relaxed pl-8">
                        Every Sunday, get a curated recap of the week's top 7 opportunities ranked by growth momentum, plus a snapshot of your saved watchlist ideas.
                      </p>
                      <div className="flex flex-wrap gap-3 mt-3 pl-8">
                        {['Top 7 weekly opportunities','Your watchlist updates','Week-over-week stats','One-click research'].map(f => (
                          <div key={f} className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-blue-400/50 shrink-0" />
                            <span className="text-[11px] text-white/35">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <Switch
                        checked={weeklyDigestEmails}
                        onCheckedChange={v => { setWeeklyDigestEmails(v); markDirty(); }}
                        className="data-[state=checked]:bg-blue-400"
                      />
                      <span className="text-[10px] text-white/25">
                        {weeklyDigestEmails ? 'Subscribed' : 'Unsubscribed'}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-3">Email Notifications</p>
                  <div className="divide-y divide-white/[0.04]">
                    {Object.entries(emailNotifs).map(([key, val]) => (
                      <ToggleRow key={key} label={NOTIF_LABELS[key]} value={val}
                        onChange={v=>{setEmailNotifs(prev=>({...prev,[key]:v}));markDirty();}} />
                    ))}
                  </div>
                </Card>
                <Card>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-3">In-App Notifications</p>
                  <div className="divide-y divide-white/[0.04]">
                    {Object.entries(inAppNotifs).map(([key, val]) => (
                      <ToggleRow key={key} label={NOTIF_LABELS[key]} value={val}
                        onChange={v=>{setInAppNotifs(prev=>({...prev,[key]:v}));markDirty();}} />
                    ))}
                  </div>
                </Card>
                <Card>
                  <FieldLabel>Notification Frequency</FieldLabel>
                  <RadioCard value={notifFreq} onChange={v=>{setNotifFreq(v);markDirty();}}
                    options={['Instant','Daily Digest','Weekly Digest','Off'].map(k=>({key:k,label:k}))} />
                </Card>
              </div>
            </div>

            {/* ══════════════════════════════════════════════ */}
            {/* SECTION 6 — INTEGRATIONS                     */}
            {/* ══════════════════════════════════════════════ */}
            <div id="integrations" ref={el=>{sectionRefs.current['integrations']=el;}} className="scroll-mt-6">
              <SectionHeader title="Integrations"
                subtitle="Connect external services to enhance your startup intelligence workflow." />
              <div className="space-y-4">
                <Card>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-1">Connected Accounts</p>
                  <div>
                    {INTEGRATIONS.map(i => <IntegrationRow key={i.name} {...i} />)}
                  </div>
                </Card>
                <Card className="border-white/[0.04] bg-white/[0.01]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/20 mb-3">Coming Soon</p>
                  <div className="flex flex-wrap gap-2">
                    {['Linear','Jira','HubSpot','Airtable','Zapier','Make'].map(name=>(
                      <div key={name} className="h-7 px-3 rounded-full border border-white/[0.05] text-[11px] text-white/20 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/15" />{name}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* ══════════════════════════════════════════════ */}
            {/* SECTION 7 — WORKSPACE                        */}
            {/* ══════════════════════════════════════════════ */}
            <div id="workspace" ref={el=>{sectionRefs.current['workspace']=el;}} className="scroll-mt-6">
              <SectionHeader title="Workspace" subtitle="Customize the platform experience to match your workflow." />
              <Card className="space-y-6">
                <div>
                  <FieldLabel>Theme</FieldLabel>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      {key:'Dark',     bg:'bg-[#050507]',  border:'border-white/10'},
                      {key:'Midnight', bg:'bg-[#0a0014]',  border:'border-purple-400/20'},
                      {key:'Graphite', bg:'bg-[#141414]',  border:'border-white/10'},
                      {key:'Obsidian', bg:'bg-[#0d0d0f]',  border:'border-white/10'},
                    ].map(({key,bg,border})=>(
                      <button key={key} onClick={()=>{setTheme(key);markDirty();}}
                        className={cn('flex flex-col items-center gap-1.5 transition-all')}>
                        <div className={cn('w-12 h-8 rounded-lg border-2 transition-all', bg,
                          theme===key ? 'border-[#C5FF00]/60' : border)} />
                        <span className={cn('text-[10px] font-medium', theme===key?'text-[#C5FF00]':'text-white/30')}>{key}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Divider />
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <FieldLabel>Dashboard Density</FieldLabel>
                    <RadioCard value={density} onChange={v=>{setDensity(v);markDirty();}}
                      options={['Comfortable','Compact','Dense'].map(k=>({key:k,label:k}))} />
                  </div>
                  <div>
                    <FieldLabel>Default Landing Page</FieldLabel>
                    <RadioCard value={landingPage} onChange={v=>{setLandingPage(v);markDirty();}}
                      options={['Opportunities','Trending','Reports','Watchlist','Research Agent'].map(k=>({key:k,label:k}))} />
                  </div>
                </div>
                <Divider />
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <FieldLabel>Export Format</FieldLabel>
                    <RadioCard value={exportFmt} onChange={v=>{setExportFmt(v);markDirty();}}
                      options={['PDF','DOCX','Markdown','CSV'].map(k=>({key:k,label:k}))} />
                  </div>
                  <div>
                    <FieldLabel>Report Storage</FieldLabel>
                    <RadioCard value={storeDuration} onChange={v=>{setStoreDuration(v);markDirty();}}
                      options={['30 Days','90 Days','1 Year','Unlimited'].map(k=>({key:k,label:k}))} />
                  </div>
                </div>
                <Divider />
                <ToggleRow label="Auto Save Reports"
                  description="Automatically save all generated reports to your workspace."
                  value={autoSave} onChange={v=>{setAutoSave(v);markDirty();}} />
              </Card>
            </div>

            {/* ══════════════════════════════════════════════ */}
            {/* SECTION 8 — BILLING                          */}
            {/* ══════════════════════════════════════════════ */}
            <div id="billing" ref={el=>{sectionRefs.current['billing']=el;}} className="scroll-mt-6">
              <SectionHeader title="Billing" subtitle="Manage your subscription, usage, and payment methods." />
              <div className="space-y-4">
                {/* Current plan */}
                <Card className="border-[#C5FF00]/10">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-1">Current Plan</p>
                      <p className="text-lg font-black text-white capitalize">{subscription?.tier ?? 'Free'}</p>
                      <p className="text-[12px] text-white/35 mt-0.5">
                        Status: <span className={cn('font-semibold', subscription?.status==='active'?'text-[#C5FF00]':'text-amber-400')}>
                          {subscription?.status ?? 'inactive'}
                        </span>
                      </p>
                    </div>
                    <button onClick={()=>navigate('/billing')}
                      className="h-8 px-3 rounded-lg border border-[#C5FF00]/25 text-[#C5FF00] text-[11px] font-semibold bg-[#C5FF00]/[0.06] hover:bg-[#C5FF00]/10 transition-all shrink-0">
                      Manage Plan
                    </button>
                  </div>
                  {/* Usage */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/[0.05]">
                    {[
                      {l:'Credits Remaining', v:`${subscription?.credits_remaining??0}/${subscription?.monthly_credits??500}`},
                      {l:'Research Reports',  v:'5 credits each'},
                      {l:'Validation Reports',v:'10 credits each'},
                      {l:'Competitor Intel',  v:'10 credits each'},
                    ].map(({l,v})=>(
                      <div key={l}>
                        <p className="text-[10px] text-white/25 mb-1">{l}</p>
                        <p className="text-sm font-bold text-white/70">{v}</p>
                      </div>
                    ))}
                  </div>
                </Card>
                {/* Billing history */}
                <Card>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-3">Billing History</p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[400px]">
                      <thead>
                        <tr className="border-b border-white/[0.05]">
                          {['Date','Amount','Status','Invoice'].map(h=>(
                            <th key={h} className="py-2 px-2 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {BILLING_ROWS.map(row=>(
                          <tr key={row.inv} className="border-b border-white/[0.03]">
                            <td className="py-2.5 px-2 text-xs text-white/50">{row.date}</td>
                            <td className="py-2.5 px-2 text-xs text-white/70 font-mono">{row.amount}</td>
                            <td className="py-2.5 px-2"><span className="text-[10px] text-[#C5FF00] bg-[#C5FF00]/10 border border-[#C5FF00]/20 px-2 py-0.5 rounded-full">{row.status}</span></td>
                            <td className="py-2.5 px-2"><button className="text-[11px] text-white/35 hover:text-white/70 transition-colors flex items-center gap-1"><Download className="w-3 h-3"/>{row.inv}</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>

            {/* ══════════════════════════════════════════════ */}
            {/* SECTION 9 — SECURITY                         */}
            {/* ══════════════════════════════════════════════ */}
            <div id="security" ref={el=>{sectionRefs.current['security']=el;}} className="scroll-mt-6">
              <SectionHeader title="Security" subtitle="Protect your account with strong authentication and session management." />
              <div className="space-y-4">
                <Card className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Change Password</p>
                  <div className="space-y-3">
                    {[{label:'Current Password',val:currentPw,set:setCurrentPw},{label:'New Password',val:newPw,set:setNewPw},{label:'Confirm New Password',val:confirmPw,set:setConfirmPw}].map(({label,val,set})=>(
                      <div key={label}>
                        <FieldLabel>{label}</FieldLabel>
                        <Input type="password" value={val} onChange={e=>{set(e.target.value);markDirty();}}
                          placeholder="••••••••••••"
                          className="bg-white/[0.03] border-white/[0.08] text-white placeholder-white/20 focus-visible:border-white/20 focus-visible:ring-0 h-10" />
                      </div>
                    ))}
                  </div>
                  <button className="h-9 px-4 rounded-lg border border-white/[0.08] text-[12px] text-white/45 hover:border-white/20 hover:text-white/70 transition-all">
                    Update Password
                  </button>
                </Card>
                <Card>
                  <ToggleRow label="Two-Factor Authentication"
                    description="Add an extra layer of security with 2FA via authenticator app."
                    value={twoFactor} onChange={v=>{setTwoFactor(v);markDirty();}} />
                  {twoFactor && (
                    <div className="mt-3 p-3 rounded-lg bg-[#C5FF00]/[0.04] border border-[#C5FF00]/15">
                      <p className="text-[12px] text-[#C5FF00]/70">Scan QR code with your authenticator app to complete 2FA setup.</p>
                    </div>
                  )}
                </Card>
                <Card>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-3">Active Sessions</p>
                  <div className="space-y-2.5">
                    {[
                      {dev:'Chrome · macOS',loc:'New York, USA',time:'Current session',cur:true},
                      {dev:'Safari · iPhone',loc:'New York, USA',time:'2 hours ago',cur:false},
                    ].map(({dev,loc,time,cur})=>(
                      <div key={dev} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                        <div>
                          <p className="text-[13px] text-white/65 font-medium">{dev}</p>
                          <p className="text-[11px] text-white/25 mt-0.5">{loc} · {time}</p>
                        </div>
                        {cur ? <span className="text-[10px] text-[#C5FF00] bg-[#C5FF00]/10 border border-[#C5FF00]/20 px-2 py-0.5 rounded-full">Current</span>
                          : <button className="text-[11px] text-white/25 hover:text-red-400 transition-colors">Revoke</button>}
                      </div>
                    ))}
                  </div>
                  <button className="mt-3 h-8 px-3 rounded-lg border border-white/[0.07] text-[11px] text-white/30 hover:border-red-400/30 hover:text-red-400 transition-all">
                    Logout All Other Devices
                  </button>
                </Card>
              </div>
            </div>

            {/* ══════════════════════════════════════════════ */}
            {/* SECTION 10 — DATA & PRIVACY                  */}
            {/* ══════════════════════════════════════════════ */}
            <div id="privacy" ref={el=>{sectionRefs.current['privacy']=el;}} className="scroll-mt-6">
              <SectionHeader title="Data & Privacy" subtitle="Control how your data is collected, used, and stored." />
              <div className="space-y-4">
                <Card>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-1">Data Collection</p>
                  <div className="divide-y divide-white/[0.04]">
                    <ToggleRow label="Personalized Recommendations"
                      description="Use your behavior to improve opportunity suggestions."
                      value={allowPersonalized} onChange={v=>{setAllowPersonalized(v);markDirty();}} />
                    <ToggleRow label="AI Learning"
                      description="Allow Kraitin's AI to learn from your feedback and usage."
                      value={allowAILearning} onChange={v=>{setAllowAILearning(v);markDirty();}} />
                    <ToggleRow label="Usage Analytics"
                      description="Help us improve the product with anonymous usage data."
                      value={allowAnalytics} onChange={v=>{setAllowAnalytics(v);markDirty();}} />
                  </div>
                </Card>
                <Card>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-3">Download My Data</p>
                  <p className="text-[12px] text-white/35 mb-4">Export a complete copy of your Kraitin data including profile, reports, and saved opportunities.</p>
                  <div className="flex flex-wrap gap-2">
                    {['Profile','Reports','Saved Opportunities','Workspace Data'].map(item=>(
                      <button key={item} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.08] text-[11px] text-white/40 hover:border-white/20 hover:text-white/70 transition-all">
                        <Download className="w-3 h-3"/>{item}
                      </button>
                    ))}
                  </div>
                </Card>
                {/* Danger zone */}
                <Card className="border-red-400/15 bg-red-400/[0.02]">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[13px] font-bold text-red-400">Danger Zone</p>
                      <p className="text-[11px] text-white/30 mt-0.5">These actions are permanent and cannot be undone.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.05]">
                      <div>
                        <p className="text-[13px] font-medium text-white/60">Delete All Workspace Data</p>
                        <p className="text-[11px] text-white/25 mt-0.5">Permanently delete all reports, blueprints, and saved items.</p>
                      </div>
                      <button className="h-8 px-3 rounded-lg border border-red-400/25 text-red-400 text-[11px] font-semibold hover:bg-red-400/10 transition-all shrink-0 ml-4">
                        Delete Data
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-red-400/15 bg-red-400/[0.02]">
                      <div>
                        <p className="text-[13px] font-bold text-red-400">Delete Account</p>
                        <p className="text-[11px] text-white/30 mt-0.5">Permanently delete your Kraitin account and all associated data.</p>
                      </div>
                      <button className="h-8 px-3 rounded-lg bg-red-400/10 border border-red-400/30 text-red-400 text-[11px] font-bold hover:bg-red-400/20 transition-all shrink-0 ml-4">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

          </div>
        </div>

        {/* ── Sticky Save Bar ────────────────────────────────── */}
        {isDirty && (
          <div className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-between gap-4 px-6 h-14 bg-[#0a0b0f]/95 backdrop-blur-md border-t border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[13px] text-white/50 font-medium">Unsaved changes</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setIsDirty(false)}
                className="h-8 px-3.5 rounded-lg border border-white/[0.08] text-[12px] text-white/35 hover:text-white/65 hover:border-white/18 transition-all">
                Discard
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[#C5FF00] text-black text-[12px] font-bold hover:bg-[#C5FF00]/90 transition-all disabled:opacity-70">
                {saving ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
