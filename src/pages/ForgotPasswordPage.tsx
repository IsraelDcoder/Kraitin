import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Please enter your email address'); return; }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Failed to send reset email. Please try again.');
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <Link
        to="/login"
        className="absolute top-6 left-6 flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to login
      </Link>

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
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7 text-[#C5FF00]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-2">Check your inbox</h2>
                <p className="text-white/40 text-sm leading-relaxed">
                  We sent a password reset link to <span className="text-white/70">{email}</span>.
                  The link expires in 1 hour.
                </p>
              </div>
              <p className="text-white/25 text-xs">
                Didn't receive it?{' '}
                <button
                  onClick={() => setSent(false)}
                  className="text-[#C5FF00]/70 hover:text-[#C5FF00] transition-colors underline"
                >
                  Try again
                </button>
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-black text-white mb-1">Reset your password</h2>
                <p className="text-white/40 text-sm">
                  Enter your account email and we'll send a secure reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="founder@company.com"
                      autoComplete="email"
                      className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C5FF00]/40 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C5FF00] text-black font-bold py-3.5 rounded-xl hover:bg-[#C5FF00]/90 transition-all hover:shadow-[0_0_25px_rgba(197,255,0,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading
                    ? <span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                    : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
