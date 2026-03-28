'use client';

import { SessionProvider } from 'next-auth/react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
// ErrorBoundary and Toast removed — using Next.js error.tsx + inline toasts

// ─── Theme Types ──────────────────────────────────────────────────
type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ─── Settings Types ───────────────────────────────────────────────
interface Settings {
  systemName: string;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// ─── Theme Provider ───────────────────────────────────────────────
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  const applyTheme = useCallback((resolved: ResolvedTheme) => {
    setResolvedTheme(resolved);
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('aspirehub-theme', newTheme);

    if (newTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(systemDark ? 'dark' : 'light');
    } else {
      applyTheme(newTheme);
    }
  }, [applyTheme]);

  // Initialize theme from localStorage or system
  useEffect(() => {
    const stored = localStorage.getItem('aspirehub-theme') as Theme | null;
    const initial = stored || 'system';
    setThemeState(initial);

    if (initial === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(systemDark ? 'dark' : 'light');
    } else {
      applyTheme(initial);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const currentTheme = localStorage.getItem('aspirehub-theme') as Theme | null;
      if (!currentTheme || currentTheme === 'system') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Settings Provider ────────────────────────────────────────────
function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings] = useState<Settings>({
    systemName: 'Bistec AspireHub',
  });
  const [loading] = useState(false);

  useEffect(() => {
    document.title = settings.systemName;
  }, [settings.systemName]);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}

// ─── Root Provider ────────────────────────────────────────────────
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
