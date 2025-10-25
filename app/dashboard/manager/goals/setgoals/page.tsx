'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { BsExclamationTriangle, BsArrowUpRight } from 'react-icons/bs';
import { Button } from '@/app/components/ui/button';
import { showToast } from '@/app/utils/toast';

// Layout
import DashboardLayout from '@/app/components/layout/DashboardLayout';

// Components
import { HeroSection } from './components/sections/HeroSection';
import { StatsSection } from './components/sections/StatsSection';
import { GoalList } from './components/sections/GoalList';
import { CreateGoalModal } from './components/modals/CreateGoalModal';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import { DeleteConfirmationModal } from '@/app/components/shared/DeleteConfirmationModal';
import GoalTemplates from '@/app/components/shared/GoalTemplates';
import { BulkGoalFormModal } from '@/app/components/shared/BulkGoalFormModal';
import { CATEGORIES } from '@/app/components/shared/constants';
import LoadingComponent from '@/app/components/LoadingScreen';

// Styles and Types
import { colors } from './components/styles/colors';
import { GoalFormData, GoalStats, User, Goal } from '@/app/components/shared/types';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <BsExclamationTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <Button onClick={resetErrorBoundary} variant="outline">
        Try again
      </Button>
    </div>
  );
}

function ManagerGoalSettingPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [assignedEmployees, setAssignedEmployees] = useState<User[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewedGoal, setViewedGoal] = useState<Goal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isBulkCreateModalOpen, setIsBulkCreateModalOpen] = useState(false);

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

  const fetchAssignedEmployees = async () => {
    try {
      const response = await fetch('/api/employees/assigned');
      if (!response.ok) throw new Error('Failed to fetch assigned employees');
      const data = await response.json();
      setAssignedEmployees(data.employees);
      fetchGoals(data.employees);
    } catch (error) {
      console.error('Error fetching assigned employees:', error);
      setError(error instanceof Error ? error : new Error('Failed to load assigned employees'));
      showToast.goal.error('Failed to load assigned employees');
    }
  };

  const fetchGoals = async (employees: User[]) => {
    try {
      const response = await fetch('/api/goals/managed');
      if (!response.ok) throw new Error('Failed to fetch goals');
      const data = await response.json();
      
      const assignedGoals = data.goals.filter((goal: Goal) => 
        goal.manager?.id === session?.user?.id && 
        goal.employee?.id !== session?.user?.id
      );
      
      setGoals(assignedGoals);
      updateStats(assignedGoals, employees);
    } catch (error) {
      console.error('Error fetching goals:', error);
      showToast.goal.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (goals: Goal[], employees: User[]) => {
    const filteredGoals = selectedEmployee === 'all' ? goals : goals.filter(goal => goal.employee?.id === selectedEmployee);
    
    setStats({
      totalEmployees: employees.length,
      totalGoals: filteredGoals.length,
      total: filteredGoals.length,
      completedGoals: filteredGoals.filter(g => g.status === 'COMPLETED').length,
      completed: filteredGoals.filter(g => g.status === 'COMPLETED').length,
      pendingGoals: filteredGoals.filter(g => g.status === 'PENDING').length,
      pending: filteredGoals.filter(g => g.status === 'PENDING').length,
      draftGoals: filteredGoals.filter(g => g.status === 'DRAFT').length,
      approvedGoals: filteredGoals.filter(g => g.status === 'APPROVED').length,
      approved: filteredGoals.filter(g => g.status === 'APPROVED').length,
      rejectedGoals: filteredGoals.filter(g => g.status === 'REJECTED').length,
      rejected: filteredGoals.filter(g => g.status === 'REJECTED').length,
      modified: filteredGoals.filter(g => g.status === 'MODIFIED').length,
      achievementScore: calculateAchievementScore(filteredGoals),
      inProgressGoals: filteredGoals.filter(g => g.status === 'PENDING' || g.status === 'MODIFIED').length,
      totalManagers: 0, // This would need to be set from a different API call if needed
      categoryStats: filteredGoals.reduce((acc, goal) => {
        acc[goal.category] = (acc[goal.category] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number })
    });
  };

  const calculateAchievementScore = (goals: Goal[]): number => {
    if (goals.length === 0) return 0;
    const completedGoals = goals.filter(g => g.status === 'COMPLETED').length;
    return Math.round((completedGoals / goals.length) * 100);
  };

  const handleSubmit = async (formData: GoalFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'DRAFT'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create goal');
      }

      const { goal } = await response.json();
      setGoals(prev => [goal, ...prev]);
      setIsCreateModalOpen(false);
      resetForm();
      showToast.goal.created();
    } catch (error) {
      console.error('Error creating goal:', error);
      showToast.goal.error(error instanceof Error ? error.message : 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (bulkGoals: any[]) => {
    setLoading(true);
    try {
      console.log('Submitting bulk goals:', {
        goals: bulkGoals,
        assignedEmployees: assignedEmployees.map(e => ({ id: e.id, name: e.name }))
      });

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
        setIsBulkCreateModalOpen(false);
        showToast.goal.created();

        // Refresh the goals and stats
        await fetchAssignedEmployees();
      } else {
        throw new Error(result.message || 'Failed to create goals');
      }
    } catch (error) {
      console.error('Error creating bulk goals:', error);
      showToast.goal.error(error instanceof Error ? error.message : 'Failed to create goals');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGoal = async (updatedData: GoalFormData) => {
    if (!selectedGoal) return;
    // Close the modal immediately for a more responsive UX
    setIsEditModalOpen(false);
    setSelectedGoal(null);
    setLoading(true);
    try {
      // Make API call
      const response = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error('Failed to update goal');

      const updatedGoal = await response.json();

      // Ensure date fields are valid Date objects or valid ISO strings
      updatedGoal.dueDate = new Date(updatedGoal.dueDate).toISOString();
      updatedGoal.updatedAt = new Date(updatedGoal.updatedAt).toISOString();

      // Update with server data
      setGoals(prev => prev.map(goal => 
        goal.id === selectedGoal.id ? updatedGoal : goal
      ));
      setViewedGoal(updatedGoal);

      // Show view modal after update
      setIsViewModalOpen(true);
      showToast.goal.updated();
      
    } catch (error) {
      console.error('Error updating goal:', error);
      showToast.goal.error('Failed to update goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!goalToDelete) return;

    try {
      const response = await fetch(`/api/goals/${goalToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete goal');

      setGoals(prev => prev.filter(goal => goal.id !== goalToDelete));
      setIsDeleteModalOpen(false);
      setGoalToDelete(null);
      showToast.goal.deleted();
    } catch (error) {
      console.error('Error deleting goal:', error);
      showToast.goal.error('Failed to delete goal');
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
    setSelectedGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      dueDate: new Date(goal.dueDate).toISOString().split('T')[0],
      employeeId: goal.employee?.id || '',
      category: goal.category,
      department: goal.department || 'ENGINEERING',
      priority: goal.priority || 'MEDIUM'
    });
    setIsEditModalOpen(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAssignedEmployees();
    setRefreshing(false);
  };

  if (error) {
    return <ErrorFallback error={error} resetErrorBoundary={() => setError(null)} />;
  }

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <DashboardLayout type="manager">
      <div className={`min-h-screen bg-gradient-to-br ${colors.background.gradient}`}>
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6 space-y-8">
       
        <HeroSection
          onCreateClick={() => setIsCreateModalOpen(true)}
          onBulkCreateClick={() => setIsBulkCreateModalOpen(true)}
        />
        <StatsSection stats={stats} />
        
        {/* Goal Templates Section */}
        <div className="space-y-4">
          {/* View Templates Button */}
          <motion.button
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 
              shadow-md border border-white/10 dark:border-gray-700/30 
              hover:bg-white/90 dark:hover:bg-gray-700/80 transition-all duration-300
              text-gray-900 dark:text-white font-medium flex items-center justify-center gap-2"
          >
            {showTemplates ? 'Hide Templates' : 'View Templates'}
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
                <div className={`${colors.background.primary} backdrop-blur-xl rounded-2xl p-6 shadow-lg border ${colors.border.light}`}>
                  <h3 className={`text-xl font-bold ${colors.text.primary} mb-4`}>Goal Templates</h3>
                  <GoalTemplates onSelect={(template) => {
                    setFormData(prev => ({
                      ...prev,
                      title: template.title,
                      description: template.description,
                      category: template.category,
                      department: 'ENGINEERING',
                      priority: 'MEDIUM'
                    }));
                    setIsCreateModalOpen(true);
                  }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <GoalList
          goals={goals}
          assignedEmployees={assignedEmployees}
          selectedEmployee={selectedEmployee}
          onEmployeeChange={setSelectedEmployee}
          onViewGoal={(goal) => {
            setViewedGoal(goal);
            setIsViewModalOpen(true);
          }}
          onEditGoal={handleEditGoal}
          onDeleteGoal={(goalId) => {
            setGoalToDelete(goalId);
            setIsDeleteModalOpen(true);
          }}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        {/* Modals */}
        <CreateGoalModal
          isOpen={isCreateModalOpen || isEditModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedGoal(null);
            resetForm();
          }}
          onSubmit={isEditModalOpen ? handleUpdateGoal : handleSubmit}
          assignedEmployees={assignedEmployees}
          loading={loading}
          formData={formData}
          setFormData={setFormData}
          mode={isEditModalOpen ? 'edit' : 'create'}
          initialData={selectedGoal ? {
            title: selectedGoal.title,
            description: selectedGoal.description,
            dueDate: selectedGoal.dueDate,
            employeeId: selectedGoal.employee?.id || '',
            category: selectedGoal.category,
            department: selectedGoal.department || 'ENGINEERING',
            priority: selectedGoal.priority || 'MEDIUM'
          } : undefined}
        />

        {viewedGoal && (
          <GoalDetailModal
            goal={viewedGoal}
            onClose={() => {
              setIsViewModalOpen(false);
              setViewedGoal(null);
            }}
            onEdit={(goal) => {
              handleEditGoal(goal);
              setIsViewModalOpen(false);
            }}
            onDelete={(goal) => {
              setIsViewModalOpen(false);
              setIsDeleteModalOpen(true);
              setGoalToDelete(goal.id);
            }}
          />
        )}

        <BulkGoalFormModal
          isOpen={isBulkCreateModalOpen}
          onClose={() => setIsBulkCreateModalOpen(false)}
          onSubmit={handleBulkSubmit}
          assignedEmployees={assignedEmployees}
          loading={loading}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setGoalToDelete(null);
          }}
          onConfirm={handleDelete}
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

export default function ManagerGoalSettingPage() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <ManagerGoalSettingPageContent />
    </Suspense>
  );
}