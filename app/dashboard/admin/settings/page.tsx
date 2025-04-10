'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import {
  BsGear,
  BsPalette,
  BsToggleOn,
  BsToggleOff,
  BsSave,
  BsArrowClockwise,
  BsCheck
} from 'react-icons/bs';

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [settings, setSettings] = useState({
    systemName: 'Performance Management System',
    theme: 'dark'
  });
  const [originalSettings, setOriginalSettings] = useState({
    systemName: 'Performance Management System',
    theme: 'dark'
  });

  // Fetch current settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
          setOriginalSettings(data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      }
    };

    fetchSettings();
  }, []);

  // Check if settings have changed
  useEffect(() => {
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setIsSaved(!hasChanges);
  }, [settings, originalSettings]);

  // Apply theme change immediately
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    localStorage.setItem('theme', settings.theme);
  }, [settings.theme]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Settings updated successfully');
        document.title = settings.systemName;
        setOriginalSettings(settings);
        setIsSaved(true);
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      toast.error('Error updating settings');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    setIsSaved(true);
    toast.success('Changes discarded');
  };

  const handleThemeChange = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    setSettings({ ...settings, theme: newTheme });
  };

  return (
    <DashboardLayout type="admin">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BsGear className="text-3xl text-blue-500" />
            System Settings
          </h1>
        </div>

        <div className="grid gap-6 mb-8">
          {/* General Settings */}
          <div className="bg-[#1a1c23] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BsGear className="text-blue-500" />
              General
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-gray-400">System Name</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={settings.systemName}
                      onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                      className="w-full bg-[#2d2f36] text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                      placeholder="Enter system name"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {!isSaved && (
                      <>
                        <button
                          onClick={handleReset}
                          className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-[#2d2f36] rounded-lg transition-colors"
                          disabled={isLoading}
                        >
                          <BsArrowClockwise className="text-lg" />
                          Discard
                        </button>
                        <button
                          onClick={handleSave}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          disabled={isLoading}
                        >
                          <BsSave className="text-lg" />
                          Save
                        </button>
                      </>
                    )}
                    {isSaved && (
                      <span className="flex items-center gap-2 text-green-500">
                        <BsCheck className="text-lg" />
                        Saved
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500">This name will appear in the browser title and header</p>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-[#1a1c23] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BsPalette className="text-blue-500" />
              Appearance
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-gray-400">Theme</label>
                  <p className="text-sm text-gray-500">Choose between light and dark mode</p>
                </div>
                <button
                  onClick={handleThemeChange}
                  className="text-2xl text-blue-500 hover:text-blue-400 transition-colors"
                >
                  {settings.theme === 'dark' ? <BsToggleOn /> : <BsToggleOff />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}