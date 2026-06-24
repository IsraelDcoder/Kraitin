
-- Add data_privacy_settings column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS data_privacy_settings jsonb NOT NULL DEFAULT '{"allow_personalized":true,"allow_ai_learning":true,"allow_analytics":true}';

-- Function for hard-deleting a user's data (workspace data only, not auth user)
CREATE OR REPLACE FUNCTION public.delete_user_workspace_data(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.reports        WHERE user_id = p_user_id;
  DELETE FROM public.watchlist      WHERE user_id = p_user_id;
  DELETE FROM public.saved_items    WHERE user_id = p_user_id;
  DELETE FROM public.kira_messages  WHERE user_id = p_user_id;
  DELETE FROM public.content_drafts WHERE user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_workspace_data(uuid) TO authenticated;
