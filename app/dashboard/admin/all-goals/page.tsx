'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import AdminGoalsTable from '../components/AdminGoalsTable';
import { DeleteConfirmationModal } from '@/app/components/shared/DeleteConfirmationModal';
import { Pagination } from '@/app/components/shared/Pagination';
import { Goal, User as UserType } from '@/app/components/shared/types';
import { motion } from 'framer-motion';
import HeroSection from '@/app/components/shared/HeroSection';
import StatsSection, { StatItem } from '@/app/components/shared/StatsSection';
import Filters from '@/app/components/shared/Filters';
import { HERO_GRADIENTS } from '@/app/components/shared/filterConfig';
import { BsClipboardData, BsPencil, BsCheckCircle, BsXCircle } from 'react-icons/bs';
import { PageContainer } from '@/app/components/shared/PageContainer';

function AllGoalsPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [goalsToBulkDelete, setGoalsToBulkDelete] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Total stats for status grid (always show total, not filtered)
  const [totalStats, setTotalStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    draft: 0,
    completed: 0
  });
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);

  // Read URL params on mount and when they change
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const pageParam = searchParams.get('page');
    
    if (statusParam) {
      setSelectedStatus(statusParam);
    }
    
    if (pageParam) {
      const pageNum = parseInt(pageParam, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        setPage(pageNum);
      }
    }
  }, [searchParams]);

  // Fetch total stats (all goals, not filtered)
  const fetchTotalStats = async () => {
    try {
      // Fetch all goals without filters to get total counts
      const response = await fetch('/api/goals?view=all&limit=10000&page=1');
      if (!response.ok) return;
      
      const data = await response.json();
      const allGoals = data.goals || [];
      
      // Calculate stats from all goals
      setTotalStats({
        total: allGoals.length,
        approved: allGoals.filter((g: Goal) => g.status === 'APPROVED').length,
        rejected: allGoals.filter((g: Goal) => g.status === 'REJECTED').length,
        draft: allGoals.filter((g: Goal) => g.status === 'DRAFT').length,
        completed: allGoals.filter((g: Goal) => g.status === 'COMPLETED').length
      });
    } catch (error) {
      console.error('Error fetching total stats:', error);
    }
  };

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    // Fetch total stats once on mount
    fetchTotalStats();
    
    fetchData();
  }, [session, router, page, limit, selectedUser, selectedStatus, selectedPriority, selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Build query params with pagination and filters
      const params = new URLSearchParams({
        view: 'all',
        page: page.toString(),
        limit: limit.toString(),
        ...(selectedStatus && selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedPriority && selectedPriority !== '' && { priority: selectedPriority }),
        ...(selectedCategory && selectedCategory !== 'all' && selectedCategory !== '' && { category: selectedCategory }),
        ...(selectedUser && selectedUser !== 'all' && { employeeId: selectedUser })
      });

      const [goalsRes, usersRes] = await Promise.all([
        fetch(`/api/goals?${params}`),
        fetch('/api/users'),
      ]);

      if (!goalsRes.ok || !usersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [goalsData, usersData] = await Promise.all([
        goalsRes.json(),
        usersRes.ok ? usersRes.json() : { users: [] },
      ]);

      setGoals(goalsData.goals || []);
      setUsers(usersData.users || []);
      
      // Set pagination if available
      if (goalsData.pagination) {
        setPagination(goalsData.pagination);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // No client-side filtering needed - server handles it
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
      // Optimistically update goals immediately
      setGoals(prev => prev.filter(g => g.id !== goalToDelete.id));

      const response = await fetch(`/api/goals/${goalToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      setShowDeleteModal(false);
      setGoalToDelete(null);
      // Goal deleted toast removed
      fetchData(); // Refresh goals
      fetchTotalStats(); // Refresh total stats
    } catch (error) {
      console.error('Error deleting goal:', error);
      // Revert optimistic update on error
      fetchData();
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
      // Optimistically update goals immediately
      setGoals(prev => prev.filter(g => !goalsToBulkDelete.includes(g.id)));

      // Delete goals in parallel
      const deletePromises = goalsToBulkDelete.map(goalId =>
        fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
      );

      const results = await Promise.allSettled(deletePromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const failed = results.length - successful;

      if (successful > 0) {
        // Toast removed
      }

      if (failed > 0 && successful === 0) {
        // Error toast removed
      }

      setShowBulkDeleteModal(false);
      setGoalsToBulkDelete([]);
      
      // Refresh goals from server to ensure sync
      fetchData();
      fetchTotalStats(); // Refresh total stats
    } catch (error) {
      console.error('Error bulk deleting goals:', error);
      // Revert optimistic update on error
      fetchData();
      // Error toast removed
    }
  };

  return (
    <DashboardLayout type="admin">
      <div className="fixed inset-0 top-16 left-0 md:left-64 right-0 bottom-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden z-0">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-6 flex flex-col h-full w-full overflow-hidden">
          {/* Hero Section - Fixed */}
          <div className="flex-shrink-0 mb-3 relative z-10">
            <HeroSection 
              title="All Goals"
              subtitle="View and manage all goals across the organization"
              gradient={HERO_GRADIENTS.ADMIN}
            />
          </div>

          {/* Stats Section - Fixed */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0 mb-3"
          >
            {(() => {
              const statItems: StatItem[] = [
                {
                  title: 'Total Goals',
                  value: totalStats.total,
                  icon: <BsClipboardData className="w-4 h-4" />,
                  gradient: 'from-indigo-500 to-purple-500',
                  bgColor: 'bg-indigo-500/10',
                  borderColor: 'border-indigo-500/30'
                },
                {
                  title: 'Draft',
                  value: totalStats.draft,
                  icon: <BsPencil className="w-4 h-4" />,
                  gradient: 'from-gray-500 to-slate-500',
                  bgColor: 'bg-gray-500/10',
                  borderColor: 'border-gray-500/30',
                  onClick: () => {
                    setSelectedStatus('DRAFT');
                    setPage(1);
                    const params = new URLSearchParams(window.location.search);
                    params.set('status', 'DRAFT');
                    params.delete('page');
                    router.push(`/dashboard/admin/all-goals?${params.toString()}`);
                  }
                },
                {
                  title: 'Approved',
                  value: totalStats.approved,
                  icon: <BsCheckCircle className="w-4 h-4" />,
                  gradient: 'from-emerald-500 to-teal-500',
                  bgColor: 'bg-emerald-500/10',
                  borderColor: 'border-emerald-500/30',
                  onClick: () => {
                    setSelectedStatus('APPROVED');
                    setPage(1);
                    const params = new URLSearchParams(window.location.search);
                    params.set('status', 'APPROVED');
                    params.delete('page');
                    router.push(`/dashboard/admin/all-goals?${params.toString()}`);
                  }
                },
                {
                  title: 'Rejected',
                  value: totalStats.rejected,
                  icon: <BsXCircle className="w-4 h-4" />,
                  gradient: 'from-rose-500 to-red-500',
                  bgColor: 'bg-rose-500/10',
                  borderColor: 'border-rose-500/30',
                  onClick: () => {
                    setSelectedStatus('REJECTED');
                    setPage(1);
                    const params = new URLSearchParams(window.location.search);
                    params.set('status', 'REJECTED');
                    params.delete('page');
                    router.push(`/dashboard/admin/all-goals?${params.toString()}`);
                  }
                },
                {
                  title: 'Completed',
                  value: totalStats.completed,
                  icon: <BsCheckCircle className="w-4 h-4" />,
                  gradient: 'from-green-500 to-emerald-500',
                  bgColor: 'bg-green-500/10',
                  borderColor: 'border-green-500/30',
                  onClick: () => {
                    setSelectedStatus('COMPLETED');
                    setPage(1);
                    const params = new URLSearchParams(window.location.search);
                    params.set('status', 'COMPLETED');
                    params.delete('page');
                    router.push(`/dashboard/admin/all-goals?${params.toString()}`);
                  }
                }
              ];
              return <StatsSection stats={statItems} variant="auto" />;
            })()}
          </motion.div>

          {/* Filters - Fixed */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-shrink-0 mb-3"
          >
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
          </motion.div>

          {/* Goals Table - Scrollable Container */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm flex flex-col h-full">
                <div className="p-4 flex flex-col flex-1 overflow-hidden min-h-0">
                  <AdminGoalsTable
                    goals={filteredGoals}
                    selectedStatus={selectedStatus === 'all' ? '' : selectedStatus}
                    onStatusChange={(status) => {
                      setSelectedStatus(status === '' ? 'all' : status);
                      setPage(1); // Reset to first page on filter change
                    }}
                    onGoalClick={(goal) => setSelectedGoal(goal)}
                    onDelete={handleDeleteGoal}
                    onBulkDelete={handleBulkDelete}
                    showEmployee={true}
                    showManager={true}
                  />
                  
                  {/* Pagination - Fixed at bottom */}
                  {pagination && (
                    <div className="flex-shrink-0 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Pagination
                        page={pagination.page}
                        limit={pagination.limit}
                        total={pagination.total}
                        totalPages={pagination.totalPages}
                        hasNext={pagination.hasNext}
                        hasPrev={pagination.hasPrev}
                        onPageChange={(newPage) => {
                          setPage(newPage);
                        }}
                        onLimitChange={(newLimit) => {
                          setLimit(newLimit);
                          setPage(1);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
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

export default function AllGoalsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout type="admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Loading...</div>
        </div>
      </DashboardLayout>
    }>
      <AllGoalsPageContent />
    </Suspense>
  );
}
