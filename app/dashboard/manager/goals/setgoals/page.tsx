'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Toaster } from 'sonner';
import { 
  BsCalendar, 
  BsListTask, 
  BsTag,
  BsCheckCircle,
  BsClock,
  BsXCircle,
  BsPeople,
  BsPlus,
  BsEye,
  BsPencil,
  BsTrash,
  BsX,
  BsArrowCounterclockwise,
  BsLightbulb,
  BsAward,
  BsGraphUp,
  BsBriefcase,
  BsRocket,
  BsExclamationTriangle,
  BsGear,
  BsTrophy,
  BsBook,
  BsRobot,
  BsLightningCharge,
  BsStars,
  BsArrowUpRight,
  BsPersonLinesFill,
  BsClipboardData,
  BsBarChart
} from 'react-icons/bs';
import { User, Calendar } from 'lucide-react';
import type { IconType } from 'react-icons';

import { CreateGoalModal } from './components/modals/CreateGoalModal';
import { ViewGoalModal } from './components/modals/ViewGoalModal';
import { DeleteGoalModal } from './components/modals/DeleteGoalModal';
import { EditGoalModal } from './components/modals/EditGoalModal';
import { GoalCard } from '@/app/components/shared/GoalCard';
import GoalTemplates from '@/app/components/shared/GoalTemplates';
import { GoalStats } from './components/GoalStats';
import { GoalFormData, GoalStats as GoalStatsType } from './components/types';
import { CATEGORIES, GOAL_TEMPLATES } from '@/app/components/shared/constants';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  position: string | null;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'DRAFT';
  dueDate: string;
  category: string;
  createdAt: string;
  employee: {
    id: string;
    name: string;
    email: string;
  } | null;
  manager: {
    id: string;
    name: string;
    email: string;
  } | null;
}

type Template = {
  id: string;
  title: string;
  category: string;
  icon: string;
  iconColor: string;
  description: string;
  subtitle: string;
  bgGradient: string;
  bgColor: string;
};

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
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    category: 'PROFESSIONAL'
  });
  const [stats, setStats] = useState<GoalStatsType>({
    totalEmployees: 0,
    totalGoals: 0,
    completedGoals: 0,
    pendingGoals: 0,
    draftGoals: 0,
    categoryStats: {}
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  const resetError = () => {
    setError(null);
    setLoading(true);
  };

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user?.role !== 'MANAGER') {
      router.push('/dashboard');
      return;
    }

    const fetchAssignedEmployees = async () => {
      try {
        const response = await fetch('/api/employees/assigned');
        if (!response.ok) {
          throw new Error('Failed to fetch assigned employees');
        }
        const data = await response.json();
        setAssignedEmployees(data.employees);
      } catch (error) {
        console.error('Error fetching assigned employees:', error);
        setError(error instanceof Error ? error : new Error('Failed to load assigned employees'));
        toast.error('Failed to load assigned employees');
      } finally {
        // Set loading to false even if there are no assigned employees
        setLoading(false);
      }
    };

    fetchAssignedEmployees();
  }, [session, router]);

  const getFilteredGoals = (goals: Goal[]) => {
    if (selectedEmployee === 'all') return goals;
    return goals.filter(goal => goal.employee?.id === selectedEmployee);
  };

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch('/api/goals/managed');
        if (!response.ok) throw new Error('Failed to fetch goals');
        const data = await response.json();
        
        const assignedGoals = data.goals.filter((goal: Goal) => 
          goal.manager?.id === session?.user?.id && 
          goal.employee?.id !== session?.user?.id
        );
        
        setGoals(assignedGoals);
        
        const filteredGoals = getFilteredGoals(assignedGoals);
        setStats(prevStats => ({
          ...prevStats,
          totalEmployees: assignedEmployees.length,
          totalGoals: filteredGoals.length,
          completedGoals: filteredGoals.filter((g: Goal) => g.status === 'COMPLETED').length,
          pendingGoals: filteredGoals.filter((g: Goal) => g.status === 'PENDING').length,
          draftGoals: filteredGoals.filter((g: Goal) => g.status === 'DRAFT').length,
          categoryStats: filteredGoals.reduce((acc: { [key: string]: number }, goal: Goal) => {
            acc[goal.category] = (acc[goal.category] || 0) + 1;
            return acc;
          }, {})
        }));
      } catch (error) {
        console.error('Error fetching goals:', error);
        toast.error('Failed to load goals');
      }
    };

    // Only fetch goals if we have assigned employees, but don't block loading state
    if (assignedEmployees.length > 0) {
      fetchGoals();
    }
  }, [assignedEmployees, session?.user?.id, selectedEmployee]);

  const handleSubmit = async (formData: GoalFormData) => {
    setLoading(true);

    try {
      const validationErrors = [];
      if (!formData.title.trim()) validationErrors.push('Title is required');
      if (!formData.description.trim()) validationErrors.push('Description is required');
      if (!formData.dueDate) validationErrors.push('Due date is required');
      if (!formData.employeeId) validationErrors.push('Please select an employee');
      if (!formData.category) validationErrors.push('Please select a category');

      if (validationErrors.length > 0) {
        toast.error(validationErrors.join('\n'));
        setLoading(false);
        return;
      }

      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        toast.warning('Due date cannot be in the past');
        setLoading(false);
        return;
      }

      const goalData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        employeeId: formData.employeeId,
        dueDate: new Date(formData.dueDate).toISOString(),
        category: formData.category,
        status: 'DRAFT'
      };

      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create goal');
      }

      const responseData = await response.json();
      setGoals(prevGoals => [responseData.goal, ...prevGoals]);
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        employeeId: '',
        category: 'PROFESSIONAL'
      });
      
      setTimeout(() => {
        toast.success('🎯 Goal created successfully!', {
          description: 'Your goal has been created and assigned to the employee.',
          duration: 4000,
          position: 'top-center',
          style: {
            background: 'rgba(30, 32, 40, 0.95)',
            color: '#fff',
            border: '1px solid rgba(45, 55, 72, 0.5)',
            borderRadius: '16px',
            padding: '20px 24px',
            fontSize: '16px',
            fontWeight: '600',
            textAlign: 'center',
            width: 'auto',
            maxWidth: '450px',
            margin: '0 auto',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          },
          className: 'modern-toast'
        });
      }, 100);
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setFormData({
      ...formData,
      title: template.title,
      description: template.description,
      category: template.category
    });
    setIsCreateModalOpen(true);
  };

  const handleView = (goal: Goal) => {
    setViewedGoal(goal);
    setIsViewModalOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setSelectedGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      dueDate: new Date(goal.dueDate).toISOString().split('T')[0],
      employeeId: goal.employee?.id || '',
      category: goal.category
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateGoal = async (updatedData: GoalFormData) => {
    if (!selectedGoal) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update goal');
      }

      const updatedGoal = await response.json();
      
      // Update the goals list with the new data
      setGoals(prevGoals => 
        prevGoals.map(goal => goal.id === selectedGoal.id ? updatedGoal : goal)
      );
      
      // Calculate filtered goals using the updated list
      const filteredGoals = getFilteredGoals(goals.map(goal => 
        goal.id === selectedGoal.id ? updatedGoal : goal
      ));
      
      setStats(prevStats => ({
        ...prevStats,
        totalGoals: filteredGoals.length,
        completedGoals: filteredGoals.filter((g: Goal) => g.status === 'COMPLETED').length,
        pendingGoals: filteredGoals.filter((g: Goal) => g.status === 'PENDING').length,
        draftGoals: filteredGoals.filter((g: Goal) => g.status === 'DRAFT').length,
        categoryStats: filteredGoals.reduce((acc: { [key: string]: number }, goal: Goal) => {
          acc[goal.category] = (acc[goal.category] || 0) + 1;
          return acc;
        }, {})
      }));

      toast.success('✅ Goal updated successfully!', {
        description: 'Your goal has been updated with the new information.',
        duration: 4000,
        position: 'top-center',
        style: {
          background: 'rgba(30, 32, 40, 0.95)',
          color: '#fff',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '16px',
          padding: '20px 24px',
          fontSize: '16px',
          fontWeight: '600',
          textAlign: 'center',
          width: 'auto',
          maxWidth: '450px',
          margin: '0 auto',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          borderLeft: '4px solid #22c55e'
        },
        className: 'goal-success-toast'
      });

      setIsEditModalOpen(false);
      setSelectedGoal(null);
      setFormData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        employeeId: '',
        category: 'PROFESSIONAL'
      });
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (goalId: string) => {
    setGoalToDelete(goalId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!goalToDelete) return;

    try {
      const response = await fetch(`/api/goals/${goalToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete goal');
      }

      setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalToDelete));
      setIsDeleteModalOpen(false);
      setGoalToDelete(null);
      
      toast.success('🗑️ Goal deleted successfully!', {
        description: 'The goal has been permanently removed from the system.',
        duration: 4000,
        position: 'top-center',
        style: {
          background: 'rgba(30, 32, 40, 0.95)',
          color: '#fff',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '16px',
          padding: '20px 24px',
          fontSize: '16px',
          fontWeight: '600',
          textAlign: 'center',
          width: 'auto',
          maxWidth: '450px',
          margin: '0 auto',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          borderLeft: '4px solid #22c55e'
        },
        className: 'goal-success-toast'
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete goal');
    }
  };

  if (error) {
    return <ErrorFallback error={error} resetErrorBoundary={resetError} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="relative"
        >
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-pulse"></div>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6 space-y-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-xl rounded-3xl p-8 text-white shadow-2xl border border-white/20">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-3xl" />
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
                    Manage Employee Goals
                  </h1>
                  <p className="text-xl text-indigo-100/90">Create and manage goals for your assigned employees</p>
                </div>
                <div className="mt-6 lg:mt-0 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-6 py-3 flex items-center gap-2 hover:bg-white/30 transition-all duration-300"
                  >
                    <BsPlus className="text-lg" />
                    Quick Create
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-6 py-3 flex items-center gap-2 hover:bg-white/30 transition-all duration-300"
                  >
                    <BsBarChart className="text-lg" />
                    Analytics
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Header Section */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 rounded-xl">
                <BsLightningCharge className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Goal Management</h2>
                <p className="text-gray-600 dark:text-gray-400">Create and manage goals for your assigned employees</p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200"
              >
                <BsPlus className="w-4 h-4" />
                New Goal
              </motion.button>
            </div>
          </div>

          {/* Stats Grid */}
          <motion.div 
            variants={itemVariants}
            className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
          >
            <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-sm border border-blue-200/20 dark:border-blue-600/20 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <BsPeople className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Employees</div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalEmployees}</div>
            </div>
            
            <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm border border-emerald-200/20 dark:border-emerald-600/20 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <BsClipboardData className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Total Goals</div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalGoals}</div>
            </div>
            
            <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 backdrop-blur-sm border border-amber-200/20 dark:border-amber-600/20 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <BsCheckCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">Completed Goals</div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedGoals}</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Goal Templates Section */}
        <motion.div variants={itemVariants}>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BsLightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Goal Templates
            </h3>
            <GoalTemplates onSelect={handleTemplateSelect} />
          </div>
        </motion.div>

        {/* Goal Stats Section */}
        <motion.div variants={itemVariants}>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BsBarChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Goal Statistics
            </h3>
            <GoalStats stats={stats} />
          </div>
        </motion.div>

        {/* Goal Management Section */}
        <motion.div variants={itemVariants}>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BsBriefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Goal Management
                  <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full text-sm font-normal">
                    {getFilteredGoals(goals).length} Goals
                  </span>
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track all assigned goals</p>
              </div>
              
              {/* Employee Filter */}
              <div className="flex items-center gap-4">
                <div className="relative group min-w-[200px]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BsPeople className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all w-full rounded-xl">
                      <SelectValue>
                        <span className="text-gray-900 dark:text-white">
                          {selectedEmployee === 'all' ? 'All Employees' : assignedEmployees.find(e => e.id === selectedEmployee)?.name}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-600/50">
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <BsPeople className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-white">All Employees</span>
                        </div>
                      </SelectItem>
                      {assignedEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex items-center gap-2">
                            <BsPeople className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-900 dark:text-white">{employee.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {getFilteredGoals(goals).length === 0 ? (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/20 dark:border-gray-700/50 shadow-lg">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-100/50 to-gray-200/50 dark:from-gray-700/50 dark:to-gray-600/50 mb-4">
                  <BsPersonLinesFill className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No goals found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedEmployee !== 'all'
                    ? "This employee has no assigned goals"
                    : "Create your first goal to get started"}
                </p>
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              >
                {getFilteredGoals(goals).map((goal) => (
                  <motion.div
                    key={goal.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl"
                  >
                    <GoalCard
                      goal={goal}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Modals */}
        <CreateGoalModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleSubmit}
          assignedEmployees={assignedEmployees}
          loading={loading}
          formData={formData}
          setFormData={setFormData}
        />

        <EditGoalModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateGoal}
          assignedEmployees={assignedEmployees}
          loading={loading}
          goal={selectedGoal}
        />

        <ViewGoalModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          goal={viewedGoal}
          onEdit={() => {
            setIsViewModalOpen(false);
            if (viewedGoal) handleEdit(viewedGoal);
          }}
        />

        <DeleteGoalModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setGoalToDelete(null);
          }}
          onConfirm={confirmDelete}
        />

        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(30, 32, 40, 0.95)',
              color: '#fff',
              border: '1px solid rgba(45, 55, 72, 0.5)',
              borderRadius: '16px',
              padding: '20px 24px',
              fontSize: '16px',
              fontWeight: '600',
              textAlign: 'center',
              width: 'auto',
              maxWidth: '450px',
              margin: '0 auto',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            },
            className: 'modern-toast'
          }}
        />
      </div>
    </div>
  );
}

export default function ManagerGoalSettingPage() {
  return (
    <DashboardLayout type="manager">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-pulse"></div>
          </motion.div>
        </div>
      }>
        <ManagerGoalSettingPageContent />
      </Suspense>
    </DashboardLayout>
  );
}