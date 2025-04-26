'use client';

import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { BsPeople, BsLightning, BsClock, BsShieldExclamation, BsGraphUp, BsPersonPlus, BsThreeDotsVertical } from 'react-icons/bs';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin">
      <div className="space-y-8 p-6">
        {/* Welcome Section with Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600/90 to-purple-600/90 backdrop-blur-lg p-8 text-white shadow-xl"
        >
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          <div className="relative">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {session?.user?.name}</h1>
            <p className="text-indigo-100/90">Here's your system overview for today</p>
          </div>
        </motion.div>

        {/* Stats Grid with Hover Effects */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                <BsPeople className="text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-500">+12%</span>
                <BsThreeDotsVertical className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.totalUsers}</h3>
            <p className="text-gray-500 dark:text-gray-400">Total Users</p>
            <div className="mt-4 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <BsLightning className="text-2xl text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-500">+5%</span>
                <BsThreeDotsVertical className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.activeSessions}</h3>
            <p className="text-gray-500 dark:text-gray-400">Active Sessions</p>
            <div className="mt-4 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                <BsClock className="text-2xl text-green-600 dark:text-green-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-500">Operational</span>
                <BsThreeDotsVertical className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.systemUptime}%</h3>
            <p className="text-gray-500 dark:text-gray-400">System Uptime</p>
            <div className="mt-4 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.systemUptime}%` }}></div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                <BsShieldExclamation className="text-2xl text-red-600 dark:text-red-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-500">Attention needed</span>
                <BsThreeDotsVertical className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.securityAlerts}</h3>
            <p className="text-gray-500 dark:text-gray-400">Security Alerts</p>
            <div className="mt-4 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(stats.securityAlerts * 10, 100)}%` }}></div>
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid with Glassmorphism */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role Distribution */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Role Distribution</h3>
              <Link
                href="/dashboard/admin/users"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
              >
                <BsPersonPlus className="text-lg" />
                Manage Users
              </Link>
            </div>
            <div className="space-y-4">
              {stats.roleDistribution.map((role) => (
                <motion.div 
                  key={role.role}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg backdrop-blur-sm border border-gray-100 dark:border-gray-600"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <BsGraphUp className="text-lg text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-gray-900 dark:text-white capitalize">{role.role.toLowerCase()}</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{role._count.role}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Users */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Users</h3>
            <div className="space-y-4">
              {stats.recentUsers.map((user) => (
                <motion.div 
                  key={user.email}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg backdrop-blur-sm border border-gray-100 dark:border-gray-600"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <BsPeople className="text-lg text-blue-600 dark:text-blue-400" />
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
          </motion.div>

          {/* System Health */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">System Health</h3>
            <div className="space-y-4">
              {systemHealth.map((health, index) => (
                <motion.div 
                  key={index}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg backdrop-blur-sm border border-gray-100 dark:border-gray-600"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      health.status === 'operational' ? 'bg-green-500' :
                      health.status === 'degraded' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="text-gray-900 dark:text-white">{health.component}</span>
                  </div>
                  <span className={`font-medium ${
                    health.status === 'operational' ? 'text-green-600 dark:text-green-400' :
                    health.status === 'degraded' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>{health.percentage}%</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity with Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <motion.div 
                key={index}
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg backdrop-blur-sm border border-gray-100 dark:border-gray-600"
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
    </DashboardLayout>
  );
} 