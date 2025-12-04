'use client';

import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { 
  BsClock, 
  BsCheckCircle,
  BsExclamationTriangle,
  BsXCircle,
  BsActivity,
  BsChevronRight,
  BsPeople,
  BsBullseye
} from 'react-icons/bs';
import HeroSection from './components/HeroSection';
import StatsSection from './components/StatsSection';
import Filters from './components/Filters';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingComponent from '@/app/components/LoadingScreen';
import { Role } from '@prisma/client';
import GoalsTable from '@/app/components/shared/GoalsTable';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import { Goal, User as UserType } from '@/app/components/shared/types';

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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalsLoading, setGoalsLoading] = useState(false);

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
        const [statsRes, activitiesRes, usersRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/activities'),
          fetch('/api/users'),
        ]);

        if (!statsRes.ok || !activitiesRes.ok ) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [statsData, activitiesData, usersData] = await Promise.all([
          statsRes.json(),
          activitiesRes.json(),
          usersRes.ok ? usersRes.json() : { users: [] },
        ]);

        setStats(statsData);
        setActivities(activitiesData);
        setUsers(usersData.users || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    fetchAllGoals();
  }, [session, router]);

  const fetchAllGoals = async () => {
    try {
      setGoalsLoading(true);
      const response = await fetch('/api/goals');
      if (!response.ok) throw new Error('Failed to fetch goals');
      const data = await response.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setGoalsLoading(false);
    }
  };

  const filteredGoals = goals.filter(goal => {
    const matchesUser = selectedUser === 'all' || goal.employee?.id === selectedUser;
    const matchesStatus = selectedStatus === 'all' || goal.status === selectedStatus;
    const matchesPriority = !selectedPriority || goal.priority === selectedPriority;
    const matchesCategory = !selectedCategory || goal.category === selectedCategory;
    return matchesUser && matchesStatus && matchesPriority && matchesCategory;
  });

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


  return (
    <DashboardLayout type="admin">
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Subtle Background Pattern */}
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-3 space-y-4">
          {/* Hero Section */}
          <HeroSection />

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <StatsSection stats={stats} />
          </motion.div>

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

          

          {/* All Users Goals Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl"
          >
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <BsBullseye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">All Users Goals</h2>
                    <p className="text-sm text-gray-400">View and manage goals across all users</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/admin/all-goals"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View All Goals
                  <BsChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              {/* Filters */}
              <Filters
                selectedUser={selectedUser}
                onUserChange={setSelectedUser}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                selectedPriority={selectedPriority}
                onPriorityChange={setSelectedPriority}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                users={users}
              />
            </div>
            <div className="p-6">
              {goalsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-400">Loading goals...</div>
                </div>
              ) : (
                <GoalsTable
                  goals={filteredGoals}
                  selectedStatus={selectedStatus === 'all' ? '' : selectedStatus}
                  onStatusChange={(status) => setSelectedStatus(status === '' ? 'all' : status)}
                  onGoalClick={(goal) => setSelectedGoal(goal)}
                  showEmployee={true}
                  showManager={true}
                />
              )}
            </div>
          </motion.div>

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

      {/* Goal Detail Modal */}
      {selectedGoal && (
        <GoalDetailModal
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)}
        />
      )}
    </DashboardLayout>
  );
}