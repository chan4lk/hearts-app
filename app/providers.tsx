'use client';

import { SessionProvider } from 'next-auth/react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// 1. Create Settings Context
interface Settings {
  systemName: string;
  theme: string;
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

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        document.title = data.systemName;
        document.documentElement.classList.toggle('dark', data.theme === 'dark');
      } else if (response.status === 401) {
        // User is not authenticated, use default settings
        console.log('User not authenticated, using default settings');
        setSettings({
          systemName: 'Performance Management System',
          theme: 'dark',
        });
        document.title = 'Performance Management System';
        document.documentElement.classList.toggle('dark', true);
      } else {
        console.error('Failed to fetch settings:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Use default settings on error
      setSettings({
        systemName: 'Performance Management System',
        theme: 'dark',
      });
      document.title = 'Performance Management System';
      document.documentElement.classList.toggle('dark', true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    // Optimistic update
    const oldSettings = settings;
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    document.title = updatedSettings.systemName;
    document.documentElement.classList.toggle('dark', updatedSettings.theme === 'dark');

    try {
      // API call is still made to persist changes
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      // Revert on error
      setSettings(oldSettings);
      document.title = oldSettings.systemName;
      document.documentElement.classList.toggle('dark', oldSettings.theme === 'dark');
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
    <SessionProvider 
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <SettingsProvider>{children}</SettingsProvider>
    </SessionProvider>
  );
} 