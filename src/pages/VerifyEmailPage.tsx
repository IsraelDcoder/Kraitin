import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, RefreshCw, LogOut } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);

  async function resendEmail() {
    if (!user?.email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    });
    if (error) {
      toast.error('Failed to resend: ' + error.message);
    } else {
      setSent(true);
      toast.success('Verification email sent! Check your inbox.');
    }
    setResending(false);
  }

  async function checkVerification() {
    const { data: { user: fresh } } = await supabase.auth.getUser();
    if (fresh?.email_confirmed_at) {
      toast.success('Email verified! Welcome to Kraitin.');
      navigate('/dashboard');
    } else {
      toast.info('Email not yet verified. Please check your inbox.');
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-[#070B14] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-6">
          <Mail className="w-7 h-7 text-white/40" />
        </div>

        {/* Heading */}
        <h1 className="text-xl font-black text-white tracking-tight mb-2">
          Verify your email
        </h1>
        <p className="text-[13px] text-white/40 leading-relaxed mb-1">
          We sent a verification link to:
        </p>
        <p className="text-[14px] font-medium text-white/70 mb-6">
          {user?.email ?? 'your email address'}
        </p>
        <p className="text-[12px] text-white/30 mb-8">
          Click the link in the email to activate your account.
          Check your spam folder if you don't see it.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={checkVerification}
            className="w-full h-10 rounded-xl bg-[#C5FF00] text-black text-[13px] font-bold hover:bg-[#d4ff33] transition-colors"
          >
            I've verified my email
          </button>

          {!sent ? (
            <button
              onClick={resendEmail}
              disabled={resending}
              className="w-full h-10 rounded-xl border border-white/[0.08] text-white/50 text-[13px] hover:border-white/15 hover:text-white/70 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {resending
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />}
              Resend verification email
            </button>
          ) : (
            <p className="text-[12px] text-[#C5FF00]/60 py-2">
              Email sent! Check your inbox and spam folder.
            </p>
          )}

          <button
            onClick={handleSignOut}
            className="w-full h-9 text-white/20 text-[12px] hover:text-white/40 transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3 h-3" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
