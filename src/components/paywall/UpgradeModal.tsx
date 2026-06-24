import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Check, Zap, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePaywallAnalytics } from '@/hooks/usePaywallAnalytics';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional headline override */
  headline?: string;
  /** Optional feature context e.g. "Validation Report" */
  feature?: string;
}

const FEATURES = [
  'Research Agent',
  'Validation Agent',
  'Startup Teardown',
  'Competitor Intelligence',
  'MVP Planner',
  'Launch Agent',
  'Workspace',
  'Saved Reports',
  'Watchlists',
  'Blueprints',
  '500 Credits Every Month',
];

export function UpgradeModal({ open, onClose, headline, feature }: Props) {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');
  const { trackUpgradeClicked, trackDismissed } = usePaywallAnalytics();
  const featureKey = feature?.toLowerCase().replace(/\s+/g, '_') ?? 'upgrade_modal';

  const handleUpgrade = () => {
    trackUpgradeClicked(featureKey, plan);
    onClose();
    navigate('/billing?plan=' + plan);
  };

  const handleClose = () => {
    trackDismissed(featureKey);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-[480px] p-0 bg-[#08090d] border border-white/[0.08] overflow-hidden">
        {/* Header glow */}
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#C5FF00]/[0.07] to-transparent pointer-events-none" />

        <div className="relative p-6 md:p-8">
          {/* Close */}
          <button onClick={handleClose}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-white/70 hover:bg-white/[0.05] transition-all">
            <X className="w-4 h-4" />
          </button>

          {/* Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#C5FF00]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5FF00]/60">Kraitin Pro</span>
          </div>

          <h2 className="text-xl font-black text-white mb-1 text-balance">
            {headline ?? 'Unlock Kraitin Pro'}
          </h2>
          <p className="text-[13px] text-white/35 mb-5 leading-relaxed">
            {feature
              ? `${feature} is a Pro feature.`
              : 'Access all 5 AI Agents, Startup Teardowns, Blueprints, Workspace, Watchlists and 500 monthly credits.'}
          </p>

          {/* Plan toggle */}
          <div className="flex items-center gap-2 p-1 bg-white/[0.04] rounded-xl border border-white/[0.06] mb-5">
            {(['monthly', 'yearly'] as const).map(p => (
              <button key={p} onClick={() => setPlan(p)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-semibold transition-all',
                  plan === p ? 'bg-[#C5FF00] text-black' : 'text-white/35 hover:text-white/65',
                )}>
                {p === 'monthly' ? (
                  <span>Monthly <span className="font-black">$49</span><span className="text-[11px] font-normal opacity-70">/mo</span></span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Yearly <span className="font-black">$490</span><span className="text-[11px] font-normal opacity-70">/yr</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', plan === 'yearly' ? 'bg-black/20' : 'bg-green-400/20 text-green-400')}>SAVE 17%</span>
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-6">
            {FEATURES.map(f => (
              <div key={f} className="flex items-start gap-2">
                <Check className="w-3 h-3 text-[#C5FF00] shrink-0 mt-0.5" />
                <span className="text-[11px] text-white/45 leading-snug">{f}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button onClick={handleUpgrade}
            className="w-full h-11 rounded-xl bg-[#C5FF00] text-black text-[13px] font-black hover:bg-[#C5FF00]/90 transition-all flex items-center justify-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5" />
            {plan === 'monthly' ? 'Start Pro — $49/month' : 'Start Pro — $490/year'}
          </button>
          <div className="flex items-center justify-center gap-3 text-[10px] text-white/20">
            <span className="flex items-center gap-1"><Check className="w-2.5 h-2.5" /> Cancel anytime</span>
            <span className="flex items-center gap-1"><Check className="w-2.5 h-2.5" /> No hidden fees</span>
            <span className="flex items-center gap-1"><Star className="w-2.5 h-2.5" /> Instant access</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
