/**
 * /ref/:code — Captures referral code into cookie + localStorage,
 * then redirects to homepage. Works before the user is logged in.
 */
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storeReferralCode } from '@/lib/referral';
import { supabase } from '@/db/supabase';

export default function ReferralRedirectPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      if (code) {
        storeReferralCode(code);

        // Fire a click event to the edge function (non-blocking)
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-affiliate-click`,
            { method: 'POST', headers, body: JSON.stringify({ referral_code: code }) }
          );
        } catch (_) { /* click tracking is best-effort */ }
      }
      navigate('/', { replace: true });
    };
    run();
  }, [code, navigate]);

  return null; // immediate redirect — no flash
}
