import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Check, Zap, X, FileDown } from 'lucide-react';
import { usePaywallAnalytics } from '@/hooks/usePaywallAnalytics';

interface Props { open: boolean; onClose: () => void; }

const FORMATS = [
  { ext: 'PDF',      desc: 'Formatted report for sharing' },
  { ext: 'DOCX',     desc: 'Editable Word document' },
  { ext: 'Markdown', desc: 'Developer-friendly format' },
  { ext: 'CSV',      desc: 'Spreadsheet-ready data' },
];

export function ExportPaywallModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { trackUpgradeClicked, trackDismissed } = usePaywallAnalytics();

  const handleClose = () => {
    trackDismissed('export');
    onClose();
  };

  const handleUpgrade = () => {
    trackUpgradeClicked('export', 'yearly');
    onClose();
    navigate('/billing?plan=yearly');
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-[400px] p-0 bg-[#08090d] border border-white/[0.08] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#C5FF00]/[0.05] to-transparent pointer-events-none" />
        <div className="relative p-6">
          <button onClick={handleClose}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-white/25 hover:text-white/60 transition-all">
            <X className="w-4 h-4" />
          </button>

          <div className="w-9 h-9 rounded-xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center mb-4">
            <FileDown className="w-4 h-4 text-[#C5FF00]" />
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1">Premium Feature</p>
          <h3 className="text-base font-black text-white mb-1.5">Unlock Report Exports</h3>
          <p className="text-[12px] text-white/35 mb-4 leading-relaxed">
            Export your startup intelligence reports in professional formats — ready to share with co-founders, investors, or your team.
          </p>

          {/* Format grid */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {FORMATS.map(({ ext, desc }) => (
              <div key={ext} className="flex items-start gap-2 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <Check className="w-3 h-3 text-[#C5FF00] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] font-bold text-white/75">{ext}</p>
                  <p className="text-[10px] text-white/30 leading-tight">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleUpgrade}
            className="w-full h-9 rounded-xl bg-[#C5FF00] text-black text-[12px] font-black hover:bg-[#C5FF00]/90 transition-all flex items-center justify-center gap-1.5">
            <Zap className="w-3 h-3" /> Upgrade To Pro
          </button>
          <p className="text-[10px] text-white/18 text-center mt-2">No credit card required · Cancel anytime</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
