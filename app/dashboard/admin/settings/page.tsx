'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Toaster } from 'sonner';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeroSection from './components/HeroSection';
import BackgroundElements from './components/BackgroundElements';
import { showToast } from '@/app/utils/toast';
import { useSettings } from '@/app/providers';
import {
  BsGear,
  BsPalette,
  BsToggleOn,
  BsToggleOff,
  BsSave,
  BsArrowClockwise,
  BsCheck,
  BsDatabase,
  BsGlobe
} from 'react-icons/bs';

import packageJson from '../../../../package.json';

const appVersion = packageJson.version;
const environment = process.env.NODE_ENV;

export default function Settings() {
  const { settings: globalSettings, loading: isLoading, updateSettings } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState(globalSettings);

  useEffect(() => {
    setSettings(globalSettings);
  }, [globalSettings]);

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(globalSettings);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(settings);
      showToast.settings.updated();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showToast.settings.error('Save Failed', message);
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(globalSettings);
    showToast.settings.reset();
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
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <BackgroundElements />

        <div className="relative z-10 p-3 space-y-4">
          <HeroSection />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {/* Cards */}
            <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4">
              {/* General Settings */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                      <BsGear className="text-xl text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">General</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        System Name
                      </label>
                      <input
                        type="text"
                        value={settings.systemName}
                        onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                        className="w-full bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        placeholder="Enter system name"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700/50">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleThemeChange}
                        className="text-2xl text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        {settings.theme === 'dark' ? <BsToggleOn /> : <BsToggleOff />}
                      </motion.button>
                    </div>
                  </div>
              </div>

              {/* System Info */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-4">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                      <BsDatabase className="text-xl text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">System Info</h2>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Version</span>
                      <span className="text-gray-900 dark:text-white font-medium">{appVersion}</span>
                    </div>
                     <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Environment</span>
                      <span className="text-gray-900 dark:text-white font-medium capitalize">{environment}</span>
                    </div>
                  </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4">
              {/* Appearance */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                      <BsPalette className="text-xl text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Appearance</h2>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">Current Theme</h3>
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${ settings.theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>
                          {settings.theme === 'dark' ? 'Dark' : 'Light'}
                        </div>
                      </div>
                    </div>
              </div>

              {/* Actions */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                      <BsGlobe className="text-xl text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Actions</h2>
                  </div>
                  <div className="space-y-2">
                  {hasChanges ? (
                    <>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-md"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"/>
                        ) : (
                          <BsSave className="text-base" />
                        )}
                        <span className="text-sm font-medium">{isSaving ? 'Saving...' : 'Save Changes'}</span>
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleReset}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
                        disabled={isSaving}
                      >
                        <BsArrowClockwise className="text-base" />
                         <span className="text-sm font-medium">Discard</span>
                      </motion.button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg">
                      <BsCheck className="text-base" />
                      <span className="text-sm font-medium">All changes saved</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>

        <Toaster 
          position="top-center"
          richColors
          closeButton
          theme="dark"
          toastOptions={{
            style: {
              background: 'rgba(30, 32, 40, 0.95)',
              color: '#fff',
              border: '1px solid rgba(45, 55, 72, 0.5)',
              borderRadius: '16px',
              padding: '20px 24px',
              fontSize: '16px',
              fontWeight: '600',
              textAlign: 'center',
              width: 'auto',
              maxWidth: '450px',
              margin: '0 auto',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            },
            duration: 4000,
            className: 'modern-toast'
          }}
        />
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