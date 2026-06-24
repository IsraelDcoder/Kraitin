/**
 * useThemeApplier
 * Reads the saved workspace_settings.theme from the user's profile and
 * applies the matching CSS class via the shared applyTheme helper.
 * Falls back to 'Dark' for unauthenticated / default users.
 */
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { applyTheme, VALID_THEMES, type ThemeName } from '@/lib/theme';

export function useThemeApplier(): void {
  const { profile } = useAuth();

  useEffect(() => {
    const ws = (profile as any)?.workspace_settings;
    const saved = ws?.theme as string | undefined;
    const resolved: ThemeName =
      saved && VALID_THEMES.includes(saved as ThemeName)
        ? (saved as ThemeName)
        : 'Dark';
    applyTheme(resolved);
  }, [profile]);
}
