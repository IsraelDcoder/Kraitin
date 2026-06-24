import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Lock } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

interface PaywallModalProps {
  feature?: string;
  onClose?: () => void;
}

const proFeatures = [
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

export function PaywallModal({ feature, onClose }: PaywallModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const startCheckout = async () => {
    setLoading(true);
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
        body: JSON.stringify({ plan: 'monthly' }),
      });
      const json = await res.json();
      if (json.code !== 'SUCCESS' || !json.data?.url) throw new Error(json.message || 'Failed to create checkout');
      window.open(json.data.url, '_blank');
      onClose?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed. Check Stripe configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* modal */}
      <div className="relative w-full max-w-[calc(100%-2rem)] md:max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-7 shadow-2xl">
        {/* icon */}
        <div className="w-11 h-11 rounded-xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-5 h-5 text-[#C5FF00]" />
        </div>

        {/* heading */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-black text-white mb-2 text-balance">Unlock Kraitin Pro</h2>
          <p className="text-white/40 text-sm text-pretty">
            {feature
              ? `${feature} is a Pro feature.`
              : 'Access all 5 AI Agents, Startup Teardowns, Blueprints, Workspace, Watchlists and 500 monthly credits.'}
          </p>
        </div>

        {/* features grid */}
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6">
          {proFeatures.map((f) => (
            <li key={f} className="flex items-center gap-2 text-xs text-white/50">
              <Check className="w-3.5 h-3.5 text-[#C5FF00] shrink-0" />{f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          disabled={loading}
          onClick={startCheckout}
          className="w-full h-11 rounded-xl bg-[#C5FF00] text-black font-bold text-sm hover:bg-[#C5FF00]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Zap className="w-4 h-4" />
          {loading ? 'Redirecting…' : 'Upgrade To Pro — $49/month'}
        </button>

        <p className="text-center text-xs text-white/20 mt-3">Cancel anytime. Instant access after payment.</p>

        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/60 text-xl transition-colors">×</button>
        )}
      </div>
    </div>
  );
}
