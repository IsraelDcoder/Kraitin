/**
 * useReferralCapture — Call once in App.tsx (or any top-level component).
 * Reads ?ref= from the current URL and persists it to cookie + localStorage.
 * This catches referrals that arrive at any page, not just /ref/:code.
 */
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { storeReferralCode } from '@/lib/referral';

export function useReferralCapture(): void {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) storeReferralCode(ref);
  }, [searchParams]);
}
