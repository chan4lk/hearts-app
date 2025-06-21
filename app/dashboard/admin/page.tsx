'use client';

import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { BsPeople, BsLightning, BsClock, BsShieldExclamation, BsGraphUp, BsPersonPlus, BsThreeDotsVertical, BsArrowUpRight, BsActivity, BsGear, BsBell } from 'react-icons/bs';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardStats {
  totalUsers: number;
  activeSessions: number;
  systemUptime: number;
  securityAlerts: number;
  roleDistribution: {
    role: string;
    _count: {
      role: number;
    };
  }[];
  recentUsers: {
    name: string;
    email: string;
    role: string;
    updatedAt: string;
  }[];
}

interface Activity {
  type: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

interface SystemHealth {
  component: string;
  status: 'operational' | 'degraded' | 'down';
  percentage: number;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSessions: 0,
    systemUptime: 0,
    securityAlerts: 0,
    roleDistribution: [],
    recentUsers: []
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const [statsRes, activitiesRes, healthRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/activities'),
          fetch('/api/admin/health')
        ]);

        if (!statsRes.ok || !activitiesRes.ok || !healthRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [statsData, activitiesData, healthData] = await Promise.all([
          statsRes.json(),
          activitiesRes.json(),
          healthRes.json()
        ]);

        setStats(statsData);
        setActivities(activitiesData);
        setSystemHealth(healthData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [session, router]);

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
                      Welcome back, {session?.user?.name}
                    </h1>
                    <p className="text-xl text-indigo-100/90">Your command center for today's operations</p>
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
                      <BsGear className="text-lg" />
                      Settings
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div variants={itemVariants} className="group">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-gray-700/50 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300">
                    <BsPeople className="text-2xl text-white" />
                  </div>
                  <BsArrowUpRight className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.totalUsers}</h3>
                <p className="text-gray-600 dark:text-gray-300">Total Users</p>
                <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="group">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-gray-700/50 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl group-hover:from-green-600 group-hover:to-green-700 transition-all duration-300">
                    <BsActivity className="text-2xl text-white" />
                  </div>
                  <BsArrowUpRight className="text-gray-400 group-hover:text-green-500 transition-colors" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.activeSessions}</h3>
                <p className="text-gray-600 dark:text-gray-300">Active Sessions</p>
                <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '60%' }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="group">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-gray-700/50 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl group-hover:from-purple-600 group-hover:to-purple-700 transition-all duration-300">
                    <BsClock className="text-2xl text-white" />
                  </div>
                  <BsArrowUpRight className="text-gray-400 group-hover:text-purple-500 transition-colors" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.systemUptime}%</h3>
                <p className="text-gray-600 dark:text-gray-300">System Uptime</p>
                <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.systemUptime}%` }}
                    transition={{ duration: 1, delay: 0.7 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="group">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-gray-700/50 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl group-hover:from-red-600 group-hover:to-red-700 transition-all duration-300">
                    <BsShieldExclamation className="text-2xl text-white" />
                  </div>
                  <BsArrowUpRight className="text-gray-400 group-hover:text-red-500 transition-colors" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.securityAlerts}</h3>
                <p className="text-gray-600 dark:text-gray-300">Security Alerts</p>
                <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '25%' }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Main Content Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Role Distribution */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Role Distribution</h3>
                  <Link
                    href="/dashboard/admin/users"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <BsPersonPlus className="text-lg" />
                    Manage
                  </Link>
                </div>
                <div className="space-y-4">
                  {stats.roleDistribution.map((role, index) => (
                    <motion.div 
                      key={role.role}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                          <BsGraphUp className="text-lg text-white" />
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium capitalize">{role.role.toLowerCase()}</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">{role._count.role}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Recent Users */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Users</h3>
                <div className="space-y-4">
                  {stats.recentUsers.map((user, index) => (
                    <motion.div 
                      key={user.email}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                          <BsPeople className="text-lg text-white" />
                        </div>
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.updatedAt).toLocaleTimeString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* System Health */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">System Health</h3>
                <div className="space-y-4">
                  {systemHealth.map((health, index) => (
                    <motion.div 
                      key={health.component}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-900 dark:text-white font-medium">{health.component}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          health.status === 'operational' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          health.status === 'degraded' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {health.status}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${health.percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className={`h-full rounded-full ${
                            health.status === 'operational' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                            health.status === 'degraded' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                            'bg-gradient-to-r from-red-500 to-red-600'
                          }`}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">{activity.type}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{activity.timestamp}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
} 