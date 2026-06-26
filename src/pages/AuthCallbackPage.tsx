import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';

function isOAuthCallbackUrl(url: string) {
  const parsed = new URL(url, window.location.origin);
  const hasAuthFragment = parsed.hash.includes('access_token=') || parsed.hash.includes('error_description=');
  const searchParams = parsed.searchParams;
  const hasOAuthCode = searchParams.has('code') || searchParams.has('state') || searchParams.has('error');
  return parsed.pathname === '/auth/callback' && (hasAuthFragment || hasOAuthCode);
}

/**
 * Landing page for OAuth redirects (e.g. Google).
 * We explicitly poll the Supabase auth session on callback URLs so we
 * don't accidentally redirect back to /login before the callback resolves.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { user, loading, profileReady, onboardingCompleted } = useAuth();
  const callbackUrl = useMemo(() => isOAuthCallbackUrl(window.location.href), []);
  const [waitingForCallback, setWaitingForCallback] = useState(callbackUrl);

  useEffect(() => {
    if (!callbackUrl) return;

    let interval: number | undefined;
    const timeout = window.setTimeout(() => {
      setWaitingForCallback(false);
      if (interval) window.clearInterval(interval);
    }, 8000);

    interval = window.setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setWaitingForCallback(false);
        if (interval) window.clearInterval(interval);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      if (interval) window.clearInterval(interval);
    };
  }, [callbackUrl]);

  useEffect(() => {
    if (waitingForCallback || loading || !profileReady) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    // If onboarding is unfinished, route to onboarding. Otherwise go to app.
    navigate(onboardingCompleted ? '/opportunities' : '/onboarding', { replace: true });
  }, [user, loading, profileReady, onboardingCompleted, waitingForCallback, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#C5FF00] flex items-center justify-center shadow-[0_0_30px_rgba(197,255,0.4)]">
          <span className="text-black font-black text-xl">K</span>
        </div>
        <div className="w-6 h-6 border-2 border-white/20 border-t-[#C5FF00] rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Signing you in…</p>
      </div>
    </div>
  );
}
