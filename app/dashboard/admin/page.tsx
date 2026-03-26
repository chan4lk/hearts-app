'use client';

import DashboardLayout from '@/app/components/layout/DashboardLayout';
import {
  BsCheckCircle,
  BsExclamationTriangle,
  BsXCircle,
  BsActivity,
  BsChevronRight,
  BsPeople,
  BsBullseye,
  BsShieldCheck,
} from 'react-icons/bs';

import MetricStrip, { Metric } from '@/app/components/shared/MetricStrip';
import { PageHeader } from '@/app/components/shared/PageHeader';
import { useToast } from '@/app/components/shared/Toast';
import Filters from '@/app/components/shared/Filters';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Role } from '@prisma/client';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/app/components/shared/feedback';
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

const GOAL_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
] as const;

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [goalsToBulkDelete, setGoalsToBulkDelete] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
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

  // Fetch goals on mount and when filters/pagination change
  useEffect(() => {
    if (session?.user?.role === Role.ADMIN) {
      fetchAllGoals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalsPage, goalsLimit, selectedUser, selectedStatus, selectedPriority, selectedCategory]);

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
    } catch {
      // silent
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
      toast.success('Goal deleted successfully');

      // Single refresh to sync both goals and stats (avoid double-refetch)
      await Promise.all([fetchAllGoals(), fetchDashboardData()]);
    } catch {
      toast.error('Failed to delete goal');
      // Revert optimistic update on error
      await Promise.all([fetchAllGoals(), fetchDashboardData()]);
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

        toast.success(`${successful} goal${successful !== 1 ? 's' : ''} deleted successfully`);
      }

      if (failed > 0 && successful === 0) {
        toast.error('Failed to delete goals');
      }

      setShowBulkDeleteModal(false);
      setGoalsToBulkDelete([]);

      // Single parallel refresh to sync both goals and stats
      await Promise.all([fetchAllGoals(), fetchDashboardData()]);
    } catch {
      toast.error('Failed to delete goals');
      await Promise.all([fetchAllGoals(), fetchDashboardData()]);
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

  const metrics: Metric[] = [
    { label: 'Total Users', value: stats.totalUsers, color: 'accent', onClick: () => router.push('/dashboard/admin/users') },
    { label: 'Employees', value: stats.employeeCount, color: 'info' },
    { label: 'Managers', value: stats.managerCount, color: 'warning' },
    { label: 'Total Goals', value: stats.totalGoals, color: 'success', onClick: () => router.push('/dashboard/admin/all-goals') },
  ];

  if (isLoading) {
    return (
      <DashboardLayout type="admin">
        <LoadingSkeleton variant="page" />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout type="admin">
        <ErrorState message={error} onRetry={() => { setError(null); fetchDashboardData(); }} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <PageHeader title="System Overview" description="Monitor and manage your organization" badge="Admin" />

        {/* Metric Strip */}
        <MetricStrip metrics={metrics} />

        {/* Main Content Grid: Role Distribution + Recent Users */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-2 card-glass rounded-2xl shadow-theme-sm overflow-hidden"
          >
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
                {stats.roleDistribution.map((role) => {
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
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Recent Users */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="card-glass rounded-2xl shadow-theme-sm overflow-hidden"
          >
            <div className="p-4 border-b border-theme">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BsActivity className="w-5 h-5 text-accent" />
                  <h2 className="text-lg font-semibold text-primary">Recent Users</h2>
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
              <div className="space-y-3">
                {stats.recentUsers.slice(0, 5).map((user) => (
                  <div key={user.email} className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-all duration-300">
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="card-glass rounded-2xl shadow-theme-sm overflow-hidden"
        >
          <div className="p-6 border-b border-theme">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BsBullseye className="w-5 h-5 text-accent" />
                <div>
                  <h2 className="text-lg font-semibold text-primary">All Users Goals</h2>
                  <p className="text-sm text-secondary">View and manage goals across all users</p>
                </div>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide mb-4">
              {GOAL_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setSelectedStatus(tab.value);
                    setGoalsPage(1);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 focus-ring ${
                    selectedStatus === tab.value
                      ? 'bg-accent text-[rgb(var(--color-text-inverse))] shadow-theme-sm'
                      : 'text-secondary hover:text-primary hover:bg-surface-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filters */}
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
          </div>

          <div className="p-6">
            {goalsLoading ? (
              <LoadingSkeleton variant="table" />
            ) : filteredGoals.length === 0 ? (
              <EmptyState title="No goals found" description="No goals match the current filters. Try adjusting your filters or check back later." />
            ) : (
              <>
                <AdminGoalsTable
                  goals={filteredGoals}
                  selectedStatus={selectedStatus === 'all' ? '' : selectedStatus}
                  onStatusChange={(status) => {
                    setSelectedStatus(status === '' ? 'all' : status);
                    setGoalsPage(1);
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
          </div>
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
