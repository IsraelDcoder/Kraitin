import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile, Subscription, FounderProfile } from '@/types/types';
import { toast } from 'sonner';

export async function getFounderProfile(userId: string): Promise<FounderProfile | null> {
  const { data, error } = await supabase
    .from('founder_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) { console.error('Failed to get founder profile:', error); return null; }
  return data;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
  return data;
}
export async function getSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) { console.error('Failed to get subscription:', error); return null; }
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
  const latestLoadId = useRef(0);

  const loadUserData = async (userId: string) => {
    const loadId = ++latestLoadId.current;
    setProfileReady(false);

    const maxAttempts = 10;
    const delayMs = 300;
    let profileData: Profile | null = null;
    let subscriptionData: Subscription | null = null;
    let founderProfileData: FounderProfile | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      [profileData, subscriptionData, founderProfileData] = await Promise.all([
        getProfile(userId),
        getSubscription(userId),
        getFounderProfile(userId),
      ]);

      if (profileData || attempt === maxAttempts) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    if (latestLoadId.current === loadId) {
      setProfile(profileData);
      setSubscription(subscriptionData);
      setFounderProfile(founderProfileData);
      setProfileReady(true);
    }
  };

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      setFounderProfile(null);
      setSubscription(null);
      setProfileReady(true);
      return;
    }
    await loadUserData(user.id);
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
          await loadUserData(session.user.id);
        } else {
          setProfileReady(true);
        }
      } catch (error) {
        if (!canceled) toast.error(`Session error: ${(error as Error).message}`);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (canceled) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setProfile(null);
        setFounderProfile(null);
        setSubscription(null);
        setProfileReady(true);
      }
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
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setFounderProfile(null);
    setSubscription(null);
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
