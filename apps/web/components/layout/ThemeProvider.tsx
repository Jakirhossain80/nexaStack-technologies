'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  applyResolvedTheme,
  applyThemePreference,
  DARK_MEDIA_QUERY,
  isTheme,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type Theme,
} from '@/lib/theme';

interface ThemeContextValue {
  /** The stored preference. `undefined` during server render and hydration. */
  theme: Theme | undefined;
  /** What is actually applied. `undefined` during server render and hydration. */
  resolvedTheme: ResolvedTheme | undefined;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function subscribeToStoredTheme(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === THEME_STORAGE_KEY) onChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

function subscribeToSystemTheme(onChange: () => void) {
  const media = window.matchMedia(DARK_MEDIA_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

const getSystemPrefersDark = () => window.matchMedia(DARK_MEDIA_QUERY).matches;
const getServerSnapshot = () => undefined;

export interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useSyncExternalStore<Theme | undefined>(
    subscribeToStoredTheme,
    readStoredTheme,
    getServerSnapshot,
  );
  const systemPrefersDark = useSyncExternalStore<boolean | undefined>(
    subscribeToSystemTheme,
    getSystemPrefersDark,
    getServerSnapshot,
  );

  const resolvedTheme: ResolvedTheme | undefined =
    theme === undefined || systemPrefersDark === undefined
      ? undefined
      : theme === 'dark' || (theme === 'system' && systemPrefersDark)
        ? 'dark'
        : 'light';

  // Keep <html> in sync with OS changes (while on "system") and with other tabs.
  useEffect(() => {
    if (resolvedTheme) applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Keep the preference attribute (set before paint by the init script) in sync after changes.
  useEffect(() => {
    if (theme) applyThemePreference(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      if (next === 'system') {
        window.localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      }
    } catch {
      // Storage unavailable: the choice still applies for this page view.
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
