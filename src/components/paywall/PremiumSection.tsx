import { useRef, useEffect, useState } from 'react';
import { Lock, Zap, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePaywallAnalytics } from '@/hooks/usePaywallAnalytics';

export interface PremiumSectionProps {
  /** The actual premium content — shown blurred if locked */
  children: React.ReactNode;
  /** Whether user has access (no blur) */
  isPremium: boolean;
  /** Section display title e.g. "Validation Report" */
  title: string;
  /** Short hook e.g. "Unlock Validation Report" */
  headline?: string;
  /** What they discover after unlocking */
  benefits: string[];
  /** CTA label */
  ctaLabel?: string;
  /** Called when CTA clicked */
  onUpgrade: () => void;
  /** Shown as a small teaser above the blur */
  preview?: React.ReactNode;
  /** Accent color class for glow */
  accent?: 'lime' | 'sky' | 'purple' | 'amber';
}

const ACCENT = {
  lime:   { glow: 'from-[#C5FF00]/20 to-transparent', ring: 'border-[#C5FF00]/20', text: 'text-[#C5FF00]', btn: 'bg-[#C5FF00] text-black hover:bg-[#C5FF00]/90', check: 'text-[#C5FF00]' },
  sky:    { glow: 'from-sky-400/20 to-transparent',   ring: 'border-sky-400/20',   text: 'text-sky-400',   btn: 'bg-sky-500 text-white hover:bg-sky-500/90',       check: 'text-sky-400' },
  purple: { glow: 'from-violet-400/20 to-transparent',ring: 'border-violet-400/20',text: 'text-violet-400',btn: 'bg-violet-500 text-white hover:bg-violet-500/90',   check: 'text-violet-400' },
  amber:  { glow: 'from-amber-400/20 to-transparent', ring: 'border-amber-400/20', text: 'text-amber-400', btn: 'bg-amber-400 text-black hover:bg-amber-400/90',    check: 'text-amber-400' },
};

export function PremiumSection({
  children, isPremium, title, headline, benefits, ctaLabel = 'Upgrade To Pro',
  onUpgrade, preview, accent = 'lime',
}: PremiumSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const a = ACCENT[accent];
  const { trackViewed, trackUpgradeClicked } = usePaywallAnalytics();
  const featureKey = title.toLowerCase().replace(/\s+/g, '_');

  useEffect(() => {
    if (isPremium) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        trackViewed(featureKey);
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [isPremium, featureKey, trackViewed]);

  // Subscribed — just render content
  if (isPremium) return <>{children}</>;

  const handleCta = () => {
    trackUpgradeClicked(featureKey);
    onUpgrade();
  };

  return (
    <div ref={ref} className="relative rounded-2xl overflow-hidden border border-white/[0.06]">
      {/* Blurred content preview */}
      {preview && (
        <div className="relative px-5 pt-5 pb-0 pointer-events-none select-none">
          <div className="blur-[1px] opacity-70">{preview}</div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0a0b0f] to-transparent" />
        </div>
      )}

      {/* Blurred main content */}
      <div className="pointer-events-none select-none blur-sm opacity-40 px-5 pb-4" aria-hidden>
        {children}
      </div>

      {/* Glass overlay */}
      <div className={cn(
        'absolute inset-0 flex flex-col items-center justify-center px-6 py-8',
        'bg-gradient-to-b from-[#050507]/40 via-[#0a0b0f]/85 to-[#0a0b0f]',
        'transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0',
      )}>
        <div className={cn('absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t pointer-events-none', a.glow)} />
        <div className={cn(
          'relative z-10 flex flex-col items-center text-center max-w-sm w-full',
          'transition-all duration-500',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        )}>
          <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center mb-4', 'bg-white/[0.04]', a.ring)}>
            <Lock className={cn('w-4 h-4', a.text)} />
          </div>
          <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60', a.text)}>Premium</p>
          <h3 className="text-base font-black text-white mb-3 text-balance">
            {headline ?? `Unlock ${title}`}
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-5 text-left w-full">
            {benefits.map(b => (
              <div key={b} className="flex items-start gap-1.5">
                <Check className={cn('w-3 h-3 shrink-0 mt-0.5', a.check)} />
                <span className="text-[11px] text-white/45 leading-snug">{b}</span>
              </div>
            ))}
          </div>
          <button onClick={handleCta}
            className={cn('w-full h-10 rounded-xl text-[13px] font-black transition-all flex items-center justify-center gap-2', a.btn)}>
            <Zap className="w-3.5 h-3.5" />
            {ctaLabel}
          </button>
          <p className="text-[10px] text-white/20 mt-2.5">No credit card required · Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}
