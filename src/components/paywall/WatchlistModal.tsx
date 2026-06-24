import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Check, Zap, X, Bookmark } from 'lucide-react';
import { usePaywallAnalytics } from '@/hooks/usePaywallAnalytics';

interface Props { open: boolean; onClose: () => void; }

export function WatchlistModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { trackUpgradeClicked, trackDismissed } = usePaywallAnalytics();

  const handleClose = () => {
    trackDismissed('watchlist');
    onClose();
  };

  const handleUpgrade = () => {
    trackUpgradeClicked('watchlist', 'yearly');
    onClose();
    navigate('/billing?plan=yearly');
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-[380px] p-0 bg-[#08090d] border border-white/[0.08]">
        <div className="p-6">
          <button onClick={handleClose}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-white/60 transition-all">
            <X className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center mb-4">
            <Bookmark className="w-4 h-4 text-[#C5FF00]" />
          </div>
          <h3 className="text-base font-black text-white mb-1">Unlock Watchlists</h3>
          <p className="text-[12px] text-white/35 mb-4 leading-relaxed">
            Save opportunities, track competitors, and receive intelligent alerts.
          </p>
          <div className="space-y-1.5 mb-5">
            {['Track opportunities over time','Monitor competitor moves','Save startup ideas','Receive market alerts','Build your idea shortlist'].map(f => (
              <div key={f} className="flex items-center gap-2">
                <Check className="w-3 h-3 text-[#C5FF00] shrink-0" />
                <span className="text-[11px] text-white/45">{f}</span>
              </div>
            ))}
          </div>
          <button onClick={handleUpgrade}
            className="w-full h-9 rounded-xl bg-[#C5FF00] text-black text-[12px] font-black hover:bg-[#C5FF00]/90 transition-all flex items-center justify-center gap-1.5">
            <Zap className="w-3 h-3" /> Upgrade To Pro
          </button>
          <p className="text-[10px] text-white/18 text-center mt-2">No credit card required</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
