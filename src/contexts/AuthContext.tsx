import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import type { AuthChangeEvent, PostgrestMaybeSingleResponse, User } from '@supabase/supabase-js';
import type { Profile, Subscription, FounderProfile } from '@/types/types';

function isSupabaseLockError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const message = 'message' in error ? (error as any).message : undefined;
  return typeof message === 'string' && message.includes('stole it');
}

async function retrySupabaseQuery<T>(fn: () => PromiseLike<PostgrestMaybeSingleResponse<T>>) {
  let lastError: unknown = null;
  const maxAttempts = 2;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const { data, error } = await fn();
    if (!error) return { data, error: null };
    lastError = error;
    if (attempt + 1 < maxAttempts && isSupabaseLockError(error)) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      continue;
    }
    return { data: null, error };
  }
  return { data: null, error: lastError };
}

export async function getFounderProfile(userId: string): Promise<FounderProfile | null> {
  const { data, error } = await retrySupabaseQuery<FounderProfile>(() =>
    supabase
      .from('founder_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
  );
  if (error) {
    console.error('Failed to get founder profile:', error);
    return null;
  }
  return data;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await retrySupabaseQuery<Profile>(() =>
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(),
  );

  if (error) {
    console.error('Failed to fetch profile:', error);
    return null;
  }
  return data;
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await retrySupabaseQuery<Subscription>(() =>
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
  );
  if (error) {
    console.error('Failed to get subscription:', error);
    return null;
  }
  return data;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  founderProfile: FounderProfile | null;
  subscription: Subscription | null;
  loading: boolean;
  /** True once the initial profile fetch has settled (success or null) after login. */
  profileReady: boolean;
  /** True when user is on a paid tier (tier === 'pro'). */
  premiumAccess: boolean;
  /** @deprecated Use premiumAccess instead */
  isSubscribed: boolean;
  onboardingCompleted: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithUsername: (username: string, email: string, password: string, referralCode?: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: (flow?: 'login' | 'signup') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// A stable default prevents HMR context-mismatch crashes (new module instance
// vs old Provider reference). The throw guard in useAuth() catches real misuse.
const _authCtxDefault: AuthContextType = {
  user: null, profile: null, founderProfile: null, subscription: null,
  loading: true, profileReady: false, premiumAccess: false, isSubscribed: false,
  onboardingCompleted: false,
  signInWithUsername: async () => ({ error: null }),
  signUpWithUsername: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
};
const AuthContext = createContext<AuthContextType>(_authCtxDefault);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [founderProfile, setFounderProfile] = useState<FounderProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  /** Tracks whether the profile fetch after the latest auth event has completed. */
  const [profileReady, setProfileReady] = useState(false);
  const requestId = useRef(0);
  const loadedUserId = useRef<string | null>(null);

  const loadUserData = async (
    userId: string,
    opts?: { allowRetry?: boolean; force?: boolean }
  ) => {
    const currentRequestId = ++requestId.current;

    if (loadedUserId.current === userId && !opts?.force) {
      setProfileReady(true);
      return;
    }

    setProfileReady(false);

    const maxAttempts = opts?.allowRetry ? 5 : 1;
    const delayMs = 400;

    let profileData: Profile | null = null;
    const subscriptionPromise = getSubscription(userId);
    const founderProfilePromise = getFounderProfile(userId);

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        profileData = await getProfile(userId);
        if (profileData || attempt === maxAttempts) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      if (currentRequestId !== requestId.current) {
        return;
      }

      const [subscriptionData, founderProfileData] = await Promise.all([
        subscriptionPromise,
        founderProfilePromise,
      ]);

      if (currentRequestId !== requestId.current) {
        return;
      }

      setProfile(profileData);
      setSubscription(subscriptionData);
      setFounderProfile(founderProfileData);

      // Only cache a successful load.
      if (profileData) {
        loadedUserId.current = userId;
      } else {
        loadedUserId.current = null;
      }
    } catch (err) {
      if (currentRequestId === requestId.current) {
        console.error('loadUserData error:', err);
      }
    } finally {
      if (currentRequestId === requestId.current) {
        setProfileReady(true);
      }
    }
  };

  const refreshProfile = async (force = false) => {
    if (!user) {
      setProfile(null);
      setFounderProfile(null);
      setSubscription(null);
      setProfileReady(true);
      loadedUserId.current = null;
      return;
    }
    await loadUserData(user.id, {
      force,
      allowRetry: false,
    });
  };

  useEffect(() => {
    let canceled = false;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (canceled) return;

        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserData(session.user.id, { force: true });
        } else {
          setProfileReady(true);
        }
      } catch (error) {
        if (!canceled) console.error('Session error:', (error as Error).message);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
      if (canceled) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        if (
          session.user.id === loadedUserId.current &&
          event !== 'USER_UPDATED'
        ) {
          return;
        }

        const shouldRetry =
          event === 'SIGNED_IN' ||
          event === 'USER_UPDATED';

        void loadUserData(session.user.id, {
          allowRetry: shouldRetry,
        });

        return;
      }

      requestId.current += 1;
      loadedUserId.current = null;

      setProfile(null);
      setFounderProfile(null);
      setSubscription(null);
      setProfileReady(true);
    });

    return () => {
      canceled = true;
      authSub.unsubscribe();
    };
  }, []);

  const signInWithUsername = async (usernameOrEmail: string, password: string) => {
    try {
      let email = usernameOrEmail.trim().toLowerCase();
      // If the input doesn't look like an email, look up the real email by username
      if (!email.includes('@')) {
        const { data, error: lookupError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', email)
          .maybeSingle();
        if (lookupError || !data?.email) throw new Error('No account found with that username');
        email = data.email;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithUsername = async (username: string, email: string, password: string, referralCode?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { username, referred_by: referralCode ?? null },
        },
      });
      if (error) throw error;
      // If we have a referral code, also write it to the profile immediately
      // (the DB trigger sets it from auth.users.raw_user_meta_data, but we also
      //  store it here as belt-and-suspenders for instant availability)
      if (referralCode) {
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          await supabase
            .from('profiles')
            .update({ referred_by: referralCode })
            .eq('id', newUser.id);
        }
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async (flow: 'login' | 'signup' = 'login') => {
    try {
      // biome-ignore lint: signInWithOAuth is correct for consumer Google OAuth (not enterprise SAML)
      const redirectTo = `${window.location.origin}/auth/callback?flow=${flow}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    requestId.current += 1;
    loadedUserId.current = null;

    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setFounderProfile(null);
    setSubscription(null);
    setProfileReady(true);
  };

  const isSubscribed = subscription?.tier != null && subscription.tier !== 'free';
  const premiumAccess = isSubscribed;
  const onboardingCompleted = profile?.onboarding_completed === true;

  return (
    <AuthContext.Provider value={{ user, profile, founderProfile, subscription, loading, profileReady, premiumAccess, isSubscribed, onboardingCompleted, signInWithUsername, signUpWithUsername, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
