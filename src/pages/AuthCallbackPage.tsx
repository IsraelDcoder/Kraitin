import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Landing page for OAuth redirects (e.g. Google).
 * Supabase auto-handles the token exchange from the URL hash;
 * onAuthStateChange fires and sets the user in AuthContext.
 *
 * We wait for BOTH loading and profileReady before routing so we always
 * have the authoritative onboarding_completed value from the profiles table:
 *   • onboarding_completed = true  → returning user → /opportunities
 *   • onboarding_completed = false → new user        → /onboarding
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { user, profile, loading, profileReady, onboardingCompleted } = useAuth();

  useEffect(() => {
    // Wait for both the session check and the profile fetch to complete.
    if (loading || !profileReady) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (onboardingCompleted) {
      navigate('/opportunities', { replace: true });
    } else {
      navigate('/onboarding', { replace: true });
    }
  }, [user, profile, loading, profileReady, onboardingCompleted, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#C5FF00] flex items-center justify-center shadow-[0_0_30px_rgba(197,255,0,0.4)]">
          <span className="text-black font-black text-xl">K</span>
        </div>
        <div className="w-6 h-6 border-2 border-white/20 border-t-[#C5FF00] rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Signing you in…</p>
      </div>
    </div>
  );
}
