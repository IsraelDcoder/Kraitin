-- Add preferences JSONB to profiles for AI cofounder and notification settings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{}';

-- Add notification_preferences JSONB to profiles
-- This will store email + in-app preferences and frequency
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{}';

-- Add notification_sent_at tracking on subscriptions for trial reminders
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS trial_reminder_sent boolean NOT NULL DEFAULT false;

-- Update existing profiles to have empty objects
UPDATE public.profiles SET preferences = '{}' WHERE preferences IS NULL;
UPDATE public.profiles SET notification_preferences = '{}' WHERE notification_preferences IS NULL;
