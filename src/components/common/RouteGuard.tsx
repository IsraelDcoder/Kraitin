import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { RouteConfig } from '@/routes';

interface RouteGuardProps {
  children: React.ReactNode;
}

// Public routes — authentication not required
const SYSTEM_PUBLIC_ROUTES = ['/login', '/403', '/404'];
const STATIC_PUBLIC_PATHS = ['/', '/login', '/onboarding', '/auth/callback', '/terms', '/privacy', '/contact', '/affiliate'];
const PUBLIC_ROUTES = [...new Set([...SYSTEM_PUBLIC_ROUTES, ...STATIC_PUBLIC_PATHS])];

function matchPublicRoute(path: string, patterns: string[]) {
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(path);
    }
    return path === pattern;
  });
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading, profileReady, onboardingCompleted } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for both initial session load and profile fetch
    if (loading || !profileReady) return;

    const isPublic = matchPublicRoute(location.pathname, PUBLIC_ROUTES);

    // 1. Not authenticated → redirect to login (except public routes)
    if (!user && !isPublic) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    // 2. Authenticated but onboarding not completed → redirect to onboarding
    //    (except when already on onboarding or public routes)
    if (user && !isPublic && location.pathname !== '/onboarding' && !onboardingCompleted) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, loading, profileReady, onboardingCompleted, location.pathname, navigate]);

  if (loading || !profileReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#C5FF00]/10 border border-[#C5FF00]/20 flex items-center justify-center">
            <span className="text-[#C5FF00] font-black text-base">K</span>
          </div>
          <div className="w-5 h-5 border-2 border-white/10 border-t-[#C5FF00] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}