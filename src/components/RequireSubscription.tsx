import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * RequireSubscription — wraps routes that require a paid subscription.
 * - While auth is loading: renders a minimal spinner (avoids flashing redirects).
 * - Not logged in: redirects to /login.
 * - Free plan: redirects to /billing with a `reason` query param.
 * - Premium: renders children.
 */
export function RequireSubscription({ children }: { children: ReactNode }) {
  const { user, premiumAccess, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-7 h-7 border-2 border-[#C5FF00]/30 border-t-[#C5FF00] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!premiumAccess) return <Navigate to="/billing?reason=paywall" replace />;

  return <>{children}</>;
}
