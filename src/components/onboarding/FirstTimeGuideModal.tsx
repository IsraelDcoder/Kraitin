import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGuide } from '@/contexts/GuideContext';
import { cn } from '@/lib/utils';
import {
  X, ArrowRight, Sparkles, Search, BarChart3,
  Bookmark, Zap, ChevronRight, Check, Target,
} from 'lucide-react';

/* ── Quick-start research ideas ──────────────────────────── */
const STARTER_IDEAS = [
  { label: 'AI meal scanner app',          query: 'I want to build an AI meal scanner app that analyzes nutrition from photos' },
  { label: 'Voice study coach for students', query: 'A voice-based AI study coach for students that quizzes and explains concepts' },
  { label: 'Legal doc AI for SMBs',         query: 'AI legal document review and drafting tool for small businesses' },
  { label: 'AI companion for seniors',      query: 'An AI companion app for seniors that provides daily conversation and health reminders' },
  { label: 'B2B cold outreach AI',          query: 'B2B cold outreach automation with AI personalization and follow-up sequences' },
  { label: 'No-code SaaS builder',          query: 'A no-code platform for building and launching SaaS products without engineering' },
];

/* ── Step definitions ─────────────────────────────────────── */
interface Step {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  detail?: React.ReactNode;
}

function useSteps(): Step[] {
  return [
    {
      icon: <Sparkles className="w-5 h-5 text-[#C5FF00]" />,
      eyebrow: 'Welcome to Kraitin',
      title: 'Your AI startup intelligence platform',
      description: 'Kraitin gives you scored market opportunities, deep AI research, competitor tracking, and startup validation — all in one place.',
      detail: (
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: <Target className="w-4 h-4" />, label: '500+', sub: 'Scored opportunities' },
            { icon: <Search className="w-4 h-4" />, label: 'AI Research', sub: 'Real-time market analysis' },
            { icon: <BarChart3 className="w-4 h-4" />, label: 'Reports', sub: 'Saved & shareable' },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/[0.07] bg-white/[0.02]">
              <div className="text-white/40">{icon}</div>
              <span className="text-sm font-semibold text-white/80">{label}</span>
              <span className="text-[10px] text-white/30 text-center leading-tight">{sub}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Zap className="w-5 h-5 text-[#C5FF00]" />,
      eyebrow: 'Step 1 — Opportunities',
      title: 'Browse 500+ scored startup ideas',
      description: 'Every opportunity is scored 0–100 for market potential, demand signals, and competition. Filter by category, growth velocity, or hidden gems.',
      detail: (
        <div className="mt-6 space-y-2">
          {[
            { cat: 'AI',          score: 95, badge: '🔥 Explosive' },
            { cat: 'Productivity', score: 91, badge: '↑ Rising' },
            { cat: 'Health',      score: 94, badge: '🔥 Explosive' },
          ].map(({ cat, score, badge }) => (
            <div key={cat} className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C5FF00]/60 shrink-0" />
                <span className="text-sm text-white/70">{cat}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-white/30">{badge}</span>
                <span className="text-sm font-bold text-[#C5FF00] tabular-nums">{score}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Search className="w-5 h-5 text-[#C5FF00]" />,
      eyebrow: 'Step 2 — AI Research',
      title: 'Deep market research in 60 seconds',
      description: 'Describe any startup idea and the AI Research Agent writes a full market report — TAM, competitors, demand signals, SWOT, and a go-to-market plan — with live web data.',
      detail: (
        <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center shrink-0">
              <Search className="w-3.5 h-3.5 text-[#C5FF00]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/40 mb-1">Example query</p>
              <p className="text-sm text-white/70 italic leading-relaxed">
                "I want to build an AI nutrition app that analyzes meal photos and tracks macros…"
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap gap-1.5">
            {['Executive Summary', 'TAM', 'Competitors', 'SWOT', 'GTM Plan'].map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.08] text-white/40">{tag}</span>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-[#C5FF00]" />,
      eyebrow: 'Step 3 — Reports',
      title: 'Every research run is saved',
      description: 'All reports are stored in your Reports library. You can re-read, share, or download them anytime — nothing gets lost.',
      detail: (
        <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.02] divide-y divide-white/[0.05]">
          {[
            { title: 'AI Meal Scanner Market Report', time: 'Just now', type: 'Research' },
            { title: 'B2B Cold Outreach Validation', time: '2 days ago', type: 'Validation' },
            { title: 'Legal AI Competitor Teardown', time: '5 days ago', type: 'Competitor' },
          ].map(({ title, time, type }) => (
            <div key={title} className="flex items-center gap-3 px-3.5 py-2.5">
              <Bookmark className="w-3.5 h-3.5 text-violet-400/60 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/70 truncate">{title}</p>
                <p className="text-[10px] text-white/25 mt-0.5">{time}</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/[0.08] text-white/35 shrink-0">{type}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Zap className="w-5 h-5 text-[#C5FF00]" />,
      eyebrow: 'Run your first research',
      title: 'Pick an idea and go',
      description: 'Select a starter idea below or type your own to run your first AI research report. The full analysis takes under a minute.',
    },
  ];
}

/* ── Dot indicator ────────────────────────────────────────── */
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-full transition-all duration-300',
            i === current
              ? 'w-4 h-1.5 bg-[#C5FF00]'
              : i < current
              ? 'w-1.5 h-1.5 bg-white/30'
              : 'w-1.5 h-1.5 bg-white/10'
          )}
        />
      ))}
    </div>
  );
}

/* ── Animated slide wrapper ───────────────────────────────── */
function SlideIn({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
      {children}
    </div>
  );
}

/* ── Main component — driven entirely by GuideContext ─────── */
export function FirstTimeGuideModal() {
  const { isOpen, closeGuide } = useGuide();
  const navigate = useNavigate();
  const steps = useSteps();

  const [step, setStep] = useState(0);
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [animKey, setAnimKey] = useState(0);

  // Reset step/selections whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setSelectedIdea(null);
      setCustomQuery('');
      setAnimKey(0);
    }
  }, [isOpen]);

  const goTo = (next: number) => { setAnimKey((k) => k + 1); setStep(next); };
  const handleNext = () => { if (step < steps.length - 1) goTo(step + 1); };
  const handleBack = () => { if (step > 0) goTo(step - 1); };

  const handleRunResearch = () => {
    const query = customQuery.trim() || selectedIdea || '';
    if (!query) return;
    closeGuide();
    navigate(`/research?q=${encodeURIComponent(query)}`);
  };

  if (!isOpen) return null;

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="relative w-full max-w-[calc(100%-2rem)] md:max-w-lg bg-[#0B0F19] border border-white/[0.08] rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* top accent line */}
        <div className="h-[1.5px] bg-gradient-to-r from-transparent via-[#C5FF00]/50 to-transparent" />

        {/* close */}
        <button
          onClick={closeGuide}
          aria-label="Dismiss guide"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* body */}
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center shrink-0">
              {currentStep.icon}
            </div>
            <span className="text-xs font-semibold text-[#C5FF00]/70 uppercase tracking-widest">
              {currentStep.eyebrow}
            </span>
          </div>

          <SlideIn key={animKey}>
            <h2 className="text-xl font-bold text-white leading-snug mb-3 text-balance pr-6">
              {currentStep.title}
            </h2>
            <p className="text-sm text-white/50 leading-relaxed text-pretty">
              {currentStep.description}
            </p>

            {!isLast && currentStep.detail}

            {isLast && (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {STARTER_IDEAS.map(({ label, query }) => (
                    <button
                      key={label}
                      onClick={() => { setSelectedIdea(query); setCustomQuery(''); }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all',
                        selectedIdea === query && !customQuery
                          ? 'border-[#C5FF00]/50 bg-[#C5FF00]/10 text-[#C5FF00]'
                          : 'border-white/[0.08] bg-white/[0.02] text-white/55 hover:border-white/20 hover:text-white/80'
                      )}
                    >
                      {selectedIdea === query && !customQuery && <Check className="w-3 h-3 shrink-0" />}
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[10px] text-white/25 uppercase tracking-widest">or type your own</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                <input
                  type="text"
                  placeholder="Describe your startup idea…"
                  value={customQuery}
                  onChange={(e) => { setCustomQuery(e.target.value); if (e.target.value) setSelectedIdea(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (customQuery.trim() || selectedIdea)) handleRunResearch(); }}
                  className="w-full px-3 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#C5FF00]/40 focus:bg-white/[0.04] transition-all"
                />
              </div>
            )}
          </SlideIn>
        </div>

        {/* footer */}
        <div className="px-6 py-5 mt-5 border-t border-white/[0.05] flex items-center justify-between gap-3">
          <StepDots total={steps.length} current={step} />

          <div className="flex items-center gap-2">
            {step > 0 && !isLast && (
              <button onClick={handleBack} className="px-3 py-2 rounded-lg text-xs text-white/35 hover:text-white/60 hover:bg-white/[0.04] transition-all">
                Back
              </button>
            )}

            {!isLast && (
              <button onClick={handleNext} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-sm font-medium text-white/70 hover:bg-white/[0.1] hover:text-white/90 transition-all">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {isLast && (
              <>
                <button onClick={closeGuide} className="px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/55 hover:bg-white/[0.04] transition-all">
                  Skip
                </button>
                <button
                  onClick={handleRunResearch}
                  disabled={!selectedIdea && !customQuery.trim()}
                  className={cn(
                    'flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                    selectedIdea || customQuery.trim()
                      ? 'bg-[#C5FF00] text-black hover:bg-[#C5FF00]/90 hover:shadow-[0_0_20px_rgba(197,255,0,0.25)]'
                      : 'bg-white/[0.06] border border-white/[0.1] text-white/30 cursor-not-allowed'
                  )}
                >
                  Run Research <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {!isLast && (
          <div className="flex justify-end px-6 pb-4 -mt-2">
            <button onClick={closeGuide} className="text-[10px] text-white/20 hover:text-white/40 transition-colors">
              Skip tour
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
