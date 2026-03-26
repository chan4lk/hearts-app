'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { usePagination, useModalState } from '@/app/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { BsExclamationTriangle, BsArrowUpRight, BsCheckCircle, BsClock, BsFileEarmarkText, BsCheck2Circle, BsXCircle, BsListCheck, BsPlusLg } from 'react-icons/bs';
import { Button } from '@/app/components/ui/button';
import { PageHeader } from '@/app/components/shared/PageHeader';
import { useToast } from '@/app/components/shared/Toast';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/app/components/shared/feedback';

// Layout
import DashboardLayout from '@/app/components/layout/DashboardLayout';

// Components

import StatsSection, { StatItem } from '@/app/components/shared/StatsSection';
import { GoalList } from './components/sections/GoalList';
import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';

import { CreateGoalModal } from './components/modals/CreateGoalModal';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import { DeleteConfirmationModal } from '@/app/components/shared/DeleteConfirmationModal';
import { Pagination } from '@/app/components/shared/Pagination';
import GoalTemplates from '@/app/components/shared/GoalTemplates';
import { BulkGoalFormModal } from '@/app/components/shared/BulkGoalFormModal';
import { CATEGORIES } from '@/app/components/shared/constants';

// Styles and Types
import { GoalFormData, GoalStats, User, Goal } from '@/app/components/shared/types';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <BsExclamationTriangle className="w-12 h-12 text-error mb-4" />
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-secondary mb-4">{error.message}</p>
      <Button onClick={resetErrorBoundary} variant="outline">
        Try again
      </Button>
    </div>
  );
}

function ManagerGoalSettingPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [assignedEmployees, setAssignedEmployees] = useState<User[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const createModal = useModalState();
  const viewModal = useModalState<Goal>();
  const editModal = useModalState<Goal>();
  const deleteModal = useModalState<string>();
  const bulkCreateModal = useModalState();
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    category: 'PROFESSIONAL',
    department: 'ENGINEERING',
    priority: 'MEDIUM'
  });
  const [stats, setStats] = useState<GoalStats>({
    totalEmployees: 0,
    totalGoals: 0,
    total: 0,
    completedGoals: 0,
    completed: 0,
    pendingGoals: 0,
    pending: 0,
    draftGoals: 0,
    approvedGoals: 0,
    approved: 0,
    rejectedGoals: 0,
    rejected: 0,
    modified: 0,
    achievementScore: 0,
    inProgressGoals: 0,
    totalManagers: 0,
    categoryStats: {}
  });
  const [showTemplates, setShowTemplates] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { page, limit, setPage, setLimit, pagination, setPagination } = usePagination();

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }
    if (!['MANAGER', 'ADMIN'].includes(session.user.role)) {
      router.push('/dashboard');
      return;
    }
    fetchAssignedEmployees();
  }, [session, router]);
  
  // Refetch goals when pagination or filters change
  useEffect(() => {
    if (assignedEmployees.length > 0) {
      fetchGoals(assignedEmployees);
    }
  }, [page, limit, selectedEmployee, selectedStatus, selectedPriority]);

  const fetchAssignedEmployees = async () => {
    try {
      const response = await fetch('/api/employees/assigned');
      if (!response.ok) throw new Error('Failed to fetch assigned employees');
      const data = await response.json();
      setAssignedEmployees(data.employees);
      fetchGoals(data.employees);
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Failed to load assigned employees'));
      // Toast removed
    }
  };

  const fetchGoals = async (employees: User[]) => {
    try {
      // Build query params with pagination and filters
      const params = new URLSearchParams({
        view: 'team-goals',
        page: page.toString(),
        limit: limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...(selectedStatus && selectedStatus !== '' && { status: selectedStatus }),
        ...(selectedPriority && selectedPriority !== '' && { priority: selectedPriority }),
        ...(selectedEmployee && selectedEmployee !== 'all' && { employeeId: selectedEmployee })
      });
      
      const response = await fetch(`/api/goals?${params}`);
      if (!response.ok) throw new Error('Failed to fetch goals');
      const data = await response.json();

      const assignedGoals = (data.goals || []).filter((goal: Goal) =>
        goal.manager?.id === session?.user?.id &&
        goal.employee?.id !== session?.user?.id
      );

      setGoals(assignedGoals);
      updateStats(assignedGoals, employees);
      
      // Set pagination if available
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      // Toast removed
    } finally {
      setLoading(false);
    }
  };

  // Optimized: single-pass status counting instead of 12 separate .filter() calls
  const updateStats = useCallback((goalsList: Goal[], employeesList: User[]) => {
    const filteredGoals = selectedEmployee === 'all' ? goalsList : goalsList.filter(goal => goal.employee?.id === selectedEmployee);

    const sc: Record<string, number> = {};
    const cc: Record<string, number> = {};
    for (const g of filteredGoals) {
      sc[g.status] = (sc[g.status] || 0) + 1;
      if (g.category) cc[g.category] = (cc[g.category] || 0) + 1;
    }

    const completed = sc['COMPLETED'] || 0;
    const total = filteredGoals.length;

    setStats({
      totalEmployees: employeesList.length,
      totalGoals: total,
      total,
      completedGoals: completed,
      completed,
      pendingGoals: sc['PENDING'] || 0,
      pending: sc['PENDING'] || 0,
      draftGoals: sc['DRAFT'] || 0,
      approvedGoals: sc['APPROVED'] || 0,
      approved: sc['APPROVED'] || 0,
      rejectedGoals: sc['REJECTED'] || 0,
      rejected: sc['REJECTED'] || 0,
      modified: sc['MODIFIED'] || 0,
      achievementScore: total > 0 ? Math.round((completed / total) * 100) : 0,
      inProgressGoals: (sc['PENDING'] || 0) + (sc['MODIFIED'] || 0),
      totalManagers: 0,
      categoryStats: cc
    });
  }, [selectedEmployee]);

  const handleSubmit = async (formData: GoalFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create goal');
      }

      const { goal } = await response.json();
      setGoals(prev => [goal, ...prev]);
      createModal.close();
      resetForm();
      toast.success('Goal created successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (bulkGoals: any[]) => {
    setLoading(true);
    try {

      const response = await fetch('/api/goals/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals: bulkGoals }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create goals');
      }

      const result = await response.json();

      if (result.success) {
        // Add the created goals to the state
        setGoals(prev => [...result.goals, ...prev]);
        bulkCreateModal.close();

        // Refresh the goals and stats
        await fetchAssignedEmployees();
        toast.success(`${result.goals.length} goals created successfully`);
      } else {
        throw new Error(result.message || 'Failed to create goals');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create goals');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGoal = async (updatedData: GoalFormData) => {
    if (!editModal.data) return;
    const selectedGoal = editModal.data;

    // Optimistic update - update UI immediately
    const optimisticGoal: Goal = {
      ...selectedGoal,
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    setGoals(prev => prev.map(goal =>
      goal.id === selectedGoal.id ? optimisticGoal : goal
    ));

    // Close the modal immediately for a more responsive UX
    editModal.close();
    const goalToView = selectedGoal;
    
    try {
      // Make API call
      const response = await fetch(`/api/goals/${goalToView.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update goal');
      }

      const result = await response.json();
      const updatedGoal = result.goal || result;

      // Ensure date fields are valid Date objects or valid ISO strings
      updatedGoal.dueDate = new Date(updatedGoal.dueDate).toISOString();
      updatedGoal.updatedAt = new Date(updatedGoal.updatedAt).toISOString();

      // Update with server data (replace optimistic update)
      setGoals(prev => prev.map(goal =>
        goal.id === goalToView.id ? updatedGoal : goal
      ));

      // Show view modal after update
      viewModal.open(updatedGoal);
      toast.success('Goal updated successfully');

    } catch (error) {
      // Revert optimistic update on error
      setGoals(prev => prev.map(goal =>
        goal.id === goalToView.id ? goalToView : goal
      ));
      toast.error(error instanceof Error ? error.message : 'Failed to update goal');
      // Reopen edit modal on error
      editModal.open(goalToView);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.data) return;
    const goalToDelete = deleteModal.data;

    // Store the goal to restore if deletion fails
    const goalToRestore = goals.find(g => g.id === goalToDelete);

    // Optimistic update - remove from UI immediately
    setGoals(prev => prev.filter(goal => goal.id !== goalToDelete));
    deleteModal.close();
    const deletedGoalId = goalToDelete;
    toast.success('Goal deleted successfully');

    try {
      const response = await fetch(`/api/goals/${deletedGoalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete goal');
      }

      // Success - goal is already removed from UI
    } catch (error) {
      // Revert optimistic update on error
      if (goalToRestore) {
        setGoals(prev => [...prev, goalToRestore].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
      toast.error(error instanceof Error ? error.message : 'Failed to delete goal');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      employeeId: '',
      category: 'PROFESSIONAL',
      department: 'ENGINEERING',
      priority: 'MEDIUM'
    });
  };

  const handleEditGoal = (goal: Goal) => {
    setFormData({
      title: goal.title,
      description: goal.description,
      dueDate: new Date(goal.dueDate).toISOString().split('T')[0],
      employeeId: goal.employee?.id || '',
      category: goal.category,
      department: goal.department || 'ENGINEERING',
      priority: goal.priority || 'MEDIUM'
    });
    editModal.open(goal);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAssignedEmployees();
    setRefreshing(false);
  };

  const handlePriorityUpdate = (goalId: string, newPriority: string, updatedGoal: Goal) => {
    // Update the goals state immediately
    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? updatedGoal : goal
      )
    );
    // Update stats
    updateStats(
      goals.map(goal => goal.id === goalId ? updatedGoal : goal),
      assignedEmployees
    );
  };

  const handleDueDateUpdate = (goalId: string, newDueDate: string, updatedGoal: Goal) => {
    // Update the goals state immediately
    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? updatedGoal : goal
      )
    );
    // Update stats (though due date doesn't affect stats, we refresh for consistency)
    updateStats(
      goals.map(goal => goal.id === goalId ? updatedGoal : goal),
      assignedEmployees
    );
  };

  return (
    <DashboardLayout type="manager">
      {loading ? <LoadingSkeleton variant="page" /> : error ? <ErrorState message={error.message} onRetry={() => { setError(null); fetchAssignedEmployees(); }} /> :
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Set Goals"
          description="Assign and manage team goals"
          badge="Manager"
        >
          <Button variant="outline" onClick={() => bulkCreateModal.open()}>
            Bulk Create
          </Button>
          <Button onClick={() => createModal.open()}>
            <BsPlusLg className="w-3.5 h-3.5 mr-1.5" />
            Create Goal
          </Button>
        </PageHeader>

        <div className="bg-surface-elevated rounded-2xl p-4 border border-theme space-y-4 relative overflow-hidden transition-all duration-300 hover:shadow-theme-sm">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent" />
          {(() => {
            const statItems: StatItem[] = [
              {
                title: 'Total Goals',
                value: stats.totalGoals,
                icon: <BsListCheck className="w-4 h-4" />,
              },
              {
                title: 'Draft',
                value: stats.draftGoals,
                icon: <BsFileEarmarkText className="w-4 h-4" />,
              },
              {
                title: 'Pending',
                value: stats.pendingGoals,
                icon: <BsClock className="w-4 h-4" />,
              },
              {
                title: 'Approved',
                value: stats.approvedGoals,
                icon: <BsCheck2Circle className="w-4 h-4" />,
              },
              {
                title: 'Rejected',
                value: stats.rejectedGoals,
                icon: <BsXCircle className="w-4 h-4" />,
              },
              {
                title: 'Completed',
                value: stats.completedGoals,
                icon: <BsCheckCircle className="w-4 h-4" />,
              }
            ];
            return <StatsSection stats={statItems} />;
          })()}
        </div>

        {/* Toolbar + Filters */}
        <PageToolbar
          searchValue={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          searchPlaceholder="Search goals..."
          actions={[
            {
              label: 'Bulk Create',
              onClick: () => bulkCreateModal.open(),
              variant: 'secondary',
            },
            {
              label: 'Create Goal',
              onClick: () => createModal.open(),
              variant: 'primary',
            },
          ]}
          hasActiveFilters={selectedEmployee !== 'all' || selectedStatus !== '' || selectedPriority !== ''}
          onClearFilters={() => {
            setSelectedEmployee('all');
            setSelectedStatus('');
            setSelectedPriority('');
            setSearchQuery('');
            setPage(1);
          }}
        >
          <FilterSelect
            value={selectedEmployee === 'all' ? '' : selectedEmployee}
            onChange={(value) => {
              setSelectedEmployee(value || 'all');
              setPage(1);
            }}
            options={assignedEmployees.map(emp => ({ value: emp.id, label: emp.name }))}
            placeholder="All Employees"
          />
          <FilterSelect
            value={selectedStatus}
            onChange={(value) => {
              setSelectedStatus(value);
              setPage(1);
            }}
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
            onChange={(value) => {
              setSelectedPriority(value);
              setPage(1);
            }}
            options={[
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'CRITICAL', label: 'Critical' },
            ]}
            placeholder="All Priority"
          />
        </PageToolbar>

        {/* Goal Templates Section */}

        <div className="space-y-4">
          {/* View Templates Button */}
          <motion.button
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full bg-surface-elevated rounded-2xl p-4
              shadow-theme-sm border border-theme
              hover:shadow-theme-lg hover:border-[rgba(var(--color-accent),0.2)] transition-all duration-300
              text-primary font-semibold flex items-center justify-center gap-2 focus-ring"
          >
            {showTemplates ? 'Hide Templates' : 'Create Goals Using Templates'}
            <BsArrowUpRight className={`transform transition-transform duration-300 ${showTemplates ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-surface-elevated backdrop-blur-xl rounded-2xl p-6 border border-theme shadow-theme-sm">
                  <h3 className="text-xl font-bold text-primary mb-4">Goal Templates</h3>
                  <GoalTemplates onSelect={(template) => {
                    setFormData(prev => ({
                      ...prev,
                      title: template.title,
                      description: template.description,
                      category: template.category,
                      department: 'ENGINEERING',
                      priority: 'MEDIUM'
                    }));
                    createModal.open();
                  }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <GoalList
          goals={goals}
          selectedEmployee={selectedEmployee}
          selectedStatus={selectedStatus}
          selectedPriority={selectedPriority}
          onViewGoal={(goal) => {
            viewModal.open(goal);
          }}
          onEditGoal={handleEditGoal}
          onDeleteGoal={(goalId) => {
            deleteModal.open(goalId);
          }}
          onPriorityUpdate={handlePriorityUpdate}
          onDueDateUpdate={handleDueDateUpdate}
          pagination={pagination}
          onPageChange={(newPage) => {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />

        {/* Modals */}
        <CreateGoalModal
          isOpen={createModal.isOpen || editModal.isOpen}
          onClose={() => {
            createModal.close();
            editModal.close();
            resetForm();
          }}
          onSubmit={editModal.isOpen ? handleUpdateGoal : handleSubmit}
          assignedEmployees={assignedEmployees}
          loading={loading}
          formData={formData}
          setFormData={setFormData}
          mode={editModal.isOpen ? 'edit' : 'create'}
          initialData={editModal.data ? {
            title: editModal.data.title,
            description: editModal.data.description,
            dueDate: editModal.data.dueDate,
            employeeId: editModal.data.employee?.id || '',
            category: editModal.data.category,
            department: editModal.data.department || 'ENGINEERING',
            priority: editModal.data.priority || 'MEDIUM'
          } : undefined}
        />

        {viewModal.data && (
          <GoalDetailModal
            goal={viewModal.data}
            onClose={() => {
              viewModal.close();
            }}
            onEdit={(goal) => {
              handleEditGoal(goal);
              viewModal.close();
            }}
            onDelete={(goal) => {
              viewModal.close();
              deleteModal.open(goal.id);
            }}
          />
        )}

        <BulkGoalFormModal
          isOpen={bulkCreateModal.isOpen}
          onClose={() => bulkCreateModal.close()}
          onSubmit={handleBulkSubmit}
          assignedEmployees={assignedEmployees}
          loading={loading}
        />

        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => {
            deleteModal.close();
          }}
          onConfirm={handleDelete}
          title="Delete Goal"
          message="Are you sure you want to delete this goal? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
        />
      </div>}
    </DashboardLayout>
  );
}

export default function ManagerGoalSettingPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="page" />}>
      <ManagerGoalSettingPageContent />
    </Suspense>
  );
}