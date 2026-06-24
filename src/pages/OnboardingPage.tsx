import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Check, Sparkles, Zap, ChevronRight, RotateCcw } from 'lucide-react';

/* ─── TYPES ─────────────────────────────────────────────── */

interface OnboardingData {
  interests: string[];
  founderType: string;
  primaryGoal: string;
  experienceLevel: string;
  launchBudget: string;
  buildPreference: string;
  biggestStruggle: string;
}

/* ─── CONSTANTS ─────────────────────────────────────────── */

const INTERESTS = ['AI Apps', 'SaaS', 'Consumer Apps', 'Marketplaces', 'Productivity', 'Health', 'Education', 'Finance', 'E-commerce', 'Other'];
const FOUNDER_TYPES = ['Solo Founder', 'Technical Founder', 'Non-Technical Founder', 'Agency Owner', 'Startup Team', 'Investor', 'Entrepreneur Exploring Ideas'];
const GOALS = ['Build a $10k MRR startup', 'Build a lifestyle business', 'Build a venture-backed company', 'Find side income opportunities', 'Launch faster', 'Validate ideas'];
const EXPERIENCE = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const BUDGETS = ['Under $500', '$500 – $2,000', '$2,000 – $10,000', '$10,000+'];
const BUILD_PREFS = ['AI-First', 'No-Code', 'Low-Code', 'Full-Code', 'Team-Based'];
const STRUGGLES = ['Finding ideas', 'Validation', 'Competitor research', 'Marketing', 'Building MVPs', 'Growth', 'Monetization'];

const AI_MESSAGES = [
  'Analyzing founder profile…',
  'Identifying strengths…',
  'Mapping opportunities…',
  'Building intelligence profile…',
  'Generating recommendations…',
  'Finalizing your AI cofounder setup…',
];

// human-readable labels for each question step
const STEP_LABELS: Record<number, string> = {
  1: 'Interests',
  2: 'Founder Type',
  3: 'Primary Goal',
  4: 'Experience',
  5: 'Budget',
  6: 'Build Style',
  7: 'Biggest Struggle',
};

/* ─── PROFILE GENERATION ────────────────────────────────── */

function deriveProfile(data: OnboardingData) {
  const archetypeMap: Record<string, string> = {
    'Technical Founder': 'Technical Visionary',
    'Non-Technical Founder': 'Product Strategist',
    'Solo Founder': 'Indie Hacker',
    'Agency Owner': 'Agency Entrepreneur',
    'Startup Team': 'Team Builder',
    'Investor': 'Portfolio Builder',
    'Entrepreneur Exploring Ideas': 'Opportunity Scout',
  };
  const archetype = archetypeMap[data.founderType] || 'Visionary Builder';
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (data.founderType === 'Technical Founder') { strengths.push('Execution', 'Product Building'); weaknesses.push('Distribution', 'Marketing'); }
  else if (data.founderType === 'Non-Technical Founder') { strengths.push('Strategy', 'Fundraising'); weaknesses.push('Technical Execution', 'MVP Speed'); }
  else { strengths.push('Idea Generation', 'Adaptability'); weaknesses.push('Focus', 'Scaling'); }
  if (data.primaryGoal === 'Build a venture-backed company') { strengths.push('Vision'); weaknesses.push('Bootstrapping'); }
  if (data.primaryGoal === 'Validate ideas') { strengths.push('Research'); weaknesses.push('Commitment'); }
  const cats = data.interests.length ? data.interests.slice(0, 4) : ['AI Apps', 'SaaS', 'Productivity', 'B2B'];
  return { archetype, strengths: [...new Set(strengths)].slice(0, 3), weaknesses: [...new Set(weaknesses)].slice(0, 2), recommendedCategories: cats };
}

/* ─── BACKGROUND ────────────────────────────────────────── */

function PageBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#C5FF00]/[0.04] blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#C5FF00]/[0.02] blur-[100px]" />
    </div>
  );
}

/* ─── PROGRESS BAR ──────────────────────────────────────── */

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="w-full h-[2px] bg-white/[0.06] mb-0">
      <div className="h-full bg-[#C5FF00] transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ─── OPTION CHIP ───────────────────────────────────────── */

function Chip({ label, selected, onClick, multi }: { label: string; selected: boolean; onClick: () => void; multi?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-3 rounded-xl border text-sm text-left transition-all duration-200 ${
        selected
          ? 'border-[#C5FF00]/60 bg-[#C5FF00]/10 text-[#C5FF00]'
          : 'border-white/[0.08] bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white/80'
      }`}
    >
      {multi && (
        <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${selected ? 'bg-[#C5FF00] border-[#C5FF00]' : 'border-white/20'}`}>
          {selected && <Check className="w-2.5 h-2.5 text-black" />}
        </div>
      )}
      {!multi && (
        <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all ${selected ? 'border-[#C5FF00]' : 'border-white/20'}`}>
          {selected && <div className="w-full h-full rounded-full bg-[#C5FF00] scale-[0.55]" />}
        </div>
      )}
      {label}
    </button>
  );
}

/* ─── SLIDE WRAPPER ─────────────────────────────────────── */

function Slide({ children, visible }: { children: React.ReactNode; visible: boolean }) {
  return (
    <div
      className="transition-all duration-400"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  );
}

/* ─── MAIN ──────────────────────────────────────────────── */

const TOTAL_QUESTION_STEPS = 7;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, founderProfile, refreshProfile } = useAuth();

  // edit mode: ?edit=true  optionally ?section=N (1-7)
  const isEditMode = searchParams.get('edit') === 'true';
  const startSection = parseInt(searchParams.get('section') || '0', 10);

  const [step, setStep] = useState(() => {
    if (isEditMode && startSection >= 1 && startSection <= 7) return startSection;
    if (isEditMode) return 1; // skip welcome in edit mode
    return 0; // will be overridden below once profile loads
  });
  const [stepInitialised, setStepInitialised] = useState(isEditMode); // edit mode skips resume
  const [visible, setVisible] = useState(true);
  const [data, setData] = useState<OnboardingData>({
    interests: [],
    founderType: '',
    primaryGoal: '',
    experienceLevel: 'Intermediate',
    launchBudget: '',
    buildPreference: '',
    biggestStruggle: '',
  });
  const [aiMsgIdx, setAiMsgIdx] = useState(0);
  const [aiProgress, setAiProgress] = useState(0);
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'yearly' | null>(null);
  const derived = deriveProfile(data);
  const aiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect if not authenticated
  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  // Resume from saved onboarding_step (non-edit mode only, runs once profile loads)
  useEffect(() => {
    if (isEditMode || stepInitialised || !profile) return;
    const saved = profile.onboarding_step;
    if (saved && saved >= 1 && saved <= TOTAL_QUESTION_STEPS) {
      setStep(saved); // resume mid-flow
    }
    setStepInitialised(true);
  }, [profile, isEditMode, stepInitialised]);

  // Pre-fill from existing founderProfile in edit mode
  useEffect(() => {
    if (isEditMode && founderProfile) {
      setData({
        interests: founderProfile.interests || [],
        founderType: founderProfile.founder_type || '',
        primaryGoal: founderProfile.primary_goal || '',
        experienceLevel: founderProfile.experience_level
          ? founderProfile.experience_level.charAt(0).toUpperCase() + founderProfile.experience_level.slice(1)
          : 'Intermediate',
        launchBudget: founderProfile.launch_budget || '',
        buildPreference: founderProfile.build_preference || '',
        biggestStruggle: founderProfile.biggest_struggle || '',
      });
    }
  }, [isEditMode, founderProfile]);

  // AI generation animation
  useEffect(() => {
    if (step !== 8) return;
    setAiProgress(0);
    setAiMsgIdx(0);
    let p = 0;
    let m = 0;
    aiIntervalRef.current = setInterval(() => {
      p += 1.8;
      setAiProgress(Math.min(p, 100));
      if (p % 16 < 1.8 && m < AI_MESSAGES.length - 1) { m++; setAiMsgIdx(m); }
      if (p >= 100) {
        clearInterval(aiIntervalRef.current!);
        setTimeout(() => transition(9), 600);
      }
    }, 80);
    return () => { if (aiIntervalRef.current) clearInterval(aiIntervalRef.current); };
  }, [step]);

  // Handle Stripe redirect back to onboarding (?status=success → step 11, ?step=10 → pricing)
  useEffect(() => {
    const status = searchParams.get('status');
    const stepParam = parseInt(searchParams.get('step') || '0', 10);
    if (status === 'success') {
      refreshProfile();
      toast.success('Payment successful! Your Pro plan is now active.');
      transition(11);
    } else if (!status && stepParam === 10) {
      // Stripe cancelled — return user to the pricing cards
      toast.info('Checkout cancelled. No charges were made.');
      transition(10);
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const transition = (next: number) => {
    setVisible(false);
    setTimeout(() => { setStep(next); setVisible(true); }, 280);
  };

  /** Persist the current step so the user can resume later. */
  const persistStep = async (nextStep: number) => {
    if (!user || isEditMode) return;
    // Only save question steps 1-7; skip welcome (0), AI anim (8), results (9)
    if (nextStep >= 1 && nextStep <= TOTAL_QUESTION_STEPS) {
      await supabase.from('profiles')
        .update({ onboarding_step: nextStep })
        .eq('id', user.id);
    }
  };

  const goNext = () => {
    const next = step + 1;
    persistStep(next);
    transition(next);
  };
  const goBack = () => {
    // in edit mode, going back from step 1 returns to settings
    if (isEditMode && step === 1) { navigate('/settings'); return; }
    const prev = step - 1;
    persistStep(prev);
    transition(prev);
  };

  const canProceed = () => {
    if (step === 1) return data.interests.length > 0;
    if (step === 2) return !!data.founderType;
    if (step === 3) return !!data.primaryGoal;
    if (step === 4) return !!data.experienceLevel;
    if (step === 5) return !!data.launchBudget;
    if (step === 6) return !!data.buildPreference;
    if (step === 7) return !!data.biggestStruggle;
    return true;
  };

  const saveProfile = async () => {
    if (!user) return;
    await supabase.from('founder_profiles').upsert({
      user_id: user.id,
      interests: data.interests,
      founder_type: data.founderType,
      primary_goal: data.primaryGoal,
      experience_level: data.experienceLevel.toLowerCase(),
      launch_budget: data.launchBudget,
      build_preference: data.buildPreference,
      biggest_struggle: data.biggestStruggle,
      founder_archetype: derived.archetype,
      strengths: derived.strengths,
      weaknesses: derived.weaknesses,
      recommended_categories: derived.recommendedCategories,
      onboarding_completed: true,
    }, { onConflict: 'user_id' });
    // Mark onboarding complete and clear the step pointer in profiles
    await supabase.from('profiles')
      .update({ onboarding_completed: true, onboarding_step: null })
      .eq('id', user.id);
    await refreshProfile();
  };

  // In edit mode: save + go back to settings
  const handleEditSave = async () => {
    await saveProfile();
    toast.success('Founder profile updated!');
    navigate('/settings');
  };

  const handleCheckout = async (selectedPlan: 'monthly' | 'yearly') => {
    if (!user || loadingPlan) return;
    setPlan(selectedPlan);
    setLoadingPlan(selectedPlan);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ plan: selectedPlan, source: 'onboarding' }),
      });
      const json = await res.json();
      if (json.code !== 'SUCCESS' || !json.data?.url) throw new Error(json.message || 'Checkout failed');
      window.open(json.data.url, '_blank');
    } catch {
      toast.error('Could not start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const enterDashboard = async () => {
    await saveProfile();
    navigate('/opportunities');
  };

  const progressStep = step >= 1 && step <= 7 ? step : step === 8 || step === 9 ? TOTAL_QUESTION_STEPS + 1 : 0;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <PageBg />

      {step >= 1 && step <= 9 && (
        <ProgressBar step={progressStep} total={TOTAL_QUESTION_STEPS + 1} />
      )}

      {/* header */}
      <div className="flex items-center justify-between px-6 py-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C5FF00] flex items-center justify-center">
            <span className="text-black font-black text-sm">K</span>
          </div>
          <span className="font-bold text-white/80 text-sm">kraitin</span>
          {isEditMode && (
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full border border-[#C5FF00]/30 text-[#C5FF00]/70">editing profile</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {step >= 1 && step <= 7 && (
            <span className="text-xs text-white/30 font-mono">{step} / {TOTAL_QUESTION_STEPS}</span>
          )}
          {/* section jump menu — only in edit mode on question steps */}
          {isEditMode && step >= 1 && step <= 7 && (
            <select
              value={step}
              onChange={(e) => transition(Number(e.target.value))}
              className="text-xs bg-white/[0.05] border border-white/[0.1] rounded-lg px-2 py-1 text-white/60 focus:outline-none cursor-pointer"
            >
              {Object.entries(STEP_LABELS).map(([s, label]) => (
                <option key={s} value={s} className="bg-black">{label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 pb-8">
        <div className="w-full max-w-xl">

          {/* ── SCREEN 0: WELCOME (only in fresh onboarding) ── */}
          {step === 0 && !isEditMode && (
            <Slide visible={visible}>
              <div className="text-center">
                <div className="w-20 h-20 rounded-3xl bg-[#C5FF00] flex items-center justify-center mx-auto mb-8 shadow-[0_0_60px_rgba(197,255,0,0.4)]">
                  <Sparkles className="w-10 h-10 text-black" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4 text-balance">
                  Let's find your next<br /><span className="text-[#C5FF00]">billion-dollar opportunity.</span>
                </h1>
                <p className="text-white/50 text-lg mb-10 max-w-sm mx-auto">
                  Answer a few questions and Kraitin will build your personalized Founder Profile.
                </p>
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={goNext}
                    className="inline-flex items-center gap-2 bg-[#C5FF00] text-black font-bold text-base px-10 py-4 rounded-full hover:bg-[#C5FF00]/90 transition-all hover:shadow-[0_0_40px_rgba(197,255,0,0.4)] hover:scale-105"
                  >
                    Begin <ArrowRight className="w-5 h-5" />
                  </button>
                  <span className="text-white/25 text-xs">~90 seconds</span>
                </div>
              </div>
            </Slide>
          )}

          {/* ── SCREEN 1: INTERESTS ── */}
          {step === 1 && (
            <Slide visible={visible}>
              <p className="text-[#C5FF00] text-xs font-semibold uppercase tracking-widest mb-3">What are you building?</p>
              <h2 className="text-2xl md:text-3xl font-black mb-8 text-balance">What interests you most?</h2>
              <div className="grid grid-cols-2 gap-2 mb-8">
                {INTERESTS.map((opt) => (
                  <Chip
                    key={opt} label={opt} multi
                    selected={data.interests.includes(opt)}
                    onClick={() => setData((d) => ({
                      ...d,
                      interests: d.interests.includes(opt)
                        ? d.interests.filter((x) => x !== opt)
                        : [...d.interests, opt],
                    }))}
                  />
                ))}
              </div>
              {isEditMode
                ? <EditNavButtons step={step} canProceed={canProceed()} onBack={goBack} onNext={goNext} onSave={handleEditSave} isLast={false} />
                : <NavButtons step={step} canProceed={canProceed()} onBack={goBack} onNext={goNext} />
              }
            </Slide>
          )}

          {/* ── SCREEN 2: FOUNDER TYPE ── */}
          {step === 2 && (
            <Slide visible={visible}>
              <p className="text-[#C5FF00] text-xs font-semibold uppercase tracking-widest mb-3">Founder Type</p>
              <h2 className="text-2xl md:text-3xl font-black mb-8 text-balance">Which best describes you?</h2>
              <div className="flex flex-col gap-2 mb-8">
                {FOUNDER_TYPES.map((opt) => (
                  <Chip key={opt} label={opt} selected={data.founderType === opt} onClick={() => setData((d) => ({ ...d, founderType: opt }))} />
                ))}
              </div>
              {isEditMode
                ? <EditNavButtons step={step} canProceed={canProceed()} onBack={goBack} onNext={goNext} onSave={handleEditSave} isLast={false} />
                : <NavButtons step={step} canProceed={canProceed()} onBack={goBack} onNext={goNext} />
              }
            </Slide>
          )}

          {/* ── SCREEN 3: GOAL ── */}
          {step === 3 && (
            <Slide visible={visible}>
              <p className="text-[#C5FF00] text-xs font-semibold uppercase tracking-widest mb-3">Goal</p>
              <h2 className="text-2xl md:text-3xl font-black mb-8 text-balance">What's your primary goal?</h2>
              <div className="flex flex-col gap-2 mb-8">
                {GOALS.map((opt) => (
                  <Chip key={opt} label={opt} selected={data.primaryGoal === opt} onClick={() => setData((d) => ({ ...d, primaryGoal: opt }))} />
                ))}
              </div>
              {isEditMode
                ? <EditNavButtons step={step} canProceed={canProceed()} onBack={goBack} onNext={goNext} onSave={handleEditSave} isLast={false} />
                : <NavButtons step={step} canProceed={canProceed()} onBack={goBack} onNext={goNext} />
              }
            </Slide>
          )}

          {/* ── SCREEN 4: EXPERIENCE ── */}
          {step === 4 && (
            <Slide visible={visible}>
              <p className="text-[#C5FF00] text-xs font-semibold uppercase tracking-widest mb-3">Experience Level</p>
              <h2 className="text-2xl md:text-3xl font-black mb-8 text-balance">How experienced are you?</h2>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {EXPERIENCE.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setData((d) => ({ ...d, experienceLevel: opt }))}
                    className={`py-6 rounded-2xl border font-bold text-lg transition-all duration-200 ${
                      data.experienceLevel === opt
                        ? 'border-[#C5FF00]/60 bg-[#C5FF00]/10 text-[#C5FF00] shadow-[0_0_20px_rgba(197,255,0,0.15)]'
                        : 'border-white/[0.08] bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white/80'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {isEditMode
                ? <EditNavButtons step={step} canProceed={canProceed()} onBack={goBack} onNext={goNext} onSave={handleEditSave} isLast={false} />
                : <NavButtons step={step} canProceed={canProceed()} onBack={goBack} onNext={goNext} />
              }
            </Slide>
          )}

          {/* ── SCREEN 5: BUDGET ── */}
          {step === 5 && (
            <Slide visible={visible}>
              <p className="text-[#C5FF00] text-xs font-semibold uppercase tracking-widest mb-3">Budget</p>
              <h2 className="text-2xl md:text-3xl font-black mb-4 text-balance">What's your launch budget?</h2>
              <p className="text-white/40 text-sm mb-8">This helps us tailor opportunity recommendations to your resources.</p>
              <div className="flex flex-col gap-2 mb-8">
                {BUDGETS.map((opt) => (
                  <Chip key={opt} label={opt} selected={data.launchBudget === opt} onClick={() => setData((d) => ({ ...d, launchBudget: opt }))} />
                ))}
              </div>
              {isEditMode
                ? <EditNavButtons step={step} canProceed={canProceed()} onBack={goBack} onNext={goNext} onSave={handleEditSave} isLast={false} />
                : <NavButtons step={step} canProceed={canProceed()} onBack={goBack} onNext={goNext} />
              }
            </Slide>
          )}

          {/* ── SCREEN 6: BUILD PREFERENCE ── */}
          {step === 6 && (
            <Slide visible={visible}>
              <p className="text-[#C5FF00] text-xs font-semibold uppercase tracking-widest mb-3">Building Preferences</p>
              <h2 className="text-2xl md:text-3xl font-black mb-8 text-balance">How do you prefer to build?</h2>
              <div className="grid grid-cols-2 gap-2 mb-8">
                {BUILD_PREFS.map((opt) => (
                  <Chip key={opt} label={opt} selected={data.buildPreference === opt} onClick={() => setData((d) => ({ ...d, buildPreference: opt }))} />
                ))}
              </div>
              {isEditMode
                ? <EditNavButtons step={step} canProceed={canProceed()} onBack={goBack} onNext={goNext} onSave={handleEditSave} isLast={false} />
                : <NavButtons step={step} canProceed={canProceed()} onBack={goBack} onNext={goNext} />
              }
            </Slide>
          )}

          {/* ── SCREEN 7: STRUGGLE ── */}
          {step === 7 && (
            <Slide visible={visible}>
              <p className="text-[#C5FF00] text-xs font-semibold uppercase tracking-widest mb-3">Biggest Struggle</p>
              <h2 className="text-2xl md:text-3xl font-black mb-8 text-balance">What's stopping you today?</h2>
              <div className="grid grid-cols-2 gap-2 mb-8">
                {STRUGGLES.map((opt) => (
                  <Chip key={opt} label={opt} selected={data.biggestStruggle === opt} onClick={() => setData((d) => ({ ...d, biggestStruggle: opt }))} />
                ))}
              </div>
              {isEditMode
                ? <EditNavButtons step={step} canProceed={canProceed()} onBack={goBack} onNext={goNext} onSave={handleEditSave} isLast={true} />
                : <NavButtons step={step} canProceed={canProceed()} onBack={goBack} onNext={() => transition(8)} nextLabel="Analyze my profile" />
              }
            </Slide>
          )}

          {/* ── SCREEN 8: AI GENERATION ── */}
          {step === 8 && (
            <Slide visible={visible}>
              <div className="text-center py-8">
                <div className="relative w-28 h-28 mx-auto mb-10">
                  <div className="absolute inset-0 rounded-full bg-[#C5FF00]/20 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-2 rounded-full bg-[#C5FF00]/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.4s' }} />
                  <div className="relative w-full h-full rounded-full bg-[#C5FF00]/10 border border-[#C5FF00]/40 flex items-center justify-center shadow-[0_0_50px_rgba(197,255,0,0.3)]">
                    <Zap className="w-12 h-12 text-[#C5FF00]" />
                  </div>
                </div>
                <h2 className="text-2xl font-black mb-2">Building Your Founder Profile…</h2>
                <p className="text-[#C5FF00] text-sm font-mono mb-8 h-5 transition-all duration-300">{AI_MESSAGES[aiMsgIdx]}</p>
                <div className="max-w-xs mx-auto h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-[#C5FF00] rounded-full transition-all duration-75" style={{ width: `${aiProgress}%` }} />
                </div>
                <span className="text-white/30 text-xs font-mono">{Math.round(aiProgress)}%</span>
              </div>
            </Slide>
          )}

          {/* ── SCREEN 9: PROFILE REVEAL ── */}
          {step === 9 && (
            <Slide visible={visible}>
              <div className="text-center mb-8">
                <p className="text-[#C5FF00] text-xs font-semibold uppercase tracking-widest mb-2">AI Analysis Complete</p>
                <h2 className="text-3xl md:text-4xl font-black text-balance">Your Founder Profile</h2>
              </div>
              <div className="rounded-2xl border border-[#C5FF00]/20 p-6 mb-6" style={{ background: 'rgba(197,255,0,0.03)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/[0.06]">
                  <div className="w-12 h-12 rounded-2xl bg-[#C5FF00] flex items-center justify-center shadow-[0_0_20px_rgba(197,255,0,0.3)]">
                    <span className="text-black font-black text-lg">{(user?.email ?? 'F')[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Founder Type</p>
                    <p className="font-black text-xl text-[#C5FF00]">{derived.archetype}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-white/40 mb-2">Strengths</p>
                    <div className="flex flex-col gap-1">
                      {derived.strengths.map((s) => (
                        <div key={s} className="flex items-center gap-1.5 text-sm">
                          <Check className="w-3.5 h-3.5 text-[#C5FF00] shrink-0" />
                          <span className="text-white/80">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-2">To Develop</p>
                    <div className="flex flex-col gap-1">
                      {derived.weaknesses.map((w) => (
                        <div key={w} className="flex items-center gap-1.5 text-sm">
                          <ChevronRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
                          <span className="text-white/50">{w}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/[0.06]">
                  <p className="text-xs text-white/40 mb-2">Recommended Categories</p>
                  <div className="flex flex-wrap gap-1.5">
                    {derived.recommendedCategories.map((c) => (
                      <span key={c} className="text-xs px-2.5 py-1 rounded-full border border-[#C5FF00]/30 bg-[#C5FF00]/5 text-[#C5FF00]/80">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <p className="text-xs text-white/40 mb-1">Recommended Archetype</p>
                  <p className="text-white font-bold">AI Micro SaaS — High Growth, Low Competition</p>
                </div>
              </div>
              <button
                onClick={() => transition(10)}
                className="w-full bg-[#C5FF00] text-black font-bold py-4 rounded-xl hover:bg-[#C5FF00]/90 transition-all hover:shadow-[0_0_30px_rgba(197,255,0,0.3)] flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </Slide>
          )}

          {/* ── SCREEN 10: PRICING ── */}
          {step === 10 && (
            <Slide visible={visible}>
              <div className="text-center mb-10">
                <p className="text-[#C5FF00] text-xs font-semibold uppercase tracking-widest mb-3">Unlock Your AI Cofounder</p>
                <h2 className="text-3xl md:text-4xl font-black mb-3 text-balance">Start building smarter today</h2>
                <p className="text-white/50">Get instant access to all five AI agents and 500 monthly credits.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {([
                  { key: 'monthly' as const, label: 'Monthly', price: '$49', sub: 'Billed monthly · Cancel anytime', note: '', best: false },
                  { key: 'yearly'  as const, label: 'Yearly',  price: '$490', sub: 'Billed yearly · Cancel anytime', note: '$490/yr · Save 17%', best: true },
                ] as const).map((card) => {
                  const isLoading = loadingPlan === card.key;
                  const isDisabled = loadingPlan !== null;
                  return (
                    <button
                      key={card.key}
                      onClick={() => handleCheckout(card.key)}
                      disabled={isDisabled}
                      className={`rounded-2xl border p-6 text-left transition-all duration-200 relative overflow-hidden w-full ${
                        plan === card.key
                          ? 'border-[#C5FF00]/50 bg-[#C5FF00]/5'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'
                      } disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                      {card.best && (
                        <div className="absolute top-3 right-3 bg-[#C5FF00] text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                          BEST VALUE
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-white/50 text-sm mb-1">{card.label}</p>
                          <div className="flex items-end gap-1">
                            <span className="text-3xl font-black text-white">{card.price}</span>
                            <span className="text-white/40 text-sm mb-1">/month</span>
                          </div>
                          {card.note && <p className="text-[#C5FF00] text-xs">{card.note}</p>}
                        </div>
                        {/* spinner while this plan is loading, otherwise checkmark indicator */}
                        <div className={`w-5 h-5 flex items-center justify-center rounded-full ${card.best ? 'mt-5' : ''}`}>
                          {isLoading ? (
                            <span className="w-5 h-5 border-2 border-[#C5FF00]/30 border-t-[#C5FF00] rounded-full animate-spin" />
                          ) : (
                            <div className={`w-5 h-5 rounded-full border-2 transition-all ${plan === card.key ? 'border-[#C5FF00] bg-[#C5FF00]' : 'border-white/20'}`}>
                              {plan === card.key && <Check className="w-3 h-3 text-black m-auto mt-0.5" />}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-white/40 text-xs">{card.sub}</p>
                      {/* inline CTA label */}
                      <div className={`mt-4 w-full py-2 rounded-lg text-xs font-bold text-center transition-all ${
                        plan === card.key
                          ? 'bg-[#C5FF00] text-black'
                          : 'bg-white/[0.04] text-white/30'
                      }`}>
                        {isLoading
                          ? 'Redirecting to Stripe…'
                          : card.key === 'monthly'
                          ? 'Start Pro — $49/month'
                          : 'Start Pro — $490/year'}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-white/20 text-xs mb-2">Instant access · Cancel anytime · No hidden fees</p>
              <button onClick={() => transition(11)} className="w-full mt-1 text-white/25 text-xs hover:text-white/50 transition-colors py-2">
                Skip for now →
              </button>
            </Slide>
          )}

          {/* ── SCREEN 11: SUCCESS ── */}
          {step === 11 && (
            <Slide visible={visible}>
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-[#C5FF00] flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(197,255,0,0.5)]">
                  <Check className="w-10 h-10 text-black" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-2">Welcome to Kraitin</h2>
                <p className="text-white/50">Your AI Cofounder is ready.</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] p-6 mb-6 space-y-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                {[
                  { label: 'Founder Type', value: derived.archetype },
                  { label: 'Primary Goal', value: data.primaryGoal || '—' },
                  { label: 'Focus Industries', value: data.interests.slice(0, 3).join(', ') || '—' },
                  { label: 'Recommended Opportunities', value: 'AI Micro SaaS · Productivity Tools · Developer Tools' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-4">
                    <span className="text-white/40 text-sm shrink-0">{label}</span>
                    <span className="text-white/90 text-sm text-right">{value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={enterDashboard}
                className="w-full bg-[#C5FF00] text-black font-bold py-4 rounded-xl hover:bg-[#C5FF00]/90 transition-all hover:shadow-[0_0_30px_rgba(197,255,0,0.3)] flex items-center justify-center gap-2"
              >
                Enter Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </Slide>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── NAV BUTTONS (fresh onboarding) ────────────────────── */

function NavButtons({ step, canProceed, onBack, onNext, nextLabel = 'Continue' }: {
  step: number; canProceed: boolean; onBack: () => void; onNext: () => void; nextLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {step > 1 && (
        <button onClick={onBack} className="flex items-center gap-1.5 px-5 py-3.5 rounded-xl border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/20 transition-all text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={!canProceed}
        className="flex-1 flex items-center justify-center gap-2 bg-[#C5FF00] text-black font-bold py-3.5 rounded-xl hover:bg-[#C5FF00]/90 transition-all hover:shadow-[0_0_25px_rgba(197,255,0,0.3)] disabled:opacity-30 disabled:cursor-not-allowed text-sm"
      >
        {nextLabel} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── EDIT NAV BUTTONS ───────────────────────────────────── */

function EditNavButtons({ step, canProceed, onBack, onNext, onSave, isLast }: {
  step: number; canProceed: boolean; onBack: () => void; onNext: () => void; onSave: () => void; isLast: boolean;
}) {
  return (
    <div className="space-y-3">
      {/* Save & return CTA always visible in edit mode */}
      <button
        onClick={onSave}
        disabled={!canProceed}
        className="w-full flex items-center justify-center gap-2 bg-[#C5FF00] text-black font-bold py-3.5 rounded-xl hover:bg-[#C5FF00]/90 transition-all hover:shadow-[0_0_25px_rgba(197,255,0,0.3)] disabled:opacity-30 disabled:cursor-not-allowed text-sm"
      >
        <Check className="w-4 h-4" /> Save &amp; Return to Settings
      </button>
      {/* section nav row */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/20 transition-all text-sm">
          <ArrowLeft className="w-4 h-4" /> {step === 1 ? 'Cancel' : 'Prev'}
        </button>
        {!isLast && (
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/20 transition-all text-sm disabled:opacity-30"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="text-center text-white/25 text-xs flex items-center justify-center gap-1">
        <RotateCcw className="w-3 h-3" /> Changes save immediately when you click Save
      </p>
    </div>
  );
}
