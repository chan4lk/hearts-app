'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import StatsSection from './components/StatsSection';
import GoalsSection from './components/GoalsSection';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import { GoalFormModal } from '@/app/components/shared/GoalFormModal';
import { DeleteConfirmationModal } from '@/app/components/shared/DeleteConfirmationModal';
import { Goal, GoalStats } from '@/app/components/shared/types';
import { BsStars, BsLightbulb, BsX, BsPlus } from 'react-icons/bs';
import { showToast } from '@/app/utils/toast';
import LoadingComponent from '@/app/components/LoadingScreen';
import { useSession } from 'next-auth/react';
import AIGoalSuggestions from '@/app/components/ai/AIGoalSuggestions';
import AIPerformanceInsights from '@/app/components/ai/AIPerformanceInsights';


export default function EmployeeDashboard() {
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
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

  // Update employeeId when session loads
  useEffect(() => {
    if (session?.user?.id) {
      setFormData(prev => ({ ...prev, employeeId: session.user.id }));
    }
  }, [session?.user?.id]);

  // Redirect if not employee or manager
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !['EMPLOYEE', 'MANAGER', 'ADMIN'].includes(session.user.role)) {
      window.location.href = '/login';
    }
  }, [session, status]);

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
    setShowAIGoalSuggestions(false);
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
  const fetchGoals = async () => {
    const response = await fetch('/api/goals?view=my-goals');

    if (!response.ok) {
      throw new Error('Failed to fetch goals');
    }

    const data = await response.json();
    return data.goals || [];
  };

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

      showToast.success('Goal Created!', 'Your new goal has been created successfully');
      setShowCreateGoalModal(false);
      resetForm();

      // Refresh goals
      const refreshedGoals = await fetchGoals();
      setGoals(refreshedGoals);
    } catch (error) {
      showToast.error('Error', error instanceof Error ? error.message : 'Failed to create goal');
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

      showToast.success('Goal Updated!', 'Your goal has been updated successfully');
      setShowEditGoalModal(false);
      setEditingGoal(null);
      resetForm();
    } catch (error) {
      showToast.error('Error', error instanceof Error ? error.message : 'Failed to update goal');
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

      showToast.success('Goal Deleted!', 'Your goal has been deleted successfully');
      setShowDetailModal(false);
      setSelectedGoal(null);
      setGoalToDelete(null);

      // Refresh goals
      const refreshedGoals = await fetchGoals();
      setGoals(refreshedGoals);
    } catch (error) {
      showToast.error('Error', error instanceof Error ? error.message : 'Failed to delete goal');
    }
  };

  // Load goals from the database
  useEffect(() => {
    const loadGoals = async () => {
      try {
        const goals = await fetchGoals();
        setGoals(goals);
      } catch (error) {
        showToast.error('Goals Loading Error', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      loadGoals();
    }
  }, [session?.user?.id]);

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || goal.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getGoalStats = (): GoalStats => {
    const totalGoals = goals.length;
    const total = totalGoals;
    const completedGoals = goals.filter(g => g.status === 'COMPLETED').length;
    const completed = completedGoals;
    const modified = goals.filter(g => g.status === 'MODIFIED').length;
    const pendingGoals = goals.filter(g => g.status === 'PENDING').length;
    const pending = pendingGoals;
    const approved = goals.filter(g => g.status === 'APPROVED').length;
    const rejected = goals.filter(g => g.status === 'REJECTED').length;
    const draftGoals = goals.filter(g => g.status === 'DRAFT').length;
    const inProgressGoals = goals.filter(g => ['PENDING', 'MODIFIED'].includes(g.status)).length;
    const approvedGoals = approved;
    const rejectedGoals = rejected;
    const achievementScore = totalGoals > 0 ? Math.round(((completedGoals + approved) / totalGoals) * 100) : 0;

    // Calculate category stats
    const categoryStats: { [key: string]: number } = {};
    goals.forEach(goal => {
      if (goal.category) {
        categoryStats[goal.category] = (categoryStats[goal.category] || 0) + 1;
      }
    });

    // For employee dashboard, these values are not relevant but required by the interface
    const totalEmployees = 0;
    const totalManagers = 0;
    
    return {
      totalGoals,
      total,
      completedGoals,
      completed,
      modified,
      pendingGoals,
      pending,
      approved,
      rejected,
      achievementScore,
      inProgressGoals,
      totalEmployees,
      totalManagers,
      approvedGoals,
      rejectedGoals,
      draftGoals,
      categoryStats
    };
  };

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
      showToast.goal.updated();
    } catch (error) {
      showToast.goal.error(error instanceof Error ? error.message : 'Failed to submit goal');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Optional: Show toast for no results after a delay
    if (value && !filteredGoals.length) {
      setTimeout(() => {
        if (!filteredGoals.length) {
          showToast.error('Search Results', 'No goals found matching your search criteria');
        }
      }, 500);
    }
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    // Optional: Show toast for no results after filter
    if (value && !filteredGoals.length) {
      showToast.error('Filter Results', 'No goals found with the selected status');
    }
  };

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <DashboardLayout type="employee">
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Subtle Background Pattern */}
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-3 space-y-4">
      
          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <StatsSection stats={getGoalStats()} goals={goals} />
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
              className="bg-gradient-to-br from-green-900/30 via-emerald-900/30 to-teal-900/30 backdrop-blur-sm rounded-xl p-6 border border-green-500/30 hover:border-green-500/50 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                  <BsPlus className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">Create New Goal</h3>
                  <p className="text-sm text-gray-400">Set a new personal or professional goal</p>
                </div>
              </div>
            </motion.button>

            {/* AI Goal Suggestions Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAIGoalSuggestions(true)}
              className="bg-gradient-to-br from-purple-900/30 via-indigo-900/30 to-blue-900/30 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                  <BsStars className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">AI Goal Suggestions</h3>
                  <p className="text-sm text-gray-400">Get AI-powered goal recommendations</p>
                </div>
              </div>
            </motion.button>

            {/* AI Performance Insights Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAIInsights(true)}
              className="bg-gradient-to-br from-blue-900/30 via-indigo-900/30 to-purple-900/30 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 hover:border-blue-500/50 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                  <BsLightbulb className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">Performance Insights</h3>
                  <p className="text-sm text-gray-400">AI-powered analysis of your performance trends and recommendations</p>
                </div>
              </div>
            </motion.button>
          </motion.div>

          {/* AI Goal Suggestions - Component has its own modal */}
          {showAIGoalSuggestions && (
            <AIGoalSuggestions
              onSelectGoal={() => {
                setShowAIGoalSuggestions(false);
              }}
              onUseGoal={handleAIGoalSelect}
            />
          )}

          {/* AI Performance Insights Modal */}
          <AnimatePresence>
            {showAIInsights && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setShowAIInsights(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-blue-500/30"
                >
                  <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-blue-500/30 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <BsLightbulb className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">AI Performance Insights</h3>
                        <p className="text-sm text-gray-400">Data-driven analysis of your performance</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAIInsights(false)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <BsX className="w-6 h-6 text-gray-400 hover:text-white" />
                    </button>
                  </div>
                  <div className="p-6">
                    <AIPerformanceInsights autoLoad={true} />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Goals Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
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
                    goal.id === goalId ? { ...goal, status: updatedGoal.status } : goal
                  )
                );
              }}
              userRole={session?.user?.role}
            />
          </motion.div>

          {/* Goal Detail Modal */}
          <AnimatePresence>
            {showDetailModal && selectedGoal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-2xl border border-white/10"
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
        </div>
      </div>
    </DashboardLayout>
  );
}