/**
 * Shared theme constants and imperative helper used by both
 * useThemeApplier (runtime persistence) and WorkspaceSettings (live preview).
 */

export const VALID_THEMES = ['Dark', 'Midnight', 'Graphite', 'Obsidian', 'Light'] as const;
export type ThemeName = typeof VALID_THEMES[number];

export const CLASS_MAP: Record<ThemeName, string> = {
  Dark:     'theme-dark',
  Midnight: 'theme-midnight',
  Graphite: 'theme-graphite',
  Obsidian: 'theme-obsidian',
  Light:    'theme-light',
};

const ALL_THEME_CLASSES = Object.values(CLASS_MAP);

/** Imperatively applies a theme class to <html> and syncs color-scheme. */
export function applyTheme(name: ThemeName): void {
  const html = document.documentElement;
  html.classList.remove(...ALL_THEME_CLASSES);
  html.classList.add(CLASS_MAP[name]);
  html.style.colorScheme = name === 'Light' ? 'light' : 'dark';
}
