'use client';

import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { 
  BsPeople, 
  BsLightning, 
  BsClock, 
  BsShieldExclamation, 
  BsGraphUp, 
  BsPersonPlus, 
  BsThreeDotsVertical, 
  BsArrowUpRight, 
  BsActivity, 
  BsGear, 
  BsBell, 
  BsBullseye,
  BsEye,
  BsPlus,
  BsCheckCircle,
  BsExclamationTriangle,
  BsXCircle,
  BsCalendar,
  BsSpeedometer2,
  BsDatabase,
  BsServer,
  BsGlobe,
  BsCpu,
  BsWifi,
  BsHddNetwork,
  BsChevronRight,
  BsDot
} from 'react-icons/bs';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingComponent from '@/app/components/LoadingScreen';
import { Role } from '.prisma/client';

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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user?.role !== Role.ADMIN) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <BsCheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <BsExclamationTriangle className="w-4 h-4 text-amber-400" />;
      case 'error':
        return <BsXCircle className="w-4 h-4 text-red-400" />;
      default:
        return <BsActivity className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'degraded':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'down':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const statsCards = [
    { 
      title: 'Total Users', 
      value: stats.totalUsers, 
      icon: BsPeople, 
      gradient: 'from-blue-500 via-blue-600 to-cyan-500',
      
    },
    { 
      title: 'Employees', 
      value: stats.employeeCount, 
      icon: BsPeople, 
      gradient: 'from-emerald-500 via-emerald-600 to-teal-500',
      
    },
    { 
      title: 'Managers', 
      value: stats.managerCount, 
      icon: BsGraphUp, 
      gradient: 'from-purple-500 via-purple-600 to-pink-500',
      
    },
    { 
      title: 'Admins', 
      value: stats.adminCount, 
      icon: BsShieldExclamation, 
      gradient: 'from-orange-500 via-orange-600 to-red-500',
      
    },
    { 
      title: 'Goals', 
      value: stats.totalGoals, 
      icon: BsBullseye, 
      gradient: 'from-indigo-500 via-indigo-600 to-purple-500',
      
    }
  ];

  return (
    <DashboardLayout type="admin">
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 p-3 sm:p-4 lg:p-6 space-y-4">
          {/* Glassmorphism Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
                         className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 shadow-2xl"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                                 <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                     <BsActivity className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                       Welcome back, {session?.user?.name}
                     </h1>
                     <p className="text-gray-300 text-xs sm:text-sm mt-1">Here's an overview of your organization's performance metrics and recent activities.</p>
                   </div>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full backdrop-blur-sm">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-emerald-400">System Operational</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-gray-300">
                  <BsClock className="w-4 h-4" />
                  <span className="text-sm font-mono">
                    {currentTime.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

                     {/* Compact Stats Grid */}
           <div className="grid grid-cols-5 gap-1.5">
             {statsCards.map((card, index) => (
               <motion.div 
                 key={card.title}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, delay: index * 0.1 }}
                                 className="group relative overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-2 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                                 whileHover={{ scale: 1.05 }}
                                 whileTap={{ scale: 0.95 }}
               >
                 {/* Unique Gradient Overlay */}
                 <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 
                 {/* Animated Background Pattern */}
                 <div className="absolute inset-0 opacity-10">
                   <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)] group-hover:scale-150 transition-transform duration-700"></div>
                 </div>

                 <div className="relative z-10 flex flex-col items-center justify-center h-16">
                   {/* Unique Icon Container */}
                   <div className="relative mb-1">
                     <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-sm opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                     <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-1.5 group-hover:scale-110 transition-transform duration-300">
                       <card.icon className="w-3 h-3 text-white" />
                     </div>
                   </div>
                   
                   {/* Compact Value Display */}
                   <div className="text-center">
                     <div className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors duration-300">
                       {card.value}
                     </div>
                     <div className="text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-1 group-hover:translate-y-0">
                       {card.title}
                     </div>
                   </div>
                   
                   {/* Unique Hover Indicator */}
                   <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 group-hover:w-3/4 transition-all duration-300"></div>
                 </div>
               </motion.div>
             ))}
           </div>

                     {/* Main Content Grid */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Role Distribution */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
                             className="lg:col-span-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            >
                             <div className="p-4 border-b border-white/10">
                 <div className="flex items-center justify-between">
                   <h2 className="text-lg font-semibold text-white">Role Distribution</h2>
                  <Link
                    href="/dashboard/admin/users"
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View all
                    <BsChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
                             <div className="p-4">
                 <div className="space-y-4">
                  {stats.roleDistribution.map((role, index) => {
                    const percentage = (role._count.role / stats.totalUsers) * 100;
                    const gradients = ['from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500', 'from-purple-500 to-pink-500'];
                    
                    return (
                      <div key={role.role} className="group">
                                                 <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                               <BsPeople className="w-4 h-4 text-gray-300" />
                             </div>
                             <div>
                               <p className="text-sm font-medium text-white capitalize">
                                 {role.role.toLowerCase()}
                               </p>
                               <p className="text-xs text-gray-400">
                                 {role._count.role} {role._count.role === 1 ? 'user' : 'users'}
                               </p>
                             </div>
                           </div>
                           <div className="text-right">
                             <p className="text-lg font-bold text-white">{role._count.role}</p>
                             <p className="text-xs text-gray-400">{percentage.toFixed(1)}%</p>
                           </div>
                         </div>
                         <div className="w-full bg-gray-700/30 rounded-full h-2">
                           <div 
                             className={`h-2 rounded-full bg-gradient-to-r ${gradients[index]} transition-all duration-1000 group-hover:shadow-lg group-hover:shadow-blue-500/25`}
                             style={{ width: `${percentage}%` }}
                           ></div>
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

                         {/* Recent Users */}
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.6, delay: 0.4 }}
               className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl shadow-2xl"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Recent Users</h2>
                  <Link
                    href="/dashboard/admin/users"
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View all
                    <BsChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats.recentUsers.slice(0, 5).map((user, index) => (
                    <div key={user.email} className="flex items-center gap-4 p-3 rounded-xl bg-gray-700/20 hover:bg-gray-700/30 transition-all duration-300">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BsPeople className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          {new Date(user.updatedAt).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          

          {/* Recent Activity */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl"
          >
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-400">Live</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {activities.slice(0, 8).map((activity, index) => (
                  <div key={index} className="group flex items-start gap-4 p-4 rounded-xl bg-gray-700/20 hover:bg-gray-700/30 transition-all duration-300">
                    <div className="mt-1 group-hover:scale-110 transition-transform duration-300">
                      {getStatusIcon(activity.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white">{activity.type}</h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">{activity.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}