/**
 * GuideContext — manages the first-time onboarding guide state.
 *
 * - Auto-shows the guide for users whose profile.guide_seen === false.
 * - Persists dismissal to profiles.guide_seen in the DB (syncs across devices).
 * - Falls back to localStorage as a fast-path cache to avoid DB round-trips.
 * - Exposes openGuide() so any component (e.g. sidebar) can re-open it.
 */
import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';

/* ── localStorage fast-path key ───────────────────────────── */
const localKey = (id: string) => `kraitin_guide_seen_${id}`;

/* ── Context shape ────────────────────────────────────────── */
interface GuideContextType {
  isOpen: boolean;
  openGuide: () => void;
  closeGuide: () => void;
}

const GuideContext = createContext<GuideContextType>({
  isOpen: false,
  openGuide: () => {},
  closeGuide: () => {},
});

export function useGuide() {
  return useContext(GuideContext);
}

/* ── Provider ─────────────────────────────────────────────── */
export function GuideProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Determine whether to auto-show on mount
  useEffect(() => {
    if (!user || initialized) return;
    // profile may still be loading; wait until it's available
    if (profile === null) return; // null = not yet loaded (undefined = no user)

    // Fast-path: if already cached locally, skip DB
    const localSeen = localStorage.getItem(localKey(user.id)) === '1';
    if (localSeen || profile.guide_seen) {
      setInitialized(true);
      return;
    }

    // First time: show after a short delay so the dashboard renders first
    const t = setTimeout(() => setIsOpen(true), 800);
    setInitialized(true);
    return () => clearTimeout(t);
  }, [user, profile, initialized]);

  const markSeen = useCallback(async () => {
    if (!user) return;
    const isFirstTime = !profile?.guide_seen;

    // Write to DB so state syncs across devices
    await supabase
      .from('profiles')
      .update({ guide_seen: true })
      .eq('id', user.id);
    // Also cache locally so subsequent page loads skip the DB check
    localStorage.setItem(localKey(user.id), '1');

    // Send welcome email only on first-ever guide completion
    if (isFirstTime) {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (token) {
        supabase.functions.invoke('send-welcome-email', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => { /* welcome email is best-effort */ });
      }
    }
  }, [user, profile]);

  const closeGuide = useCallback(() => {
    setIsOpen(false);
    markSeen();
  }, [markSeen]);

  // Re-open: clears local cache + DB flag then opens immediately
  const openGuide = useCallback(async () => {
    if (!user) return;
    // Clear persistence so the guide can show again
    localStorage.removeItem(localKey(user.id));
    await supabase
      .from('profiles')
      .update({ guide_seen: false })
      .eq('id', user.id);
    setIsOpen(true);
  }, [user]);

  return (
    <GuideContext.Provider value={{ isOpen, openGuide, closeGuide }}>
      {children}
    </GuideContext.Provider>
  );
}
