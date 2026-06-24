import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';

export type PaywallEventType = 'viewed' | 'upgrade_clicked' | 'dismissed';

export interface TrackPaywallEventOptions {
  feature: string;
  source?: string;
  plan?: 'monthly' | 'yearly';
}

/**
 * Hook for tracking paywall interactions.
 * Logs to `paywall_events` table for conversion analytics.
 */
export function usePaywallAnalytics() {
  const { user } = useAuth();

  const track = useCallback(
    async (eventType: PaywallEventType, opts: TrackPaywallEventOptions) => {
      try {
        await supabase.from('paywall_events').insert({
          user_id: user?.id ?? null,
          event_type: eventType,
          feature: opts.feature,
          source: opts.source ?? window.location.pathname,
          plan: opts.plan ?? null,
        });
      } catch {
        // Analytics failures must never disrupt UX — silently swallow
      }
    },
    [user],
  );

  const trackViewed = useCallback(
    (feature: string, source?: string) => track('viewed', { feature, source }),
    [track],
  );

  const trackUpgradeClicked = useCallback(
    (feature: string, plan?: 'monthly' | 'yearly', source?: string) =>
      track('upgrade_clicked', { feature, plan, source }),
    [track],
  );

  const trackDismissed = useCallback(
    (feature: string, source?: string) => track('dismissed', { feature, source }),
    [track],
  );

  return { track, trackViewed, trackUpgradeClicked, trackDismissed };
}
