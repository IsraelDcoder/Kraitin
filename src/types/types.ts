export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  onboarding_completed: boolean;
  onboarding_step: number | null;
  /** True once the user has seen/dismissed the first-time guide. Synced across devices. */
  guide_seen: boolean;
  /** Whether the user receives the daily 7am trending opportunities digest email. */
  digest_emails: boolean;
  /** Whether the user receives the Sunday weekly recap email. */
  weekly_digest_emails: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  /** Simplified: 'free' | 'pro' */
  tier: 'free' | 'pro';
  status: 'active' | 'past_due' | 'cancelled';
  /** Credits available this billing cycle */
  credits_remaining: number;
  /** Max credits per cycle (500 for Pro, 0 for Free) */
  credits_limit: number;
  /** @deprecated use credits_limit */
  monthly_credits?: number;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus = Subscription['status'];

export interface Opportunity {
  id: string;
  title: string;
  category: string;
  description: string | null;
  revenue_estimate: string | null;
  downloads: string | null;
  growth_velocity: string | null;
  growth_percent: number | null;
  competition_score: number | null;
  opportunity_score: number | null;
  market_size: string | null;
  tags: string[];
  is_hidden_gem: boolean;
  created_at: string;
}

export interface Competitor {
  id: string;
  name: string;
  category: string | null;
  revenue_estimate: string | null;
  downloads: string | null;
  pricing: string | null;
  monthly_traffic: string | null;
  growth_percent: number | null;
  seo_score: number | null;
  tiktok_followers: string | null;
  youtube_subs: string | null;
  instagram_followers: string | null;
  ad_spend_estimate: string | null;
  website_url: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  title: string;
  type: 'research' | 'validation' | 'competitor' | 'mvp' | 'launch';
  content: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FounderProfile {
  id: string;
  user_id: string;
  interests: string[];
  founder_type: string;
  primary_goal: string;
  experience_level: string;
  launch_budget: string;
  build_preference: string;
  biggest_struggle: string;
  founder_archetype: string;
  strengths: string[];
  weaknesses: string[];
  recommended_categories: string[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavedItem {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  notes: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}

/* ── Affiliate System ─────────────────────────────────────── */

export interface Affiliate {
  id: string;
  user_id: string;
  referral_code: string;
  status: 'pending' | 'active' | 'suspended';
  total_clicks: number;
  total_signups: number;
  total_trials: number;
  total_paid: number;
  total_commission: number;
  lifetime_earnings: number;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
}

export interface ReferralEvent {
  id: string;
  affiliate_id: string;
  event_type: 'click' | 'signup' | 'trial' | 'paid' | 'churned';
  referred_user: string | null;
  amount: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Payout {
  id: string;
  affiliate_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  period_start: string;
  period_end: string;
  paid_at: string | null;
  payment_method: string | null;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

