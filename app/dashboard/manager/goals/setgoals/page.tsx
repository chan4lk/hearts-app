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
import { ViewGoalModal } from './components/modals/ViewGoalModal';
import { DeleteGoalModal } from './components/modals/DeleteGoalModal';
import GoalTemplates from '@/app/components/shared/GoalTemplates';
import { CATEGORIES } from '@/app/components/shared/constants';
import LoadingComponent from '@/app/components/LoadingScreen';

// Styles and Types
import { colors } from './components/styles/colors';
import { GoalFormData, GoalStats, User, Goal } from './components/types';

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
    category: 'PROFESSIONAL'
  });
  const [stats, setStats] = useState<GoalStats>({
    totalEmployees: 0,
    totalGoals: 0,
    completedGoals: 0,
    pendingGoals: 0,
    draftGoals: 0,
    approvedGoals: 0,
    rejectedGoals: 0,
    categoryStats: {}
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user?.role !== 'MANAGER') {
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
      completedGoals: filteredGoals.filter(g => g.status === 'COMPLETED').length,
      pendingGoals: filteredGoals.filter(g => g.status === 'PENDING').length,
      draftGoals: filteredGoals.filter(g => g.status === 'DRAFT').length,
      approvedGoals: filteredGoals.filter(g => g.status === 'APPROVED').length,
      rejectedGoals: filteredGoals.filter(g => g.status === 'REJECTED').length,
      categoryStats: filteredGoals.reduce((acc, goal) => {
        acc[goal.category] = (acc[goal.category] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number })
    });
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

  const handleUpdateGoal = async (updatedData: GoalFormData) => {
    if (!selectedGoal) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error('Failed to update goal');

      const updatedGoal = await response.json();
      setGoals(prev => prev.map(goal => goal.id === selectedGoal.id ? updatedGoal : goal));
      setIsEditModalOpen(false);
      resetForm();
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
      category: 'PROFESSIONAL'
    });
  };

  if (error) {
    return <ErrorFallback error={error} resetErrorBoundary={() => setError(null)} />;
  }

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.background.gradient}`}>
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6 space-y-8">
        <HeroSection onCreateClick={() => setIsCreateModalOpen(true)} />
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
                      category: template.category
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
          onEditGoal={(goal) => {
            setSelectedGoal(goal);
            setFormData({
              title: goal.title,
              description: goal.description,
              dueDate: new Date(goal.dueDate).toISOString().split('T')[0],
              employeeId: goal.employee?.id || '',
              category: goal.category
            });
            setIsEditModalOpen(true);
          }}
          onDeleteGoal={(goalId) => {
            setGoalToDelete(goalId);
            setIsDeleteModalOpen(true);
          }}
        />

        {/* Modals */}
        <CreateGoalModal
          isOpen={isCreateModalOpen || isEditModalOpen}
          onClose={() => {
            if (isEditModalOpen) {
              setIsEditModalOpen(false);
            } else {
              setIsCreateModalOpen(false);
            }
            resetForm();
          }}
          onSubmit={isEditModalOpen ? handleUpdateGoal : handleSubmit}
          assignedEmployees={assignedEmployees}
          loading={loading}
          formData={formData}
          setFormData={setFormData}
          mode={isEditModalOpen ? 'edit' : 'create'}
        />

        <ViewGoalModal
          isOpen={isViewModalOpen}
          onCloseAction={() => setIsViewModalOpen(false)}
          goal={viewedGoal}
          onEditAction={() => {
            if (viewedGoal) {
              setFormData({
                title: viewedGoal.title,
                description: viewedGoal.description,
                dueDate: new Date(viewedGoal.dueDate).toISOString().split('T')[0],
                employeeId: viewedGoal.employee?.id || '',
                category: viewedGoal.category
              });
              setSelectedGoal(viewedGoal);
              setIsViewModalOpen(false);
              setTimeout(() => {
                setIsEditModalOpen(true);
              }, 100);
            }
          }}
        />

        <DeleteGoalModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setGoalToDelete(null);
          }}
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}

export default function ManagerGoalSettingPage() {
  return (
    <DashboardLayout type="manager">
      <Suspense fallback={<LoadingComponent />}>
        <ManagerGoalSettingPageContent />
      </Suspense>
    </DashboardLayout>
  );
}