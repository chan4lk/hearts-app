'use client';

import { SessionProvider } from 'next-auth/react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// 1. Create Settings Context
interface Settings {
  systemName: string;
  theme: 'dark';  // Force theme to always be dark
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// 2. Create a Settings Provider
function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    systemName: 'Performance Management',
    theme: 'dark',
  });
  const [loading, setLoading] = useState(true);

  // Force dark theme on mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          systemName: data.systemName,
          theme: 'dark' // Always keep theme dark
        } as Settings);
        document.title = data.systemName;
        document.documentElement.classList.add('dark');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    const oldSettings = settings;
    const updatedSettings: Settings = { 
      ...settings, 
      ...newSettings,
      theme: 'dark' // Always keep theme dark
    };
    setSettings(updatedSettings);
    document.title = updatedSettings.systemName;
    document.documentElement.classList.add('dark');

    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      setSettings(oldSettings);
      document.title = oldSettings.systemName;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
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