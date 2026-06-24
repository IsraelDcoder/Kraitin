import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Check, Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePaywallAnalytics } from '@/hooks/usePaywallAnalytics';

interface Props {
  open: boolean;
  onClose: () => void;
  reportType?: string;
  ideaTitle?: string;
}

const REPORT_BENEFITS: Record<string, { title: string; items: string[]; accent: string }> = {
  validation: {
    title: 'Validation Report',
    items: ['Customer Pain Points', 'Reddit Analysis', 'Market Demand Analysis', 'Build Recommendation', 'Risk Assessment', 'Validation Score'],
    accent: 'text-sky-400',
  },
  competitor: {
    title: 'Competitor Intelligence',
    items: ['Growth Strategy', 'Marketing Channels', 'Acquisition Tactics', 'Pricing Breakdown', 'Ad Strategy', 'Competitive Weaknesses'],
    accent: 'text-purple-400',
  },
  mvp: {
    title: 'MVP Planner',
    items: ['Feature List', 'User Stories', 'Database Schema', 'API Architecture', 'Development Roadmap', 'Tech Stack Recommendations'],
    accent: 'text-amber-400',
  },
  launch: {
    title: 'Launch Strategy',
    items: ['Go-to-Market Plan', 'Channel Strategy', 'Launch Timeline', 'Growth Loops', 'PR Strategy', 'Community Building'],
    accent: 'text-[#C5FF00]',
  },
  blueprint: {
    title: 'Complete Startup Blueprint',
    items: ['Validation Report', 'Competitor Analysis', 'MVP Plan', 'Technical Architecture', 'Launch Strategy', 'Marketing Plan', 'Financial Forecast', 'Growth Strategy'],
    accent: 'text-[#C5FF00]',
  },
  default: {
    title: 'AI Intelligence Report',
    items: ['Validation', 'Competitors', 'MVP Plan', 'Launch Strategy', 'Financials', 'Marketing'],
    accent: 'text-[#C5FF00]',
  },
};

export function ReportGenerationModal({ open, onClose, reportType = 'default', ideaTitle }: Props) {
  const navigate = useNavigate();
  const info = REPORT_BENEFITS[reportType] ?? REPORT_BENEFITS.default;
  const isBlueprint = reportType === 'blueprint';
  const { trackUpgradeClicked, trackDismissed } = usePaywallAnalytics();
  const featureKey = reportType;

  const handleClose = () => {
    trackDismissed(featureKey);
    onClose();
  };

  const handleUpgrade = () => {
    trackUpgradeClicked(featureKey, 'yearly');
    onClose();
    navigate('/billing?plan=yearly');
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-[460px] p-0 bg-[#08090d] border border-white/[0.08] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#C5FF00]/[0.06] to-transparent pointer-events-none" />

        <div className="relative p-6">
          <button onClick={handleClose}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-white/60 transition-all">
            <X className="w-4 h-4" />
          </button>

          <div className="w-9 h-9 rounded-xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center mb-4">
            <Zap className="w-4 h-4 text-[#C5FF00]" />
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1">Premium Feature</p>
          <h2 className="text-lg font-black text-white mb-1 text-balance">
            {isBlueprint ? 'Generate Complete Startup Blueprint' : "You're One Step Away"}
          </h2>
          {ideaTitle && (
            <p className="text-[12px] text-[#C5FF00]/60 font-semibold mb-2">{ideaTitle}</p>
          )}
          <p className="text-[13px] text-white/35 leading-relaxed mb-4">
            Generate complete founder-grade startup intelligence with your <span className="text-white/60">{info.title}</span>.
          </p>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mb-5">
            <p className={cn('text-[10px] font-bold uppercase tracking-wider mb-3', info.accent)}>Includes</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {info.items.map(item => (
                <div key={item} className="flex items-start gap-1.5">
                  <Check className="w-3 h-3 text-[#C5FF00] shrink-0 mt-0.5" />
                  <span className="text-[11px] text-white/50">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleUpgrade}
            className="w-full h-10 rounded-xl bg-[#C5FF00] text-black text-[13px] font-black hover:bg-[#C5FF00]/90 transition-all flex items-center justify-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5" />
            Upgrade To Pro
          </button>
          <p className="text-[10px] text-white/18 text-center">No credit card required · Cancel anytime · Instant access</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
