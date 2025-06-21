'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import {
  BsGear,
  BsPalette,
  BsToggleOn,
  BsToggleOff,
  BsSave,
  BsArrowClockwise,
  BsCheck,
  BsArrowUpRight,
  BsBell,
  BsShield,
  BsDatabase,
  BsGlobe
} from 'react-icons/bs';

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
      } finally {
        setIsLoading(false);
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
    setIsSaving(true);
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
      setIsSaving(false);
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

  if (isLoading) {
    return (
      <DashboardLayout type="admin">
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-pulse"></div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <DashboardLayout type="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Floating Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 p-6 space-y-8">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-xl rounded-3xl p-8 text-white shadow-2xl border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-3xl" />
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
                      System Settings
                    </h1>
                    <p className="text-xl text-indigo-100/90">Configure your application preferences</p>
                  </div>
                  <div className="mt-6 lg:mt-0 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-6 py-3 flex items-center gap-2 hover:bg-white/30 transition-all duration-300"
                    >
                      <BsBell className="text-lg" />
                      Notifications
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-6 py-3 flex items-center gap-2 hover:bg-white/30 transition-all duration-300"
                    >
                      <BsShield className="text-lg" />
                      Security
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Settings Cards */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* General Settings */}
            <motion.div variants={itemVariants}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                      <BsGear className="text-2xl text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">General</h2>
                      <p className="text-gray-600 dark:text-gray-400">Basic system configuration</p>
                    </div>
                  </div>
                  <BsArrowUpRight className="text-gray-400" />
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      System Name
                    </label>
                    <input
                      type="text"
                      value={settings.systemName}
                      onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                      className="w-full bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter system name"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      This name will appear in the browser title and header
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Choose between light and dark mode</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleThemeChange}
                      className="text-3xl text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      {settings.theme === 'dark' ? <BsToggleOn /> : <BsToggleOff />}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Appearance Settings */}
            <motion.div variants={itemVariants}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                      <BsPalette className="text-2xl text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Appearance</h2>
                      <p className="text-gray-600 dark:text-gray-400">Customize the look and feel</p>
                    </div>
                  </div>
                  <BsArrowUpRight className="text-gray-400" />
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Current Theme</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{settings.theme} Mode</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        settings.theme === 'dark' 
                          ? 'bg-gray-800 text-gray-200' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {settings.theme === 'dark' ? 'Dark' : 'Light'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* System Info */}
            <motion.div variants={itemVariants}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                      <BsDatabase className="text-2xl text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Info</h2>
                      <p className="text-gray-600 dark:text-gray-400">Application details</p>
                    </div>
                  </div>
                  <BsArrowUpRight className="text-gray-400" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50">
                    <span className="text-gray-700 dark:text-gray-300">Version</span>
                    <span className="text-gray-900 dark:text-white font-medium">1.0.0</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50">
                    <span className="text-gray-700 dark:text-gray-300">Environment</span>
                    <span className="text-gray-900 dark:text-white font-medium">Production</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50">
                    <span className="text-gray-700 dark:text-gray-300">Last Updated</span>
                    <span className="text-gray-900 dark:text-white font-medium">Today</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div variants={itemVariants}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                      <BsGlobe className="text-2xl text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Actions</h2>
                      <p className="text-gray-600 dark:text-gray-400">Manage your settings</p>
                    </div>
                  </div>
                  <BsArrowUpRight className="text-gray-400" />
                </div>
                
                <div className="space-y-4">
                  {!isSaved && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleReset}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                        disabled={isSaving}
                      >
                        <BsArrowClockwise className="text-lg" />
                        Discard Changes
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <BsSave className="text-lg" />
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </motion.button>
                    </>
                  )}
                  {isSaved && (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl">
                      <BsCheck className="text-lg" />
                      Settings Saved
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}