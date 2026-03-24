'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';

import StatsSection, { StatItem } from '@/app/components/shared/StatsSection';
import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';

import { BsClipboardData, BsCheckCircle, BsPencil, BsXCircle } from 'react-icons/bs';
import GoalsSection from './components/GoalsSection';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import { GoalFormModal } from '@/app/components/shared/GoalFormModal';
import { DeleteConfirmationModal } from '@/app/components/shared/DeleteConfirmationModal';
import { Pagination } from '@/app/components/shared/Pagination';
import { Goal, GoalStats } from '@/app/components/shared/types';
import { BsStars, BsLightbulb, BsX, BsPlus, BsPersonCheck, BsStarFill, BsStar, BsArrowRight } from 'react-icons/bs';
import { RATING_LABELS } from '@/app/components/shared/constants';
import { useSession } from 'next-auth/react';
import AIGoalSuggestions from '@/app/components/ai/AIGoalSuggestions';
import AIPerformanceInsights from '@/app/components/ai/AIPerformanceInsights';
import { ModalShell } from '@/app/components/ui/form-primitives';


export default function EmployeeDashboard() {
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAIGoalSuggestions, setShowAIGoalSuggestions] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  const [showEditGoalModal, setShowEditGoalModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [showManagerRatingsModal, setShowManagerRatingsModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    employeeId: session?.user?.id || '',
    category: 'PROFESSIONAL',
    department: 'ENGINEERING',
    priority: 'MEDIUM'
  });
  const [errors, setErrors] = useState<{ title?: string; category?: string; employeeId?: string; department?: string; priority?: string }>({});
  
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

  // Update employeeId when session loads
  useEffect(() => {
    if (session?.user?.id) {
      setFormData(prev => ({ ...prev, employeeId: session.user.id }));
    }
  }, [session?.user?.id]);

  // Auth is handled by middleware — just guard render
  if (status !== 'loading' && (!session || !['EMPLOYEE', 'MANAGER', 'ADMIN'].includes(session.user.role))) {
    return null;
  }

  // Helper function to map AI category to system category
  const mapCategory = (category?: string): string => {
    const categoryMap: Record<string, string> = {
      'Career Development': 'PROFESSIONAL',
      'Department Objectives': 'PROFESSIONAL',
      'Technical': 'TECHNICAL',
      'Leadership': 'LEADERSHIP',
      'Personal': 'PERSONAL',
      'Training': 'TRAINING',
      'KPI': 'KPI'
    };
    return categoryMap[category || ''] || 'PROFESSIONAL';
  };

  // Helper function to calculate target date from duration
  const calculateTargetDate = (duration?: string): string => {
    if (!duration) return new Date().toISOString().split('T')[0];

    const today = new Date();
    const months = parseInt(duration.match(/(\d+)/)?.[0] || '3');
    today.setMonth(today.getMonth() + months);

    return today.toISOString().split('T')[0];
  };

  // Handle form data change
  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle AI goal selection
  const handleAIGoalSelect = (goal: any) => {
    setFormData({
      title: goal.title || '',
      description: goal.description || '',
      dueDate: calculateTargetDate(goal.estimatedDuration),
      employeeId: session?.user?.id || '',
      category: mapCategory(goal.category),
      department: formData.department,
      priority: goal.priority?.toUpperCase() || 'MEDIUM'
    });
    setShowCreateGoalModal(true);
    // Keep AI suggestions modal open so user can select multiple goals
    // setShowAIGoalSuggestions(false);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      employeeId: session?.user?.id || '',
      category: 'PROFESSIONAL',
      department: 'ENGINEERING',
      priority: 'MEDIUM'
    });
    setErrors({});
  };

  // Fetch goals from the unified API
  const fetchGoals = useCallback(async () => {
    const params = new URLSearchParams({
      view: 'my-goals',
      page: page.toString(),
      limit: limit.toString(),
      sortBy: 'createdAt',
      sortOrder: 'desc',
      ...(selectedStatus && selectedStatus !== '' && { status: selectedStatus }),
      ...(selectedPriority && { priority: selectedPriority }),
      ...(searchQuery && { search: searchQuery })
    });

    const response = await fetch(`/api/goals?${params}`, { credentials: 'include' });

    if (!response.ok) {
      setGoals([]);
      setPagination(null);
      return [];
    }

    const data = await response.json();

    if (data.pagination) {
      setPagination(data.pagination);
    }

    return data.goals || [];
  }, [page, limit, selectedStatus, selectedPriority, searchQuery]);

  // Handle form submit
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: typeof errors = {};
    if (!formData.title.trim()) newErrors.title = 'Goal title is required';
    if (!formData.category) newErrors.category = 'Category is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setFormLoading(true);
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          department: formData.department,
          priority: formData.priority,
          dueDate: formData.dueDate,
          employeeId: session?.user?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create goal');
      }

      setShowCreateGoalModal(false);
      resetForm();

      // Refresh goals
      const refreshedGoals = await fetchGoals();
      setGoals(refreshedGoals);
    } catch (error) { // handled silently
      // Error toast removed
    } finally {
      setFormLoading(false);
    }
  };

  // Handle edit goal
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      dueDate: goal.dueDate ? new Date(goal.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      employeeId: goal.employee?.id || session?.user?.id || '',
      category: goal.category || 'PROFESSIONAL',
      department: goal.department || 'ENGINEERING',
      priority: goal.priority || 'MEDIUM'
    });
    setShowDetailModal(false);
    setShowEditGoalModal(true);
  };

  // Handle update goal
  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingGoal) return;

    // Validation
    const newErrors: typeof errors = {};
    if (!formData.title.trim()) newErrors.title = 'Goal title is required';
    if (!formData.category) newErrors.category = 'Category is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/goals/${editingGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          department: formData.department,
          priority: formData.priority,
          dueDate: formData.dueDate,
          employeeId: formData.employeeId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update goal');
      }

      const { goal: updatedGoal } = await response.json();

      // Update local state immediately (optimistic update)
      // Merge with existing goal to preserve any computed properties
      setGoals(prevGoals => {
        const goalExists = prevGoals.some(g => g.id === editingGoal.id);
        if (!goalExists) {
          // If goal doesn't exist in list, add it (shouldn't happen, but safety check)
          return [...prevGoals, updatedGoal];
        }
        return prevGoals.map(g => {
          if (g.id === editingGoal.id) {
            // Merge updated goal with existing goal to preserve all properties
            return {
              ...g,
              ...updatedGoal,
              // Ensure dates are properly formatted
              dueDate: updatedGoal.dueDate || g.dueDate,
              createdAt: updatedGoal.createdAt || g.createdAt,
              updatedAt: updatedGoal.updatedAt || g.updatedAt
            };
          }
          return g;
        });
      });

      setShowEditGoalModal(false);
      setEditingGoal(null);
      resetForm();
    } catch (error) { // handled silently
      // Error toast removed
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete goal - Show confirmation modal
  const handleDeleteGoal = (goal: Goal) => {
    setGoalToDelete(goal);
    setShowDeleteConfirmation(true);
  };

  // Confirm delete goal
  const confirmDeleteGoal = async () => {
    if (!goalToDelete) return;

    try {
      const response = await fetch(`/api/goals/${goalToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      setShowDetailModal(false);
      setSelectedGoal(null);
      setGoalToDelete(null);

      // Refresh goals
      const refreshedGoals = await fetchGoals();
      setGoals(refreshedGoals);
    } catch (error) { // handled silently
      // Error toast removed
    }
  };

  // Load goals from the database
  useEffect(() => {
    const loadGoals = async () => {
      try {
        setLoading(true);
        const goals = await fetchGoals();
        setGoals(goals);
      } catch (error) { // handled silently
        // Error toast removed
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      loadGoals();
    }
  }, [session?.user?.id, page, limit, selectedStatus, selectedPriority, searchQuery]);

  // Server-side filtering is handled by API, but we keep client-side filtering for view switching
  const filteredGoals = goals;

  // Memoize goal stats to avoid recalculating on every render
  const getGoalStats = useMemo((): GoalStats => {
    const statusCounts: Record<string, number> = {};
    const categoryStats: Record<string, number> = {};
    for (const g of goals) {
      statusCounts[g.status] = (statusCounts[g.status] || 0) + 1;
      if (g.category) categoryStats[g.category] = (categoryStats[g.category] || 0) + 1;
    }

    const totalGoals = goals.length;
    const completedGoals = statusCounts['COMPLETED'] || 0;
    const approved = statusCounts['APPROVED'] || 0;

    return {
      totalGoals,
      total: totalGoals,
      completedGoals,
      completed: completedGoals,
      modified: statusCounts['MODIFIED'] || 0,
      pendingGoals: statusCounts['PENDING'] || 0,
      pending: statusCounts['PENDING'] || 0,
      approved,
      rejected: statusCounts['REJECTED'] || 0,
      achievementScore: totalGoals > 0 ? Math.round(((completedGoals + approved) / totalGoals) * 100) : 0,
      inProgressGoals: (statusCounts['PENDING'] || 0) + (statusCounts['MODIFIED'] || 0),
      totalEmployees: 0,
      totalManagers: 0,
      approvedGoals: approved,
      rejectedGoals: statusCounts['REJECTED'] || 0,
      draftGoals: statusCounts['DRAFT'] || 0,
      categoryStats
    };
  }, [goals]);

  const handleSubmitGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'PENDING' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit goal');
      }

      // Refresh goals
      const refreshedGoals = await fetchGoals();
      setGoals(refreshedGoals);
      setShowDetailModal(false);
      // Toast removed
    } catch (error) { // handled silently
      // Error toast removed
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1); // Reset to first page on search change
    // Optional: Show toast for no results after a delay
    if (value && !filteredGoals.length) {
      setTimeout(() => {
        if (!filteredGoals.length) {
          // Error toast removed
        }
      }, 500);
    }
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setPage(1); // Reset to first page on status change
    // Optional: Show toast for no results after filter
    if (value && !filteredGoals.length) {
      // Error toast removed
    }
  };


  return (
    <DashboardLayout type="employee">
      <div className="max-w-7xl mx-auto space-y-5">
          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {(() => {
              const goalStats = getGoalStats;
              const statItems: StatItem[] = [
                {
                  title: 'Total Goals',
                  value: goalStats.totalGoals,
                  icon: <BsClipboardData className="w-4 h-4" />,
                },
                {
                  title: 'Draft',
                  value: goalStats.draftGoals,
                  icon: <BsPencil className="w-4 h-4" />,
                  onClick: () => {
                    setSelectedStatus('DRAFT');
                    setPage(1);
                  }
                },
                {
                  title: 'Approved',
                  value: goalStats.approved,
                  icon: <BsCheckCircle className="w-4 h-4" />,
                  onClick: () => {
                    setSelectedStatus('APPROVED');
                    setPage(1);
                  }
                },
                {
                  title: 'Rejected',
                  value: goalStats.rejected,
                  icon: <BsXCircle className="w-4 h-4" />,
                  onClick: () => {
                    setSelectedStatus('REJECTED');
                    setPage(1);
                  }
                },
                {
                  title: 'Completed',
                  value: goalStats.completed,
                  icon: <BsCheckCircle className="w-4 h-4" />,
                  onClick: () => {
                    setSelectedStatus('COMPLETED');
                    setPage(1);
                  }
                }
              ];
              return <StatsSection stats={statItems} />;
            })()}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Create Goal Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                resetForm();
                setShowCreateGoalModal(true);
              }}
              className="bg-surface-elevated border border-theme hover:border-[rgba(var(--color-success),0.3)] hover:shadow-theme-sm rounded-xl p-6 transition-all text-left group focus-ring"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-success-muted rounded-lg group-hover:opacity-80 transition-colors">
                  <BsPlus className="w-6 h-6 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-primary mb-1">Create New Goal</h3>
                  <p className="text-sm text-secondary">Set a new personal or professional goal</p>
                </div>
              </div>
            </motion.button>

            {/* AI Goal Suggestions Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAIGoalSuggestions(true)}
              className="bg-surface-elevated border border-theme hover:border-[rgba(var(--color-accent),0.3)] hover:shadow-theme-sm rounded-xl p-6 transition-all text-left group focus-ring"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-accent-muted rounded-lg group-hover:opacity-80 transition-colors">
                  <BsStars className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-primary mb-1">AI Goal Suggestions</h3>
                  <p className="text-sm text-secondary">Get AI-powered goal recommendations</p>
                </div>
              </div>
            </motion.button>

            {/* AI Performance Insights Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAIInsights(true)}
              className="bg-surface-elevated border border-theme hover:border-[rgba(var(--color-info),0.3)] hover:shadow-theme-sm rounded-xl p-6 transition-all text-left group focus-ring"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-info-muted rounded-lg group-hover:opacity-80 transition-colors">
                  <BsLightbulb className="w-6 h-6 text-info" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-primary mb-1">Performance Insights</h3>
                  <p className="text-sm text-secondary">AI-powered analysis of your performance trends and recommendations</p>
                </div>
              </div>
            </motion.button>
          </motion.div>

          {/* AI Goal Suggestions - Component has its own modal */}
          {showAIGoalSuggestions && (
            <AIGoalSuggestions
              autoGenerate={true}
              showTriggerButton={false}
              onSelectGoal={() => {
                // Close the modal when user manually closes it (X button or click outside)
                setShowAIGoalSuggestions(false);
              }}
              onUseGoal={handleAIGoalSelect}
            />
          )}

          {/* AI Performance Insights Modal */}
          <ModalShell
            open={showAIInsights}
            onClose={() => setShowAIInsights(false)}
            title="AI Performance Insights"
            icon={<BsLightbulb className="w-4 h-4" />}
            maxWidth="max-w-4xl"
          >
            <AIPerformanceInsights autoLoad={true} />
          </ModalShell>
             {/* Toolbar + Filters */}
             <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PageToolbar
              searchValue={searchQuery}
              onSearchChange={handleSearchChange}
              searchPlaceholder="Search goals..."
              hasActiveFilters={selectedStatus !== '' || selectedPriority !== ''}
              onClearFilters={() => {
                setSelectedStatus('');
                setSelectedPriority('');
                setSearchQuery('');
                setPage(1);
              }}
            >
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
          </motion.div>


          {/* Goals Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GoalsSection
              goals={filteredGoals}
              searchQuery={searchQuery}
              selectedStatus={selectedStatus}
              onSearchChange={handleSearchChange}
              onStatusChange={handleStatusChange}
              onGoalClick={(goal) => {
                setSelectedGoal(goal);
                setShowDetailModal(true);
              }}
              onStatusUpdate={(goalId, newStatus, updatedGoal) => {
                setGoals(prevGoals =>
                  prevGoals.map(goal =>
                    goal.id === goalId ? { ...updatedGoal, status: updatedGoal.status } as Goal : goal
                  )
                );
              }}
              userRole={session?.user?.role}
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
          </motion.div>

          {/* Goal Detail Modal */}
          <AnimatePresence>
            {showDetailModal && selectedGoal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-surface-elevated backdrop-blur-sm rounded-xl shadow-theme-lg w-full max-w-2xl border border-theme"
                >
                  <GoalDetailModal
                    goal={selectedGoal}
                    onClose={() => {
                      setShowDetailModal(false);
                      setSelectedGoal(null);
                    }}
                    onSubmitGoal={handleSubmitGoal}
                    onEdit={handleEditGoal}
                    onDelete={handleDeleteGoal}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Create Goal Modal */}
          <GoalFormModal
            isOpen={showCreateGoalModal}
            onClose={() => {
              setShowCreateGoalModal(false);
              resetForm();
            }}
            onSubmit={handleCreateGoal}
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
            loading={formLoading}
            formData={formData}
            onFormDataChange={handleFormDataChange}
            errors={errors}
            isEditMode={false}
            context=""
            onContextChange={() => {}}
            onReset={resetForm}
          />

          {/* Edit Goal Modal */}
          <GoalFormModal
            isOpen={showEditGoalModal}
            onClose={() => {
              setShowEditGoalModal(false);
              setEditingGoal(null);
              resetForm();
            }}
            onSubmit={handleUpdateGoal}
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
            loading={formLoading}
            formData={formData}
            onFormDataChange={handleFormDataChange}
            errors={errors}
            isEditMode={true}
            context=""
            onContextChange={() => {}}
            onReset={resetForm}
          />

          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={showDeleteConfirmation}
            onClose={() => {
              setShowDeleteConfirmation(false);
              setGoalToDelete(null);
            }}
            onConfirm={confirmDeleteGoal}
            title="Delete Goal"
            message="Are you sure you want to delete this goal? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
          />

          {/* Manager Ratings Modal */}
          <AnimatePresence>
            {showManagerRatingsModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4"
                onClick={() => setShowManagerRatingsModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="modal-content rounded-xl shadow-theme-lg w-full max-w-4xl max-h-[85vh] overflow-hidden border-2 border-amber-500/40 flex flex-col"
                >
                  {/* Compact Header - Sticky */}
                  <div className="sticky top-0 z-10 bg-gradient-to-r from-amber-900/40 via-amber-800/40 to-orange-900/40 backdrop-blur-md border-b-2 border-amber-500/50 px-4 py-3 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                        <BsPersonCheck className="w-4 h-4 text-[rgb(var(--color-text-inverse))]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[rgb(var(--color-text-inverse))]">Manager Ratings</h3>
                        <p className="text-2xs text-warning">Feedback on your performance</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowManagerRatingsModal(false)}
                      className="p-1.5 hover:bg-surface-tertiary rounded-lg transition-colors"
                      aria-label="Close"
                    >
                      <BsX className="w-5 h-5 text-secondary hover:text-[rgb(var(--color-text-inverse))]" />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="overflow-y-auto flex-1 p-4">
                    {(() => {
                      const ratedGoals = goals.filter(goal => goal.rating?.managerScore);
                      
                      if (ratedGoals.length === 0) {
                        return (
                          <div className="text-center py-16">
                            <div className="mb-4 inline-flex p-4 bg-warning-muted rounded-full">
                              <BsPersonCheck className="w-12 h-12 text-warning/50" />
                            </div>
                            <h3 className="text-lg font-semibold text-secondary mb-2">No Manager Ratings Yet</h3>
                            <p className="text-sm text-secondary">Your manager hasn't rated any goals yet.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {ratedGoals.map((goal, index) => {
                            const rating = goal.rating?.managerScore || 0;
                            const ratingColors = {
                              1: { bg: 'bg-error-muted', text: 'text-error', border: 'border-[rgba(var(--color-error),0.2)]', icon: 'from-[rgb(var(--color-rating-1))] to-[rgb(var(--color-error))]' },
                              2: { bg: 'bg-rating-2', text: 'text-rating-2', border: 'border-[rgba(var(--color-rating-2),0.2)]', icon: 'from-[rgb(var(--color-rating-2))] to-[rgb(var(--color-rating-2))]' },
                              3: { bg: 'bg-rating-3', text: 'text-warning', border: 'border-[rgba(var(--color-rating-3),0.2)]', icon: 'from-[rgb(var(--color-rating-3))] to-[rgb(var(--color-rating-3))]' },
                              4: { bg: 'bg-cat-professional', text: 'text-cat-professional', border: 'border-[rgba(var(--color-info),0.2)]', icon: 'from-[rgb(var(--color-rating-4))] to-[rgb(var(--color-info))]' },
                              5: { bg: 'bg-cat-training', text: 'text-cat-training', border: 'border-[rgba(var(--color-success),0.2)]', icon: 'from-[rgb(var(--color-rating-5))] to-[rgb(var(--color-success))]' }
                            };
                            const ratingStyle = ratingColors[rating as keyof typeof ratingColors] || { bg: 'bg-surface-secondary', text: 'text-secondary', border: 'border-gray-500/20', icon: 'from-gray-500 to-gray-600' };
                            const ratingLabels = {
                              1: "Needs Improvement",
                              2: "Below Expectations",
                              3: "Meets Expectations",
                              4: "Exceeds Expectations",
                              5: "Outstanding"
                            };

                            return (
                              <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.01, y: -2 }}
                                onClick={() => {
                                  setSelectedGoal(goal);
                                  setShowDetailModal(true);
                                  // Keep manager ratings modal open - don't close it
                                  // setShowManagerRatingsModal(false);
                                }}
                                className="group relative bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border-2 border-theme hover:border-amber-500/60 transition-all cursor-pointer hover:shadow-lg hover:shadow-amber-500/10"
                              >
                                {/* Rating Badge */}
                                <div className="absolute top-3 right-3">
                                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${ratingStyle.bg} border ${ratingStyle.border} backdrop-blur-sm`}>
                                    <div className={`p-1 rounded bg-gradient-to-r ${ratingStyle.icon}`}>
                                      <BsStarFill className="w-3 h-3 text-[rgb(var(--color-text-inverse))]" />
                                    </div>
                                    <span className={`text-sm font-bold ${ratingStyle.text}`}>{rating}/5</span>
                                  </div>
                                </div>

                                <div className="pr-20">
                                  {/* Goal Title */}
                                  <h4 className="text-base font-bold text-[rgb(var(--color-text-inverse))] mb-2 group-hover:text-amber-300 transition-colors line-clamp-1">
                                    {goal.title}
                                  </h4>
                                  
                                  {/* Description */}
                                  {goal.description && (
                                    <p className="text-sm text-secondary line-clamp-2 mb-3 group-hover:text-secondary transition-colors">
                                      {goal.description}
                                    </p>
                                  )}

                                  {/* Rating Details */}
                                  <div className="flex items-center gap-3 flex-wrap mb-3">
                                    <div className={`px-2.5 py-1 rounded-md ${ratingStyle.bg} border ${ratingStyle.border}`}>
                                      <span className={`text-xs font-semibold ${ratingStyle.text}`}>
                                        {ratingLabels[rating as keyof typeof ratingLabels] || 'Not Rated'}
                                      </span>
                                    </div>
                                    {goal.rating?.managerRatedAt && (
                                      <span className="text-xs text-tertiary">
                                        {new Date(goal.rating.managerRatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                    )}
                                  </div>

                                  {/* Manager Comments */}
                                  {goal.rating?.managerComments && (
                                    <div className="mt-3 p-3 bg-black/30 rounded-lg border border-amber-500/20">
                                      <div className="flex items-start gap-2">
                                        <div className="p-1 bg-warning-muted rounded flex-shrink-0 mt-0.5">
                                          <BsPersonCheck className="w-3 h-3 text-warning" />
                                        </div>
                                        <p className="text-sm text-secondary italic flex-1">
                                          "{goal.rating.managerComments}"
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Click Indicator */}
                                  <div className="mt-3 flex items-center gap-2 text-xs text-warning group-hover:text-warning transition-colors">
                                    <span>View details</span>
                                    <BsArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
