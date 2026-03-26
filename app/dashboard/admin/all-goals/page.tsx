'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/app/components/shared/feedback';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import AdminGoalsTable from '../components/AdminGoalsTable';
import { DeleteConfirmationModal } from '@/app/components/shared/DeleteConfirmationModal';
import { Pagination } from '@/app/components/shared/Pagination';
import { Goal, User as UserType } from '@/app/components/shared/types';
import { PageHeader } from '@/app/components/shared/PageHeader';
import MetricStrip, { Metric } from '@/app/components/shared/MetricStrip';
import { useToast } from '@/app/components/shared/Toast';

import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';

import { usePagination, useModalState } from '@/app/hooks';

function AllGoalsPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deleteModal = useModalState<Goal>();
  const bulkDeleteModal = useModalState<string[]>();

  // Total stats for status grid (always show total, not filtered)
  const [totalStats, setTotalStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    draft: 0,
    completed: 0
  });

  // Pagination state
  const { page, limit, setPage, setLimit, pagination, setPagination, paginationProps } = usePagination();

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

  // Fetch total stats using the stats from the goals API (no need to load 10K goals)
  const fetchTotalStats = useCallback(async () => {
    try {
      // Use limit=1 to get stats without loading all goals (API returns stats regardless of page size)
      const response = await fetch('/api/goals?view=all&limit=1&page=1');
      if (!response.ok) return;

      const data = await response.json();
      const apiStats = data.stats;

      // Use pre-calculated stats from API (no client-side counting needed)
      if (apiStats) {
        setTotalStats({
          total: apiStats.total || data.meta?.total || 0,
          approved: apiStats.approved || 0,
          rejected: apiStats.rejected || 0,
          draft: apiStats.draft || 0,
          completed: apiStats.completed || 0
        });
      }
    } catch (error) {
    }
  }, []);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  // No client-side filtering needed - server handles it
  const filteredGoals = goals;

  // Handle delete goal
  const handleDeleteGoal = (goal: Goal) => {
    deleteModal.open(goal);
  };

  // Confirm delete goal
  const confirmDeleteGoal = async () => {
    if (!deleteModal.data) return;

    try {
      // Optimistically update goals immediately
      setGoals(prev => prev.filter(g => g.id !== deleteModal.data!.id));

      const response = await fetch(`/api/goals/${deleteModal.data.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      deleteModal.close();
      toast.success('Goal deleted successfully');
      fetchData(); // Refresh goals
      fetchTotalStats(); // Refresh total stats
    } catch (error) {
      // Revert optimistic update on error
      fetchData();
      toast.error('Failed to delete goal');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = (goalIds: string[]) => {
    bulkDeleteModal.open(goalIds);
  };

  // Confirm bulk delete
  const confirmBulkDelete = async () => {
    if (!bulkDeleteModal.data || bulkDeleteModal.data.length === 0) return;

    const goalIds = bulkDeleteModal.data;

    try {
      // Optimistically update goals immediately
      setGoals(prev => prev.filter(g => !goalIds.includes(g.id)));

      // Delete goals in parallel
      const deletePromises = goalIds.map(goalId =>
        fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
      );

      const results = await Promise.allSettled(deletePromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const failed = results.length - successful;

      if (successful > 0) {
        toast.success(`${successful} goal${successful !== 1 ? 's' : ''} deleted successfully`);
      }

      if (failed > 0 && successful === 0) {
        toast.error('Failed to delete selected goals');
      }

      bulkDeleteModal.close();

      // Refresh goals from server to ensure sync
      fetchData();
      fetchTotalStats(); // Refresh total stats
    } catch (error) {
      // Revert optimistic update on error
      fetchData();
      toast.error('Failed to delete selected goals');
    }
  };

  if (loading) {
    return (
      <DashboardLayout type="admin">
        <LoadingSkeleton variant="page" />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout type="admin">
        <ErrorState message={error} onRetry={() => { setError(null); fetchData(); }} />
      </DashboardLayout>
    );
  }

  const metrics: Metric[] = [
    {
      label: 'Total Goals',
      value: totalStats.total,
      color: 'accent',
    },
    {
      label: 'Draft',
      value: totalStats.draft,
      color: 'secondary',
      onClick: () => {
        setSelectedStatus('DRAFT');
        setPage(1);
        const params = new URLSearchParams(window.location.search);
        params.set('status', 'DRAFT');
        params.delete('page');
        router.push(`/dashboard/admin/all-goals?${params.toString()}`);
      },
      active: selectedStatus === 'DRAFT',
    },
    {
      label: 'Approved',
      value: totalStats.approved,
      color: 'success',
      onClick: () => {
        setSelectedStatus('APPROVED');
        setPage(1);
        const params = new URLSearchParams(window.location.search);
        params.set('status', 'APPROVED');
        params.delete('page');
        router.push(`/dashboard/admin/all-goals?${params.toString()}`);
      },
      active: selectedStatus === 'APPROVED',
    },
    {
      label: 'Rejected',
      value: totalStats.rejected,
      color: 'error',
      onClick: () => {
        setSelectedStatus('REJECTED');
        setPage(1);
        const params = new URLSearchParams(window.location.search);
        params.set('status', 'REJECTED');
        params.delete('page');
        router.push(`/dashboard/admin/all-goals?${params.toString()}`);
      },
      active: selectedStatus === 'REJECTED',
    },
    {
      label: 'Completed',
      value: totalStats.completed,
      color: 'info',
      onClick: () => {
        setSelectedStatus('COMPLETED');
        setPage(1);
        const params = new URLSearchParams(window.location.search);
        params.set('status', 'COMPLETED');
        params.delete('page');
        router.push(`/dashboard/admin/all-goals?${params.toString()}`);
      },
      active: selectedStatus === 'COMPLETED',
    }
  ];

  return (
    <DashboardLayout type="admin">
      <div className="fixed inset-0 top-14 left-0 md:left-56 right-0 bottom-0 bg-surface-primary flex flex-col overflow-hidden z-0">
        <div className="relative max-w-7xl mx-auto px-6 py-6 flex flex-col h-full w-full overflow-hidden space-y-6">
          {/* Page Header */}
          <PageHeader
            title="All Goals"
            description="Browse, filter, and manage all organizational goals"
            badge="Admin"
          />

          {/* Metric Strip */}
          <MetricStrip metrics={metrics} />

          {/* Toolbar + Filters */}
          <PageToolbar
            searchValue={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value);
              setPage(1);
            }}
            searchPlaceholder="Search goals..."
            hasActiveFilters={selectedUser !== 'all' || selectedStatus !== 'all' || selectedPriority !== '' || selectedCategory !== 'all'}
            onClearFilters={() => {
              setSelectedUser('all');
              setSelectedStatus('all');
              setSelectedPriority('');
              setSelectedCategory('all');
              setSearchQuery('');
              setPage(1);
              router.push('/dashboard/admin/all-goals');
            }}
          >
            <FilterSelect
              value={selectedUser}
              onChange={setSelectedUser}
              options={users.map(u => ({ value: u.id || u.email, label: u.name }))}
              placeholder="All Users"
            />
            <FilterSelect
              value={selectedStatus === 'all' ? '' : selectedStatus}
              onChange={(value) => setSelectedStatus(value || 'all')}
              options={[
                { value: 'DRAFT', label: 'Draft' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
                { value: 'COMPLETED', label: 'Completed' },
              ]}
              placeholder="All Status"
            />
            <FilterSelect
              value={selectedPriority}
              onChange={setSelectedPriority}
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'CRITICAL', label: 'Critical' },
              ]}
              placeholder="All Priority"
            />
            <FilterSelect
              value={selectedCategory === 'all' ? '' : selectedCategory}
              onChange={(value) => setSelectedCategory(value || 'all')}
              options={[
                { value: 'PROFESSIONAL', label: 'Professional' },
                { value: 'TECHNICAL', label: 'Technical' },
                { value: 'LEADERSHIP', label: 'Leadership' },
                { value: 'PERSONAL', label: 'Personal' },
                { value: 'TRAINING', label: 'Training' },
                { value: 'KPI', label: 'KPI' },
              ]}
              placeholder="All Categories"
            />
          </PageToolbar>

          {/* Goals Table - Scrollable Container */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="bg-surface-elevated rounded-2xl border border-theme overflow-hidden shadow-theme-sm flex flex-col h-full">
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
                  {paginationProps && (
                    <div className="flex-shrink-0 mt-4 pt-4 border-t border-theme">
                      <Pagination {...paginationProps} />
                    </div>
                  )}
                </div>
              </div>
            </div>
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
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={confirmDeleteGoal}
        title="Delete Goal"
        message={deleteModal.data ? `Are you sure you want to delete "${deleteModal.data.title}"? This action cannot be undone.` : 'Are you sure you want to delete this goal? This action cannot be undone.'}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={bulkDeleteModal.isOpen}
        onClose={bulkDeleteModal.close}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Goals"
        message={`Are you sure you want to delete ${bulkDeleteModal.data?.length || 0} selected goal${(bulkDeleteModal.data?.length || 0) !== 1 ? 's' : ''}? This action cannot be undone.`}
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
        <LoadingSkeleton variant="page" />
      </DashboardLayout>
    }>
      <AllGoalsPageContent />
    </Suspense>
  );
}
