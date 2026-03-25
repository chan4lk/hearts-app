'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { PageContainer } from '@/app/components/shared/PageContainer';
import { BsPlus, BsArrowUpRight, BsStars } from 'react-icons/bs';
import GoalTemplates from '@/app/components/shared/GoalTemplates';

import { GoalsList } from './components/GoalsList';
import StatsSection, { StatItem } from '@/app/components/shared/StatsSection';
import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';

import { BsClipboardData, BsCheckCircle, BsPencil, BsXCircle } from 'react-icons/bs';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import { DeleteConfirmationModal } from '@/app/components/shared/DeleteConfirmationModal';
import { Goal, NewGoal } from '@/app/components/shared/types';
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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [selectedViewGoal, setSelectedViewGoal] = useState<Goal | null>(null);
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
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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
    } catch (error) {
      showNotificationWithTimeout('Failed to load goals', 'error');
    }
  };

  const showNotificationWithTimeout = (message: string, type: 'success' | 'error') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
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

      setIsCreateModalOpen(false);
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
    } catch (error) {
      showNotificationWithTimeout(
        `Failed to create goal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      dueDate: goal.dueDate.split('T')[0],
      employeeId: goal.employeeId || session?.user?.id || '',
      category: goal.category,
      department: goal.department || 'ENGINEERING',
      priority: goal.priority || 'MEDIUM'
    });
    setIsEditModalOpen(true);
    setSelectedViewGoal(null); // Close details modal
  };

  const handleDeleteGoal = (goal: Goal) => {
    setDeleteGoal(goal);
    setIsDeleteModalOpen(true);
    setSelectedViewGoal(null); // Close details modal
  };

  const handleEditSubmit = async (goalData: NewGoal) => {
    if (!editGoal?.id || !session?.user) return;
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
      
      setIsEditModalOpen(false);
      setEditGoal(null);
    } catch (error) {
      showNotificationWithTimeout(
        error instanceof Error ? error.message : 'Failed to update goal',
        'error'
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteGoal?.id || !session?.user) return;
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
      
      setIsDeleteModalOpen(false);
      setDeleteGoal(null);
      fetchGoals(); // Refresh to get the latest data
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
      <div className="relative max-w-7xl mx-auto space-y-6">
          {/* Floating Background Decorations */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-[rgb(var(--color-cat-technical))]/[0.03] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-32 -left-12 w-48 h-48 bg-[rgb(var(--color-success))]/[0.03] rounded-full blur-3xl pointer-events-none" />

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[rgb(var(--color-cat-technical))]/10 via-[rgb(var(--color-accent))]/5 to-[rgb(var(--color-success))]/10 border border-[rgba(var(--color-cat-technical),0.15)] p-6 md:p-8"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[rgb(var(--color-cat-technical))] via-[rgb(var(--color-accent))] to-[rgb(var(--color-success))]" />
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-[rgb(var(--color-cat-technical))]/[0.05] rounded-full blur-2xl" />
            <div className="relative flex items-center gap-4">
              <div className="p-3 bg-[rgb(var(--color-cat-technical))]/10 rounded-xl">
                <BsClipboardData className="w-6 h-6 text-[rgb(var(--color-cat-technical))]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[rgb(var(--color-cat-technical))] to-[rgb(var(--color-accent))] bg-clip-text text-transparent">
                  My Goals
                </h1>
                <p className="text-sm text-secondary mt-1">Manage, create, and track all your professional and personal goals.</p>
              </div>
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
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
          </motion.div>

          {/* Notification Toast */}
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-4 rounded-xl shadow-theme-lg flex items-center gap-3 max-w-[90%] md:max-w-md backdrop-blur-xl border border-white/20 ${
                notificationType === 'success' ? 'bg-[rgb(var(--color-cat-training))]/90' : 'bg-[rgb(var(--color-error))]/90'
              } text-[rgb(var(--color-text-inverse))]`}
            >
              <span className="text-sm md:text-base font-medium">{notificationMessage}</span>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* View Templates Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowTemplates(!showTemplates)}
              className="relative overflow-hidden bg-surface-elevated border border-theme hover:border-[rgba(var(--color-cat-technical),0.2)] hover:shadow-theme-lg rounded-2xl p-6 transition-all duration-300 text-left group"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[rgb(var(--color-cat-technical))] to-[rgb(var(--color-accent))]" />
              <div className="flex items-start gap-4">
                <div className="p-3 bg-cat-technical rounded-xl group-hover:scale-110 transition-all duration-300">
                  <BsStars className="w-6 h-6 text-cat-technical" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-primary mb-1">
                    {showTemplates ? 'Hide Templates' : 'View Templates'}
                  </h3>
                  <p className="text-sm text-secondary">Browse goal templates to get started quickly</p>
                </div>
                <BsArrowUpRight className={`w-5 h-5 text-cat-technical transform transition-transform duration-300 ${showTemplates ? 'rotate-180' : ''}`} />
              </div>
            </motion.button>

            {/* Create Goal Button */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="relative overflow-hidden bg-surface-elevated border border-theme hover:border-[rgba(var(--color-success),0.2)] hover:shadow-theme-lg rounded-2xl p-6 transition-all duration-300 text-left group"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[rgb(var(--color-success))] to-[rgb(var(--color-cat-training))]" />
              <div className="absolute -bottom-6 -right-6 text-5xl font-black text-primary/[0.02] select-none">+</div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-cat-training rounded-xl group-hover:scale-110 transition-all duration-300">
                  <BsPlus className="w-6 h-6 text-cat-training" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-primary mb-1">Create New Goal</h3>
                  <p className="text-sm text-secondary">Set a new personal or professional goal</p>
                </div>
              </div>
            </motion.button>
          </motion.div>

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
                  setIsCreateModalOpen(true);
                }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toolbar + Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
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
                  onClick: () => setIsCreateModalOpen(true),
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
          </motion.div>

          {/* Goals List */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
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
              onViewGoal={setSelectedViewGoal}
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
          </motion.div>
      </div>

      {/* Modals */}
      <GoalFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
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

      {selectedViewGoal && (
        <GoalDetailModal
          goal={selectedViewGoal}
          onClose={() => setSelectedViewGoal(null)}
          onEdit={handleEditGoal}
          onDelete={handleDeleteGoal}
        />
      )}

      <GoalFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditGoal(null);
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
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteGoal(null);
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
    <Suspense>
      <GoalsPageContent />
    </Suspense>
  );
}
