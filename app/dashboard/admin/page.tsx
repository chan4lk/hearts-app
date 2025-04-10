'use client';

import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { BsPeople, BsLightning, BsClock, BsShieldExclamation, BsGraphUp, BsPersonPlus } from 'react-icons/bs';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
        // Fetch all data in parallel
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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1a1c23] p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <BsPeople className="text-2xl text-blue-500" />
            </div>
            <span className="text-sm text-green-500">+12% from last month</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats.totalUsers}</h3>
          <p className="text-gray-400">Total Users</p>
        </div>

        <div className="bg-[#1a1c23] p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <BsLightning className="text-2xl text-purple-500" />
            </div>
            <span className="text-sm text-green-500">+5% from last hour</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats.activeSessions}</h3>
          <p className="text-gray-400">Active Sessions</p>
        </div>

        <div className="bg-[#1a1c23] p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <BsClock className="text-2xl text-green-500" />
            </div>
            <span className="text-sm text-green-500">All systems operational</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats.systemUptime}%</h3>
          <p className="text-gray-400">System Uptime</p>
        </div>

        <div className="bg-[#1a1c23] p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
              <BsShieldExclamation className="text-2xl text-red-500" />
            </div>
            <span className="text-sm text-red-500">Requires attention</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{stats.securityAlerts}</h3>
          <p className="text-gray-400">Security Alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Role Distribution */}
        <div className="bg-[#1a1c23] rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Role Distribution</h3>
            <Link
              href="/dashboard/admin/users"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700"
            >
              <BsPersonPlus className="text-xl" />
              Manage Users
            </Link>
          </div>
          <div className="space-y-4">
            {stats.roleDistribution.map((role) => (
              <div key={role.role} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                    <BsGraphUp className="text-xl text-indigo-500" />
                  </div>
                  <span className="text-white capitalize">{role.role.toLowerCase()}</span>
                </div>
                <span className="text-2xl font-bold text-white">{role._count.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-[#1a1c23] rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-6">Recent Users</h3>
          <div className="space-y-4">
            {stats.recentUsers.map((user) => (
              <div key={user.email} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <BsPeople className="text-xl text-blue-500" />
                  </div>
                  <div>
                    <p className="text-white">{user.name}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-400">
                  {new Date(user.updatedAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-[#1a1c23] rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-6">System Health</h3>
          <div className="space-y-4">
            {systemHealth.map((health, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    health.status === 'operational' ? 'bg-green-500' :
                    health.status === 'degraded' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  <span className="text-white">{health.component}</span>
                </div>
                <span className={`${
                  health.status === 'operational' ? 'text-green-500' :
                  health.status === 'degraded' ? 'text-yellow-500' :
                  'text-red-500'
                }`}>{health.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1a1c23] rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
        <div className="space-y-6">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'warning' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
                <div>
                  <p className="text-white">{activity.type}</p>
                  <p className="text-sm text-gray-400">{activity.description}</p>
                </div>
              </div>
              <span className="text-sm text-gray-400">{activity.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
} 