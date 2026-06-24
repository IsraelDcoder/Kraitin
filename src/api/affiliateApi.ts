import { supabase } from '@/db/supabase';
import type { Affiliate, ReferralEvent, Payout } from '@/types/types';

const PAGE_SIZE = 20;

/** Get or auto-create the affiliate record for the current user */
export async function getOrCreateAffiliate(userId: string): Promise<Affiliate | null> {
  // try existing
  const { data: existing, error: fetchErr } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (fetchErr) { console.error('affiliateApi: fetch error', fetchErr); return null; }
  if (existing) return existing as Affiliate;

  // create new
  const code = `KR-${userId.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const { error: insErr } = await supabase
    .from('affiliates')
    .insert({ user_id: userId, referral_code: code, status: 'active' });
  if (insErr) { console.error('affiliateApi: insert error', insErr); return null; }

  const { data: fresh } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return (fresh as Affiliate) ?? null;
}

/** Paginated referral events newest-first */
export async function getReferralEvents(
  affiliateId: string,
  cursor?: string,
): Promise<{ items: ReferralEvent[]; nextCursor: string | null }> {
  let q = supabase
    .from('referral_events')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);
  if (cursor) q = q.lt('created_at', cursor);
  const { data, error } = await q;
  if (error) { console.error('affiliateApi: events error', error); return { items: [], nextCursor: null }; }
  const items = Array.isArray(data) ? (data as ReferralEvent[]) : [];
  const nextCursor = items.length === PAGE_SIZE ? items[items.length - 1].created_at : null;
  return { items, nextCursor };
}

/** Paginated payouts newest-first */
export async function getPayouts(
  affiliateId: string,
  cursor?: string,
): Promise<{ items: Payout[]; nextCursor: string | null }> {
  let q = supabase
    .from('payouts')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);
  if (cursor) q = q.lt('created_at', cursor);
  const { data, error } = await q;
  if (error) { console.error('affiliateApi: payouts error', error); return { items: [], nextCursor: null }; }
  const items = Array.isArray(data) ? (data as Payout[]) : [];
  const nextCursor = items.length === PAGE_SIZE ? items[items.length - 1].created_at : null;
  return { items, nextCursor };
}
