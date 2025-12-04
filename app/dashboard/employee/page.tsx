'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeroSection from './components/HeroSection';
import StatsSection from './components/StatsSection';
import Filters from './components/Filters';
import GoalsSection from './components/GoalsSection';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import { GoalFormModal } from '@/app/components/shared/GoalFormModal';
import { DeleteConfirmationModal } from '@/app/components/shared/DeleteConfirmationModal';
import { Goal, GoalStats } from '@/app/components/shared/types';
import { BsStars, BsLightbulb, BsX, BsPlus, BsPersonCheck, BsStarFill, BsStar, BsArrowRight } from 'react-icons/bs';
import { showToast } from '@/app/utils/toast';
import { RATING_LABELS } from '@/app/components/shared/constants';
import LoadingComponent from '@/app/components/LoadingScreen';
import { useSession } from 'next-auth/react';
import AIGoalSuggestions from '@/app/components/ai/AIGoalSuggestions';
import AIPerformanceInsights from '@/app/components/ai/AIPerformanceInsights';


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
    const matchesPriority = !selectedPriority || goal.priority === selectedPriority;
    return matchesSearch && matchesStatus && matchesPriority;
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
          {/* Hero Section */}
          <HeroSection />

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <StatsSection 
              stats={getGoalStats()} 
              goals={goals}
              onViewManagerRatings={() => setShowManagerRatingsModal(true)}
            />
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
             {/* Filters Section */}
             <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Filters
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedPriority={selectedPriority}
              onPriorityChange={setSelectedPriority}
            />
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
                  className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border-2 border-amber-500/40 flex flex-col"
                >
                  {/* Compact Header - Sticky */}
                  <div className="sticky top-0 z-10 bg-gradient-to-r from-amber-900/40 via-amber-800/40 to-orange-900/40 backdrop-blur-md border-b-2 border-amber-500/50 px-4 py-3 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-lg">
                        <BsPersonCheck className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Manager Ratings</h3>
                        <p className="text-[11px] text-amber-200/80">Feedback on your performance</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowManagerRatingsModal(false)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      aria-label="Close"
                    >
                      <BsX className="w-5 h-5 text-gray-300 hover:text-white" />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="overflow-y-auto flex-1 p-4">
                    {(() => {
                      const ratedGoals = goals.filter(goal => goal.rating?.managerScore);
                      
                      if (ratedGoals.length === 0) {
                        return (
                          <div className="text-center py-16">
                            <div className="mb-4 inline-flex p-4 bg-amber-500/10 rounded-full">
                              <BsPersonCheck className="w-12 h-12 text-amber-400/50" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Manager Ratings Yet</h3>
                            <p className="text-sm text-gray-400">Your manager hasn't rated any goals yet.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {ratedGoals.map((goal, index) => {
                            const rating = goal.rating?.managerScore || 0;
                            const ratingColors = {
                              1: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: 'from-red-500 to-red-600' },
                              2: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', icon: 'from-orange-500 to-orange-600' },
                              3: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', icon: 'from-yellow-500 to-yellow-600' },
                              4: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: 'from-blue-500 to-blue-600' },
                              5: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', icon: 'from-green-500 to-green-600' }
                            };
                            const ratingStyle = ratingColors[rating as keyof typeof ratingColors] || { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', icon: 'from-gray-500 to-gray-600' };
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
                                className="group relative bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border-2 border-gray-700/50 hover:border-amber-500/60 transition-all cursor-pointer hover:shadow-lg hover:shadow-amber-500/10"
                              >
                                {/* Rating Badge */}
                                <div className="absolute top-3 right-3">
                                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${ratingStyle.bg} border ${ratingStyle.border} backdrop-blur-sm`}>
                                    <div className={`p-1 rounded bg-gradient-to-r ${ratingStyle.icon}`}>
                                      <BsStarFill className="w-3 h-3 text-white" />
                                    </div>
                                    <span className={`text-sm font-bold ${ratingStyle.text}`}>{rating}/5</span>
                                  </div>
                                </div>

                                <div className="pr-20">
                                  {/* Goal Title */}
                                  <h4 className="text-base font-bold text-white mb-2 group-hover:text-amber-300 transition-colors line-clamp-1">
                                    {goal.title}
                                  </h4>
                                  
                                  {/* Description */}
                                  {goal.description && (
                                    <p className="text-sm text-gray-400 line-clamp-2 mb-3 group-hover:text-gray-300 transition-colors">
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
                                      <span className="text-xs text-gray-500">
                                        {new Date(goal.rating.managerRatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                    )}
                                  </div>

                                  {/* Manager Comments */}
                                  {goal.rating?.managerComments && (
                                    <div className="mt-3 p-3 bg-black/30 rounded-lg border border-amber-500/20">
                                      <div className="flex items-start gap-2">
                                        <div className="p-1 bg-amber-500/20 rounded flex-shrink-0 mt-0.5">
                                          <BsPersonCheck className="w-3 h-3 text-amber-400" />
                                        </div>
                                        <p className="text-sm text-gray-300 italic flex-1">
                                          "{goal.rating.managerComments}"
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Click Indicator */}
                                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-400/70 group-hover:text-amber-400 transition-colors">
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
      </div>
    </DashboardLayout>
  );
}