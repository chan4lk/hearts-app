'use client';

import { SessionProvider } from 'next-auth/react';
import { createContext, useContext, useState, useEffect } from 'react';

// 1. Create Settings Context
interface Settings {
  systemName: string;
  theme: 'dark';  // Force theme to always be dark
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// 2. Create a Settings Provider
function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings] = useState<Settings>({
    systemName: 'Bistec AspireHub',
    theme: 'dark',
  });
  const [loading, setLoading] = useState(false);

  // Force dark theme on mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.title = settings.systemName;
    setLoading(false);
  }, [settings.systemName]);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

// 3. Create a custom hook for easy consumption
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// 4. Update the main Providers component
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SettingsProvider>{children}</SettingsProvider>
    </SessionProvider>
  );
} 