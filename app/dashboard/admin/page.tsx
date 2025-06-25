'use client';

import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { BsPeople, BsLightning, BsClock, BsShieldExclamation, BsGraphUp, BsPersonPlus, BsThreeDotsVertical, BsArrowUpRight, BsActivity, BsGear, BsBell, BsBullseye } from 'react-icons/bs';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingComponent from '@/app/components/LoadingScreen';


interface DashboardStats {
  totalUsers: number;
  employeeCount: number;
  adminCount: number;
  managerCount: number;
  totalGoals: number;
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
    employeeCount: 0,
    adminCount: 0,
    managerCount: 0,
    totalGoals: 0,
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
    return <LoadingComponent />;
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
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 p-4 space-y-4">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-xl rounded-2xl p-4 text-white shadow-xl border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-2xl" />
              <div className="relative z-10">
                <h1 className="text-2xl lg:text-3xl font-bold mb-1 bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
                  Welcome back, {session?.user?.name}
                </h1>
                <p className="text-sm text-indigo-100/90">Your command center for today's operations</p>
              </div>
            </div>
          </motion.div>

          {/* Statistics Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-5 gap-4"
          >
            {/* Total Users Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-slate-500/90 to-slate-600/90 backdrop-blur-xl rounded-xl p-4 text-white shadow-lg border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-100/90 mb-1">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg">
                  <BsPersonPlus className="text-xl" />
                </div>
              </div>
            </motion.div>

            {/* Employees Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-500/90 to-blue-600/90 backdrop-blur-xl rounded-xl p-4 text-white shadow-lg border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100/90 mb-1">Employees</p>
                  <p className="text-2xl font-bold">{stats.employeeCount}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg">
                  <BsPeople className="text-xl" />
                </div>
              </div>
            </motion.div>

            {/* Managers Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500/90 to-purple-600/90 backdrop-blur-xl rounded-xl p-4 text-white shadow-lg border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-100/90 mb-1">Managers</p>
                  <p className="text-2xl font-bold">{stats.managerCount}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg">
                  <BsGraphUp className="text-xl" />
                </div>
              </div>
            </motion.div>

            {/* Admins Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-indigo-500/90 to-indigo-600/90 backdrop-blur-xl rounded-xl p-4 text-white shadow-lg border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-100/90 mb-1">Admins</p>
                  <p className="text-2xl font-bold">{stats.adminCount}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg">
                  <BsShieldExclamation className="text-xl" />
                </div>
              </div>
            </motion.div>

            {/* Goals Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-green-500/90 to-green-600/90 backdrop-blur-xl rounded-xl p-4 text-white shadow-lg border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-100/90 mb-1">Goals</p>
                  <p className="text-2xl font-bold">{stats.totalGoals}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg">
                  <BsBullseye className="text-xl" />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Role Distribution */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 dark:border-gray-700/50"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Role Distribution</h3>
                <Link
                  href="/dashboard/admin/users"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                >
                  <BsPersonPlus className="text-sm" />
                  Manage
                </Link>
              </div>
              <div className="space-y-2">
                {stats.roleDistribution.map((role, index) => (
                  <motion.div 
                    key={role.role}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-2 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md">
                        <BsGraphUp className="text-sm text-white" />
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white font-medium capitalize">{role.role.toLowerCase()}</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{role._count.role}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Recent Users */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 dark:border-gray-700/50"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Recent Users</h3>
              <div className="space-y-2">
                {stats.recentUsers.map((user, index) => (
                  <motion.div 
                    key={user.email}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-2 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-md">
                        <BsPeople className="text-sm text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(user.updatedAt).toLocaleTimeString()}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 dark:border-gray-700/50"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {activities.map((activity, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-2 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">{activity.type}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{activity.timestamp}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
} 