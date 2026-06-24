import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Supabase sends the user session via hash fragment; listen for PASSWORD_RECOVERY event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Failed to reset password. The link may have expired.');
      return;
    }

    toast.success('Password updated! Redirecting to dashboard…');
    setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#C5FF00] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(197,255,0,0.4)]">
            <span className="text-black font-black text-xl">K</span>
          </div>
        </div>

        <div
          className="rounded-2xl border border-white/[0.08] p-8"
          style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)' }}
        >
          {!ready ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-8 h-8 border-2 border-white/20 border-t-[#C5FF00] rounded-full animate-spin mx-auto" />
              <p className="text-white/40 text-sm">Verifying reset link…</p>
              <p className="text-white/20 text-xs">
                If this takes too long,{' '}
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="text-[#C5FF00]/60 hover:text-[#C5FF00] underline transition-colors"
                >
                  request a new link
                </button>
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-[#C5FF00]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white mb-1">Set new password</h2>
                  <p className="text-white/40 text-sm">Choose a strong password for your account.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">New Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="Min 8 characters"
                      autoComplete="new-password"
                      className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C5FF00]/40 transition-colors"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C5FF00]/40 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C5FF00] text-black font-bold py-3.5 rounded-xl hover:bg-[#C5FF00]/90 transition-all hover:shadow-[0_0_25px_rgba(197,255,0,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {loading
                    ? <span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                    : <>Set New Password <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
