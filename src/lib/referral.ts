/**
 * Referral tracking utilities.
 * Stores the referral code in BOTH a 90-day cookie AND localStorage
 * so attribution survives page refresh, logout, and browser restart.
 */

const KEY = 'kraitin_ref';
const COOKIE_DAYS = 90;

function setCookie(value: string): void {
  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_DAYS);
  document.cookie = `${KEY}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookie(): string | null {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${KEY}=`));
  if (!match) return null;
  return decodeURIComponent(match.split('=')[1]);
}

/** Persist a referral code to cookie + localStorage. */
export function storeReferralCode(code: string): void {
  if (!code) return;
  setCookie(code);
  try { localStorage.setItem(KEY, code); } catch (_) { /* ignore */ }
}

/** Read the stored referral code (cookie takes priority, fallback to localStorage). */
export function getStoredReferralCode(): string | null {
  return getCookie() ?? ((() => { try { return localStorage.getItem(KEY); } catch (_) { return null; } })());
}

/** Clear referral code after it has been attributed to a signup. */
export function clearReferralCode(): void {
  document.cookie = `${KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  try { localStorage.removeItem(KEY); } catch (_) { /* ignore */ }
}
