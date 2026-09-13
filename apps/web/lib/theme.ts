export const THEMES = ['light', 'dark', 'system'] as const;

export type Theme = (typeof THEMES)[number];
export type ResolvedTheme = 'light' | 'dark';

export const THEME_LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export const THEME_STORAGE_KEY = 'nexastack-theme';

/**
 * Set on <html> to the stored preference (not the resolved theme), so CSS can reflect the choice
 * the user made — e.g. the header trigger shows the monitor icon for "system" — before hydration.
 */
export const THEME_PREFERENCE_ATTRIBUTE = 'data-theme-preference';

/** Fired on `window` when this tab changes the theme (the `storage` event covers other tabs). */
export const THEME_CHANGE_EVENT = 'nexastack-theme-change';

export const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

/**
 * Inlined in <head> by the root layout. Runs before first paint so the correct theme class is
 * on <html> before any content renders. Must stay dependency-free, ES5-safe and fail silently
 * (e.g. when storage is blocked).
 */
export const themeInitScript = `(function () {
  try {
    var stored = window.localStorage.getItem('${THEME_STORAGE_KEY}');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'system';
    var dark = theme === 'dark' ||
      (theme === 'system' && window.matchMedia('${DARK_MEDIA_QUERY}').matches);
    var root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
    root.setAttribute('${THEME_PREFERENCE_ATTRIBUTE}', theme);
  } catch (e) {}
})();`;

/** Apply a resolved theme to <html>. Client-side only. */
export function applyResolvedTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

/** Mirror the stored preference onto <html>. Client-side only. */
export function applyThemePreference(theme: Theme): void {
  document.documentElement.setAttribute(THEME_PREFERENCE_ATTRIBUTE, theme);
}
