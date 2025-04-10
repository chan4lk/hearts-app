'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { BsGear, BsSave, BsBell, BsCalendar, BsFileText, BsShield, BsCheckCircle, BsXCircle } from 'react-icons/bs';

interface SystemSettings {
  notificationSettings: {
    emailNotifications: boolean;
    goalReminders: boolean;
    reviewReminders: boolean;
  };
  reviewSettings: {
    goalReviewPeriod: number;
    performanceReviewPeriod: number;
    selfReviewEnabled: boolean;
  };
  securitySettings: {
    passwordPolicy: {
      minLength: number;
      requireSpecialChar: boolean;
      requireNumbers: boolean;
    };
    sessionTimeout: number;
  };
}

export default function SystemSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings>({
    notificationSettings: {
      emailNotifications: true,
      goalReminders: true,
      reviewReminders: true,
    },
    reviewSettings: {
      goalReviewPeriod: 30,
      performanceReviewPeriod: 90,
      selfReviewEnabled: true,
    },
    securitySettings: {
      passwordPolicy: {
        minLength: 8,
        requireSpecialChar: true,
        requireNumbers: true,
      },
      sessionTimeout: 30,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    } else {
      fetchSettings();
    }
  }, [session, status, router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        setSaveStatus({
          type: 'success',
          message: 'Settings saved successfully!',
        });
      } else {
        const error = await response.json();
        setSaveStatus({
          type: 'error',
          message: error.message || 'Failed to save settings',
        });
      }
    } catch (error) {
      setSaveStatus({
        type: 'error',
        message: 'An error occurred while saving settings',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout type="admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <BsGear className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <BsSave className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {saveStatus.type && (
          <div
            className={`mb-4 p-4 rounded-md ${
              saveStatus.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            <div className="flex items-center">
              {saveStatus.type === 'success' ? (
                <BsCheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <BsXCircle className="h-5 w-5 mr-2" />
              )}
              <p>{saveStatus.message}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Notification Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center space-x-4 mb-4">
              <BsBell className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                <input
                  type="checkbox"
                  checked={settings.notificationSettings.emailNotifications}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notificationSettings: {
                        ...settings.notificationSettings,
                        emailNotifications: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Goal Reminders</label>
                <input
                  type="checkbox"
                  checked={settings.notificationSettings.goalReminders}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notificationSettings: {
                        ...settings.notificationSettings,
                        goalReminders: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Review Reminders</label>
                <input
                  type="checkbox"
                  checked={settings.notificationSettings.reviewReminders}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notificationSettings: {
                        ...settings.notificationSettings,
                        reviewReminders: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Review Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center space-x-4 mb-4">
              <BsCalendar className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-medium text-gray-900">Review Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Goal Review Period (days)
                </label>
                <input
                  type="number"
                  value={settings.reviewSettings.goalReviewPeriod}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      reviewSettings: {
                        ...settings.reviewSettings,
                        goalReviewPeriod: parseInt(e.target.value),
                      },
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Performance Review Period (days)
                </label>
                <input
                  type="number"
                  value={settings.reviewSettings.performanceReviewPeriod}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      reviewSettings: {
                        ...settings.reviewSettings,
                        performanceReviewPeriod: parseInt(e.target.value),
                      },
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Enable Self Reviews</label>
                <input
                  type="checkbox"
                  checked={settings.reviewSettings.selfReviewEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      reviewSettings: {
                        ...settings.reviewSettings,
                        selfReviewEnabled: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center space-x-4 mb-4">
              <BsShield className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  value={settings.securitySettings.passwordPolicy.minLength}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      securitySettings: {
                        ...settings.securitySettings,
                        passwordPolicy: {
                          ...settings.securitySettings.passwordPolicy,
                          minLength: parseInt(e.target.value),
                        },
                      },
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Require Special Characters
                </label>
                <input
                  type="checkbox"
                  checked={settings.securitySettings.passwordPolicy.requireSpecialChar}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      securitySettings: {
                        ...settings.securitySettings,
                        passwordPolicy: {
                          ...settings.securitySettings.passwordPolicy,
                          requireSpecialChar: e.target.checked,
                        },
                      },
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Require Numbers</label>
                <input
                  type="checkbox"
                  checked={settings.securitySettings.passwordPolicy.requireNumbers}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      securitySettings: {
                        ...settings.securitySettings,
                        passwordPolicy: {
                          ...settings.securitySettings.passwordPolicy,
                          requireNumbers: e.target.checked,
                        },
                      },
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={settings.securitySettings.sessionTimeout}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      securitySettings: {
                        ...settings.securitySettings,
                        sessionTimeout: parseInt(e.target.value),
                      },
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 