import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PUBLIC_PATHS = ['/', '/login', '/onboarding', '/auth/callback',
  '/terms', '/privacy', '/contact', '/affiliate',
  '/forgot-password', '/reset-password', '/verify-email'];

/**
 * RequireEmailVerified — wraps all non-public routes.
 * - Loading: show spinner.
 * - No user: redirect to /login.
 * - User exists but email NOT confirmed AND path is not public/verify: redirect to /verify-email.
 * - Otherwise: render children.
 */
export function RequireEmailVerified({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070B14]">
        <div className="w-7 h-7 border-2 border-[#C5FF00]/30 border-t-[#C5FF00] rounded-full animate-spin" />
      </div>
    );
  }

  const path = window.location.pathname;
  const isPublic = PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'));

  // Not logged in on a protected route → login
  if (!user && !isPublic) return <Navigate to="/login" replace />;

  // Logged in but email not confirmed → verify email page
  if (user && !user.email_confirmed_at && !isPublic && path !== '/verify-email') {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
}
