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
  BsBullseye,
  BsEye,
  BsEyeSlash,
  BsGear,
  BsShieldCheck,
  BsCpu
} from 'react-icons/bs';

import StatsSection, { StatItem } from '@/app/components/shared/StatsSection';
import Filters from '@/app/components/shared/Filters';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Role } from '@prisma/client';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import AdminGoalsTable from './components/AdminGoalsTable';
import { Pagination } from '@/app/components/shared/Pagination';
import { DeleteConfirmationModal } from '@/app/components/shared/DeleteConfirmationModal';
import { Goal, User as UserType } from '@/app/components/shared/types';
import Link from 'next/link';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showGoalFilters, setShowGoalFilters] = useState(true);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [goalsToBulkDelete, setGoalsToBulkDelete] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  // Pagination state for goals section
  const [goalsPage, setGoalsPage] = useState(1);
  const [goalsLimit, setGoalsLimit] = useState(20);
  const [goalsPagination, setGoalsPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data function
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
    } catch (error) { // handled silently
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load - only depends on session (not filters)
  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user?.role !== Role.ADMIN) {
      router.push('/dashboard');
      return;
    }

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, router]);

  // Fetch goals when toggled or filters/pagination change
  useEffect(() => {
    if (showGoals && session?.user?.role === Role.ADMIN) {
      fetchAllGoals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGoals, goalsPage, goalsLimit, selectedUser, selectedStatus, selectedPriority, selectedCategory]);

  const fetchAllGoals = async () => {
    try {
      setGoalsLoading(true);
      
      // Build query params with pagination and filters
      const params = new URLSearchParams({
        view: 'all',
        page: goalsPage.toString(),
        limit: goalsLimit.toString(),
        ...(selectedStatus && selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedPriority && selectedPriority !== '' && { priority: selectedPriority }),
        ...(selectedCategory && selectedCategory !== '' && selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedUser && selectedUser !== 'all' && { employeeId: selectedUser })
      });
      
      const response = await fetch(`/api/goals?${params}`);
      if (!response.ok) throw new Error('Failed to fetch goals');
      const data = await response.json();
      setGoals(data.goals || []);
      
      // Set pagination if available
      if (data.pagination) {
        setGoalsPagination(data.pagination);
      }
    } catch (error) { // handled silently
    } finally {
      setGoalsLoading(false);
    }
  };

  // No client-side filtering - server handles it
  const filteredGoals = goals;

  // Handle delete goal
  const handleDeleteGoal = (goal: Goal) => {
    setGoalToDelete(goal);
    setShowDeleteModal(true);
  };

  // Confirm delete goal
  const confirmDeleteGoal = async () => {
    if (!goalToDelete) return;
    
    try {
      // Optimistically update goals and stats immediately
      setGoals(prev => prev.filter(g => g.id !== goalToDelete.id));
      setStats(prev => ({
        ...prev,
        totalGoals: Math.max(0, prev.totalGoals - 1)
      }));

      const response = await fetch(`/api/goals/${goalToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      setShowDeleteModal(false);
      setGoalToDelete(null);
      // Goal deleted toast removed
      
      // Refresh goals and stats from server to ensure sync
      fetchAllGoals();
      fetchDashboardData();
    } catch (error) { // handled silently
      // Revert optimistic update on error
      fetchAllGoals();
      fetchDashboardData();
      // Error toast removed
    }
  };

  // Handle bulk delete
  const handleBulkDelete = (goalIds: string[]) => {
    setGoalsToBulkDelete(goalIds);
    setShowBulkDeleteModal(true);
  };

  // Confirm bulk delete
  const confirmBulkDelete = async () => {
    if (goalsToBulkDelete.length === 0) return;

    try {
      // Delete goals in parallel
      const deletePromises = goalsToBulkDelete.map(goalId =>
        fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
      );

      const results = await Promise.allSettled(deletePromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const failed = results.length - successful;

      if (successful > 0) {
        // Optimistically update goals and stats immediately
        setGoals(prev => prev.filter(g => !goalsToBulkDelete.includes(g.id)));
        setStats(prev => ({
          ...prev,
          totalGoals: Math.max(0, prev.totalGoals - successful)
        }));
        
        // Toast removed
      }

      if (failed > 0 && successful === 0) {
        // Error toast removed
      }

      setShowBulkDeleteModal(false);
      setGoalsToBulkDelete([]);
      
      // Refresh goals and stats from server to ensure sync
      fetchAllGoals();
      fetchDashboardData();
    } catch (error) { // handled silently
      // Error toast removed
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <BsCheckCircle className="w-4 h-4 text-success" />;
      case 'warning':
        return <BsExclamationTriangle className="w-4 h-4 text-warning" />;
      case 'error':
        return <BsXCircle className="w-4 h-4 text-error" />;
      default:
        return <BsActivity className="w-4 h-4 text-cat-professional" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-success bg-success-muted border-[rgb(var(--color-success))]/20';
      case 'degraded':
        return 'text-warning bg-warning-muted border-[rgb(var(--color-warning))]/20';
      case 'down':
        return 'text-error bg-error-muted border-[rgba(var(--color-error),0.2)]';
      default:
        return 'text-secondary bg-surface-secondary border-gray-500/20';
    }
  };


  return (
    <DashboardLayout type="admin">
      <div className="max-w-7xl mx-auto space-y-5">
          {/* System Control Panel Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[rgb(var(--color-accent))]/10 via-[rgb(var(--color-info))]/5 to-[rgb(var(--color-accent))]/10 border border-theme shadow-theme-sm"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[rgb(var(--color-accent))] via-[rgb(var(--color-info))] to-[rgb(var(--color-accent))]" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-[rgb(var(--color-accent))]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="relative p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-[rgb(var(--color-accent))]/20 flex items-center justify-center">
                  <BsCpu className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-primary">System Control Panel</h1>
                  <p className="text-sm text-secondary">Monitor and manage your organization</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success-muted border border-[rgb(var(--color-success))]/20">
                  <div className="w-2 h-2 rounded-full bg-[rgb(var(--color-success))] animate-pulse" />
                  <span className="text-xs font-medium text-success">System Online</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-secondary border border-theme">
                  <BsClock className="w-3 h-3 text-secondary" />
                  <span className="text-xs font-medium text-secondary">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {(() => {
              const statItems: StatItem[] = [
                {
                  title: 'Total Users',
                  value: stats.totalUsers,
                  icon: <BsPeople className="w-4 h-4" />,
                  onClick: () => router.push('/dashboard/admin/users'),
                  tooltip: 'Click to view all users'
                },
                {
                  title: 'Employees',
                  value: stats.employeeCount,
                  icon: <BsPeople className="w-4 h-4" />,
                  onClick: () => router.push('/dashboard/admin/users?role=EMPLOYEE'),
                  tooltip: 'View all employees'
                },
                {
                  title: 'Managers',
                  value: stats.managerCount,
                  icon: <BsBullseye className="w-4 h-4" />,
                  onClick: () => router.push('/dashboard/admin/users?role=MANAGER'),
                  tooltip: 'View all managers'
                },
                {
                  title: 'Admins',
                  value: stats.adminCount,
                  icon: <BsBullseye className="w-4 h-4" />,
                  onClick: () => router.push('/dashboard/admin/users?role=ADMIN'),
                  tooltip: 'View all admins'
                },
                {
                  title: 'Total Goals',
                  value: stats.totalGoals,
                  icon: <BsBullseye className="w-4 h-4" />,
                  onClick: () => router.push('/dashboard/admin/all-goals'),
                  tooltip: 'View all goals'
                }
              ];
              return <StatsSection stats={statItems} />;
            })()}
          </motion.div>

                     {/* Main Content Grid */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Role Distribution */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:col-span-2 card-glass rounded-2xl shadow-theme-sm hover:shadow-theme-lg overflow-hidden transition-all duration-300 group/card relative"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[rgb(var(--color-accent))] to-[rgb(var(--color-info))]" />
              <div className="p-4 border-b border-theme">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <BsShieldCheck className="w-5 h-5 text-accent" />
                     <h2 className="text-lg font-semibold text-primary">Role Distribution</h2>
                   </div>
                  <Link
                    href="/dashboard/admin/users"
                    className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:opacity-80 transition-colors"
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
                    return (
                      <div key={role.role} className="group">
                                                 <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-surface-secondary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                               <BsPeople className="w-4 h-4 text-secondary" />
                             </div>
                             <div>
                               <p className="text-sm font-medium text-primary capitalize">
                                 {role.role.toLowerCase()}
                               </p>
                               <p className="text-xs text-secondary">
                                 {role._count.role} {role._count.role === 1 ? 'user' : 'users'}
                               </p>
                             </div>
                           </div>
                           <div className="text-right">
                             <p className="text-lg font-bold text-primary">{role._count.role}</p>
                             <p className="text-xs text-secondary">{percentage.toFixed(1)}%</p>
                           </div>
                         </div>
                         <div className="w-full bg-surface-secondary rounded-full h-2">
                           <div
                             className="h-2 rounded-full bg-accent transition-all duration-1000"
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
               className="card-glass rounded-2xl shadow-theme-sm hover:shadow-theme-lg transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[rgb(var(--color-info))] to-[rgb(var(--color-accent))]" />
              <div className="p-6 border-b border-theme">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BsActivity className="w-5 h-5 text-accent" />
                    <h2 className="text-xl font-semibold text-primary">Recent Users</h2>
                  </div>
                  <Link
                    href="/dashboard/admin/users"
                    className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:opacity-80 transition-colors"
                  >
                    View all
                    <BsChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats.recentUsers.slice(0, 5).map((user, index) => (
                    <div key={user.email} className="flex items-center gap-4 p-3 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-all duration-300">
                      <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
                        <BsPeople className="w-5 h-5 text-[rgb(var(--color-text-inverse))]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">{user.name}</p>
                        <p className="text-xs text-secondary truncate">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-secondary">
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
            className="card-glass rounded-2xl shadow-theme-sm hover:shadow-theme-lg overflow-hidden transition-all duration-300 relative"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[rgb(var(--color-accent))] via-[rgb(var(--color-info))] to-[rgb(var(--color-accent))]" />
            <div className="p-6 border-b border-theme">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[rgb(var(--color-accent))]/20 to-[rgb(var(--color-info))]/20 border border-[rgb(var(--color-accent))]/20 rounded-xl flex items-center justify-center">
                    <BsBullseye className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-primary">All Users Goals</h2>
                    <p className="text-sm text-secondary">View and manage goals across all users</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowGoals(!showGoals)}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-[rgb(var(--color-text-inverse))] rounded-xl shadow-theme-sm hover:opacity-90 transition-all duration-300 focus-ring"
                >
                  {showGoals ? (
                    <>
                      <BsEyeSlash className="w-4 h-4" />
                      <span className="text-sm font-medium">Hide Goals</span>
                    </>
                  ) : (
                    <>
                      <BsEye className="w-4 h-4" />
                      <span className="text-sm font-medium">Show Goals</span>
                    </>
                  )}
                </motion.button>
              </div>
              
              {/* Filters */}
              <AnimatePresence mode="wait">
                {showGoals && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    <Filters
                      selectedUser={selectedUser}
                      onUserChange={(value) => {
                        setSelectedUser(value);
                        setGoalsPage(1);
                      }}
                      selectedStatus={selectedStatus}
                      onStatusChange={(value) => {
                        setSelectedStatus(value);
                        setGoalsPage(1);
                      }}
                      selectedPriority={selectedPriority}
                      onPriorityChange={(value) => {
                        setSelectedPriority(value);
                        setGoalsPage(1);
                      }}
                      selectedCategory={selectedCategory}
                      onCategoryChange={(value) => {
                        setSelectedCategory(value);
                        setGoalsPage(1);
                      }}
                      users={users}
                      onClear={() => {
                        setSelectedUser('all');
                        setSelectedStatus('all');
                        setSelectedPriority('');
                        setSelectedCategory('all');
                        setGoalsPage(1);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence mode="wait">
              {showGoals && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="p-6"
                >
                  {goalsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-secondary">Loading goals...</div>
                    </div>
                  ) : (
                    <>
                      <AdminGoalsTable
                        goals={filteredGoals}
                        selectedStatus={selectedStatus === 'all' ? '' : selectedStatus}
                        onStatusChange={(status) => {
                          setSelectedStatus(status === '' ? 'all' : status);
                          setGoalsPage(1); // Reset to first page on filter change
                        }}
                        onGoalClick={(goal) => setSelectedGoal(goal)}
                        onDelete={handleDeleteGoal}
                        onBulkDelete={handleBulkDelete}
                        showEmployee={true}
                        showManager={true}
                      />
                      
                      {/* Pagination */}
                      {goalsPagination && (
                        <div className="mt-6 pt-4 border-t border-theme">
                          <Pagination
                            page={goalsPagination.page}
                            limit={goalsPagination.limit}
                            total={goalsPagination.total}
                            totalPages={goalsPagination.totalPages}
                            hasNext={goalsPagination.hasNext}
                            hasPrev={goalsPagination.hasPrev}
                            onPageChange={(newPage) => {
                              setGoalsPage(newPage);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            onLimitChange={(newLimit) => {
                              setGoalsLimit(newLimit);
                              setGoalsPage(1);
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
      </div>

      {/* Goal Detail Modal */}
      {selectedGoal && (
        <GoalDetailModal
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)}
        />
      )}

      {/* Single Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setGoalToDelete(null);
        }}
        onConfirm={confirmDeleteGoal}
        title="Delete Goal"
        message={goalToDelete ? `Are you sure you want to delete "${goalToDelete.title}"? This action cannot be undone.` : 'Are you sure you want to delete this goal? This action cannot be undone.'}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => {
          setShowBulkDeleteModal(false);
          setGoalsToBulkDelete([]);
        }}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Goals"
        message={`Are you sure you want to delete ${goalsToBulkDelete.length} selected goal${goalsToBulkDelete.length !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
      />

    </DashboardLayout>
  );
}
