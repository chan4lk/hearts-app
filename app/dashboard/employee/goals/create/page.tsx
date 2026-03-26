'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePagination, useModalState } from '@/app/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { BsPlus, BsArrowUpRight } from 'react-icons/bs';
import GoalTemplates from '@/app/components/shared/GoalTemplates';

import { GoalsList } from './components/GoalsList';
import StatsSection, { StatItem } from '@/app/components/shared/StatsSection';
import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';

import { BsClipboardData, BsCheckCircle, BsPencil, BsXCircle } from 'react-icons/bs';
import { PageHeader } from '@/app/components/shared/PageHeader';
import { useToast } from '@/app/components/shared/Toast';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import { DeleteConfirmationModal } from '@/app/components/shared/DeleteConfirmationModal';
import { Goal, NewGoal } from '@/app/components/shared/types';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/app/components/shared/feedback';
import { useSession, getSession } from 'next-auth/react';
import { CATEGORIES } from '@/app/components/shared/constants';
import { GoalFormModal } from '@/app/components/shared/GoalFormModal';
import { Pagination } from '@/app/components/shared/Pagination';

// Helper function to get the auth token
const getAuthToken = async () => {
  const session = await getSession();
  return session?.user?.id || '';
};

function GoalsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const toast = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('');
  const createModal = useModalState();
  const viewModal = useModalState<Goal>();
  const editModal = useModalState<Goal>();
  const deleteModal = useModalState<Goal>();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    employeeId: session?.user?.id || '',
    category: 'PROFESSIONAL',
    department: 'ENGINEERING',
    priority: 'MEDIUM'
  });
  const [context, setContext] = useState('');
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    category?: string;
    employeeId?: string;
  }>({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { page, limit, setPage, setLimit, pagination, setPagination } = usePagination();

  // Helper to check if user is admin or manager
  const userIsAdminOrManager = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER';

  // Ensure employeeId defaults to the signed-in user once session is ready
  useEffect(() => {
    if (session?.user?.id) {
      setFormData(prev => ({
        ...prev,
        employeeId: prev.employeeId || session.user.id
      }));
    }
  }, [session?.user?.id]);

  // Auth is handled by middleware — just guard render
  if (status !== 'loading' && (!session || !['EMPLOYEE', 'MANAGER', 'ADMIN'].includes(session.user.role))) {
    return null;
  }

  useEffect(() => {
    fetchGoals();
  }, [page, limit, selectedStatus, selectedCategory, selectedPriority]);

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({
        view: 'my-goals',
        page: page.toString(),
        limit: limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...(selectedStatus && selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedCategory && selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedPriority && { priority: selectedPriority })
      });

      const response = await fetch(`/api/goals?${params}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);

        // Set pagination if available
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        setGoals([]);
        setPagination(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
      showNotificationWithTimeout('Failed to load goals', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotificationWithTimeout = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (goalData: NewGoal) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create goal: ${errorData.error || response.statusText}`);
      }

      createModal.close();
      fetchGoals();
      setFormData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        employeeId: session?.user?.id || '',
        category: 'PROFESSIONAL',
        department: 'ENGINEERING',
        priority: 'MEDIUM'
      });
      toast.success('Goal created successfully');
    } catch (error) {
      showNotificationWithTimeout(
        `Failed to create goal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setFormData({
      title: goal.title,
      description: goal.description,
      dueDate: goal.dueDate.split('T')[0],
      employeeId: goal.employeeId || session?.user?.id || '',
      category: goal.category,
      department: goal.department || 'ENGINEERING',
      priority: goal.priority || 'MEDIUM'
    });
    editModal.open(goal);
    viewModal.close(); // Close details modal
  };

  const handleDeleteGoal = (goal: Goal) => {
    deleteModal.open(goal);
    viewModal.close(); // Close details modal
  };

  const handleEditSubmit = async (goalData: NewGoal) => {
    if (!editModal.data?.id || !session?.user) return;
    const editGoal = editModal.data;
    try {
      const response = await fetch(`/api/goals/${editGoal.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          title: goalData.title.trim(),
          description: goalData.description.trim(),
          category: goalData.category,
          dueDate: goalData.dueDate,
          department: goalData.department,
          priority: goalData.priority,
          employeeId: session.user.id // Add the employee ID
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update goal');
      }

      const { goal } = await response.json();
      
      // Update the goals list optimistically - no need to refetch
      // Merge with existing goal to preserve any computed properties
      setGoals(prevGoals => {
        const goalExists = prevGoals.some(g => g.id === editGoal.id);
        if (!goalExists) {
          // If goal doesn't exist in list, add it (shouldn't happen, but safety check)
          return [...prevGoals, goal];
        }
        return prevGoals.map(g => {
          if (g.id === editGoal.id) {
            // Merge updated goal with existing goal to preserve all properties
            return {
              ...g,
              ...goal,
              // Ensure dates are properly formatted
              dueDate: goal.dueDate || g.dueDate,
              createdAt: goal.createdAt || g.createdAt,
              updatedAt: goal.updatedAt || g.updatedAt
            };
          }
          return g;
        });
      });
      
      editModal.close();
      toast.success('Goal updated successfully');
    } catch (error) {
      showNotificationWithTimeout(
        error instanceof Error ? error.message : 'Failed to update goal',
        'error'
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.data?.id || !session?.user) return;
    const deleteGoal = deleteModal.data;
    try {
      const response = await fetch(`/api/goals/${deleteGoal.id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete goal');
      }

      const { goal } = await response.json();
      
      // Update the goals list optimistically
      const updatedGoals = goals.filter(g => g.id !== deleteGoal.id);
      setGoals(updatedGoals);

      deleteModal.close();
      fetchGoals(); // Refresh to get the latest data
      toast.success('Goal deleted successfully');
    } catch (error) {
      showNotificationWithTimeout(
        error instanceof Error ? error.message : 'Failed to delete goal',
        'error'
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGoals();
    setRefreshing(false);
  };

  const handleClearFilters = () => {
    setSelectedStatus('all');
    setSelectedCategory('all');
    setSelectedPriority('');
    setPage(1);
  };

  return (
    <DashboardLayout type="employee">
      {isLoading ? <LoadingSkeleton variant="page" /> : error ? <ErrorState message={error} onRetry={() => { setError(null); fetchGoals(); }} /> :
      <div className="max-w-7xl mx-auto space-y-6">
          <PageHeader
            title="My Goals"
            description="Create and manage your goals"
          >
            <button
              onClick={() => createModal.open()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-[rgb(var(--color-text-inverse))] text-sm font-semibold hover:opacity-90 transition-all focus-ring"
            >
              <BsPlus className="w-4 h-4" />
              Create Goal
            </button>
          </PageHeader>

          {/* Stats Section */}
          <div>
            {(() => {
              // Single-pass count instead of 3 separate .filter() calls
              const sc: Record<string, number> = {};
              for (const g of goals) sc[g.status] = (sc[g.status] || 0) + 1;
              const totalGoals = goals.length;
              const approvedCount = sc['APPROVED'] || 0;
              const draftCount = sc['DRAFT'] || 0;
              const rejectedCount = sc['REJECTED'] || 0;
              
              const statItems: StatItem[] = [
                {
                  title: 'Total Goals',
                  value: totalGoals,
                  icon: <BsClipboardData className="w-4 h-4" />,
                },
                {
                  title: 'Draft',
                  value: draftCount,
                  icon: <BsPencil className="w-4 h-4" />,
                  onClick: () => setSelectedStatus('DRAFT')
                },
                {
                  title: 'Approved',
                  value: approvedCount,
                  icon: <BsCheckCircle className="w-4 h-4" />,
                  onClick: () => setSelectedStatus('APPROVED')
                },
                {
                  title: 'Rejected',
                  value: rejectedCount,
                  icon: <BsXCircle className="w-4 h-4" />,
                  onClick: () => setSelectedStatus('REJECTED')
                }
              ];
              return <StatsSection stats={statItems} />;
            })()}
          </div>

          {/* View Templates Button */}
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full bg-surface-elevated rounded-2xl p-4 shadow-theme-sm border border-theme hover:shadow-theme-lg hover:border-[rgba(var(--color-accent),0.2)] transition-all duration-300 text-primary font-semibold flex items-center justify-center gap-2 focus-ring"
          >
            {showTemplates ? 'Hide Templates' : 'Create Goals Using Templates'}
            <BsArrowUpRight className={`transform transition-transform duration-300 ${showTemplates ? 'rotate-180' : ''}`} />
          </button>

          {/* Goal Templates */}
          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <GoalTemplates onSelect={(template) => {
                  setFormData({
                    title: template.title,
                    description: template.description,
                    dueDate: new Date().toISOString().split('T')[0],
                    employeeId: session?.user?.id || '',
                    category: template.category,
                    department: 'ENGINEERING',
                    priority: 'MEDIUM'
                  });
                  createModal.open();
                }} />
              </motion.div>
            )}
          </AnimatePresence>

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
                  label: 'Create Goal',
                  onClick: () => createModal.open(),
                  variant: 'primary',
                },
              ]}
              hasActiveFilters={selectedStatus !== 'all' || selectedCategory !== 'all' || selectedPriority !== ''}
              onClearFilters={() => {
                handleClearFilters();
                setSearchQuery('');
              }}
            >
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
            </PageToolbar>

          {/* Goals List */}
            <GoalsList
              goals={goals}
              selectedStatus={selectedStatus}
              selectedCategory={selectedCategory}
              selectedPriority={selectedPriority}
              setSelectedStatus={(status) => {
                setSelectedStatus(status);
                setPage(1); // Reset to first page on filter change
              }}
              setSelectedCategory={(category) => {
                setSelectedCategory(category);
                setPage(1); // Reset to first page on filter change
              }}
              onViewGoal={(goal) => viewModal.open(goal)}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              pagination={pagination}
              onPageChange={(newPage) => {
                setPage(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
              onPriorityUpdate={(goalId, newPriority, updatedGoal) => {
                setGoals(prevGoals =>
                  prevGoals.map(goal => {
                    if (goal.id === goalId) {
                      // Only update priority, preserve all other fields including status
                      return { 
                        ...goal, 
                        priority: updatedGoal.priority || goal.priority,
                        updatedAt: updatedGoal.updatedAt || goal.updatedAt
                      };
                    }
                    return goal;
                  })
                );
              }}
            />
      </div>}

      {/* Modals */}
      <GoalFormModal
        isOpen={createModal.isOpen}
        onClose={() => {
          createModal.close();
          setFormData({
            title: '',
            description: '',
            dueDate: new Date().toISOString().split('T')[0],
            employeeId: session?.user?.id || '',
            category: 'PROFESSIONAL',
            department: 'ENGINEERING',
            priority: 'MEDIUM'
          });
        }}
        onSubmit={async (e) => {
          e.preventDefault();
          await handleSubmit({
            title: formData.title,
            description: formData.description,
            category: formData.category,
            dueDate: formData.dueDate,
            department: formData.department,
            priority: formData.priority
          });
        }}
        assignedEmployees={session?.user ? [{
          id: session.user.id,
          name: session.user.name || '',
          email: session.user.email || '',
          role: session.user.role,
          department: 'ENGINEERING',
          position: '',
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        }] : []}
        loading={false}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        errors={formErrors}
        isEditMode={false}
        context={context}
        onContextChange={(value) => setContext(value)}
        onReset={() => {
          setFormData({
            title: '',
            description: '',
            dueDate: new Date().toISOString().split('T')[0],
            employeeId: session?.user?.id || '',
            category: 'PROFESSIONAL',
            department: 'ENGINEERING',
            priority: 'MEDIUM'
          });
          setContext('');
        }}
      />

      {viewModal.data && (
        <GoalDetailModal
          goal={viewModal.data}
          onClose={() => viewModal.close()}
          onEdit={handleEditGoal}
          onDelete={handleDeleteGoal}
        />
      )}

      <GoalFormModal
        isOpen={editModal.isOpen}
        onClose={() => {
          editModal.close();
          setFormData({
            title: '',
            description: '',
            dueDate: new Date().toISOString().split('T')[0],
            employeeId: session?.user?.id || '',
            category: 'PROFESSIONAL',
            department: 'ENGINEERING',
            priority: 'MEDIUM'
          });
        }}
        onSubmit={async (e) => {
          e.preventDefault();
          await handleEditSubmit({
            title: formData.title,
            description: formData.description,
            category: formData.category,
            dueDate: formData.dueDate,
            department: formData.department,
            priority: formData.priority
          });
        }}
        assignedEmployees={session?.user ? [{
          id: session.user.id,
          name: session.user.name || '',
          email: session.user.email || '',
          role: session.user.role,
          department: 'ENGINEERING',
          position: '',
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        }] : []}
        loading={false}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        errors={formErrors}
        isEditMode={true}
        context={context}
        onContextChange={(value) => setContext(value)}
        onReset={() => {
          setFormData({
            title: '',
            description: '',
            dueDate: new Date().toISOString().split('T')[0],
            employeeId: session?.user?.id || '',
            category: 'PROFESSIONAL',
            department: 'ENGINEERING',
            priority: 'MEDIUM'
          });
          setContext('');
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          deleteModal.close();
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Goal"
        message="Are you sure you want to delete this goal? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </DashboardLayout>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="page" />}>
      <GoalsPageContent />
    </Suspense>
  );
}
