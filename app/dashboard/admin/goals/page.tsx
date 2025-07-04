'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingComponent from '@/app/components/LoadingScreen';

import type { IconType } from 'react-icons';
import { BsPeople, BsFilter, BsArrowUpRight, BsGear, BsBell, BsBullseye, BsCheckCircle, BsClock, BsPause, BsFileText } from 'react-icons/bs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/app/components/ui/select';

import { User as UserType, Goal, GoalStats } from '@/app/components/shared/types';
import { HeroSection } from './components/HeroSection';
import { StatsGrid } from './components/StatsGrid';
import { BackgroundElements } from './components/BackgroundElements';
import GoalTemplates from '@/app/components/shared/GoalTemplates';
import { GoalManagementSection } from './components/GoalManagementSection';
import { GoalModals } from './components/GoalModals';
import { Notification } from './components/Notification';

function AdminGoalSettingPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserType[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [stats, setStats] = useState<GoalStats>({
    totalGoals: 0,
    total: 0,
    completedGoals: 0,
    completed: 0,
    modified: 0,
    pendingGoals: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    achievementScore: 0,
    inProgressGoals: 0,
    totalEmployees: 0,
    totalManagers: 0,
    approvedGoals: 0,
    rejectedGoals: 0,
    draftGoals: 0,
    categoryStats: {}
  });
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewedGoal, setViewedGoal] = useState<Goal | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  const getFilteredGoals = (goals: Goal[]) => {
    // Filter out goals where employee is admin (but keep all other goals for admin management)
    const filteredGoals = goals.filter(goal => 
      goal.employee && users.find(u => u.id === goal.employee?.id)?.role !== 'ADMIN'
    );
    
    // Then apply filters
    return filteredGoals.filter(goal => {
      const matchesEmployee = selectedEmployee === 'all' || goal.employee?.id === selectedEmployee;
      const matchesStatus = selectedStatus === 'all' || goal.status === selectedStatus;
      return matchesEmployee && matchesStatus;
    });
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchGoalsAndStats = async () => {
      try {
        const response = await fetch('/api/goals', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch goals: ${response.status} ${response.statusText}\n${errorText}`);
        }

        const data = await response.json();
        
        if (!data.goals || !Array.isArray(data.goals)) {
          throw new Error('Invalid goals data received from server');
        }

        const sortedGoals = data.goals.sort((a: Goal, b: Goal) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
        
        setGoals(sortedGoals);
        
        const filteredGoals = getFilteredGoals(sortedGoals);
        
        setStats(prevStats => ({
          ...prevStats,
          totalGoals: filteredGoals.length,
          total: filteredGoals.length,
          completedGoals: filteredGoals.filter(g => g.status === 'COMPLETED').length,
          completed: filteredGoals.filter(g => g.status === 'COMPLETED').length,
          modified: filteredGoals.filter(g => g.status === 'MODIFIED').length,
          pendingGoals: filteredGoals.filter(g => g.status === 'PENDING').length,
          pending: filteredGoals.filter(g => g.status === 'PENDING').length,
          approved: filteredGoals.filter(g => g.status === 'APPROVED').length,
          rejected: filteredGoals.filter(g => g.status === 'REJECTED').length,
          achievementScore: 0, // You may want to calculate this based on your business logic
          inProgressGoals: filteredGoals.filter(g => g.status === 'APPROVED').length,
          approvedGoals: filteredGoals.filter(g => g.status === 'APPROVED').length,
          rejectedGoals: filteredGoals.filter(g => g.status === 'REJECTED').length,
          draftGoals: filteredGoals.filter(g => g.status === 'DRAFT').length,
          categoryStats: filteredGoals.reduce((acc, goal) => {
            acc[goal.category] = (acc[goal.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }));

        const employeeCount = users.filter(user => user.role === 'EMPLOYEE').length;
        const managerCount = users.filter(user => user.role === 'MANAGER').length;
        
        setStats(prevStats => ({
          ...prevStats,
          totalEmployees: employeeCount,
          totalManagers: managerCount
        }));

      } catch (error) {
        console.error('Error in fetchGoalsAndStats:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load goals');
      }
    };

    fetchGoalsAndStats();

    const intervalId = setInterval(fetchGoalsAndStats, 30000);

    return () => clearInterval(intervalId);
  }, [users, selectedEmployee, selectedStatus]);

  const handleCreate = async (formData: any) => {
    setLoading(true);
    try {
      const goalData = {
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString(),
        status: 'DRAFT'
      };

      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create goal');
      }

      const responseData = await response.json();
      setGoals(prevGoals => [responseData.goal, ...prevGoals]);
      setIsCreateModalOpen(false);
      toast.success('🎯 Goal created successfully!', {
        description: 'Your goal has been created and is ready for review.',
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
      console.error('Error creating goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (formData: any) => {
    if (!selectedGoal) return;
    setLoading(true);
    try {
      console.log('Updating goal:', selectedGoal.id, 'with data:', formData);
      
      const goalData = {
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString(),
      };

      const response = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });

      console.log('Update response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update error response:', errorData);
        throw new Error(errorData.error || 'Failed to update goal');
      }

      const { goal: updatedGoal } = await response.json();
      console.log('Updated goal:', updatedGoal);
      
      setGoals(prevGoals => 
        prevGoals.map(g => g.id === selectedGoal.id ? updatedGoal : g)
      );

      setIsEditModalOpen(false);
      setSelectedGoal(null);
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
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    setGoalToDelete(goal);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!goalToDelete) return;
    try {
      console.log('Deleting goal:', goalToDelete.id);
      
      const response = await fetch(`/api/goals/${goalToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete error response:', errorData);
        throw new Error(errorData.error || 'Failed to delete goal');
      }

      const result = await response.json();
      console.log('Delete result:', result);

      setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalToDelete.id));
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
      console.error('Error Deleting Goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to Delete Goal');
    } finally {
      setIsDeleteModalOpen(false);
      setGoalToDelete(null);
    }
  };

  const handleView = (goal: Goal) => {
    setViewedGoal(goal);
    setIsViewModalOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    // First open the modal
    setIsEditModalOpen(true);

    // Then set the selected goal on the next tick
    setTimeout(() => {
      setSelectedGoal(goal);
    }, 0);
  };

  const handleTemplateSelect = (template: any) => {
    // First close the templates view
    setShowTemplates(false);

    // Then open the create modal
    setIsCreateModalOpen(true);

    // Finally set the selected goal with template data
    setTimeout(() => {
      const newGoal = {
        title: template.title || '',
        description: template.description || '',
        dueDate: new Date().toISOString().split('T')[0],
        employeeId: '',
        category: template.category
      };

      setSelectedGoal({
        id: '',
        ...newGoal,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        managerId: '',
        isApprovalProcess: false,
        employee: null,
        manager: null
      });
    }, 0);
  };

  if (loading) {
    return <LoadingComponent />;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <BackgroundElements />

      <div className="relative z-10 p-3 space-y-4">
        <HeroSection onCreateClick={() => setIsCreateModalOpen(true)} />
        <StatsGrid stats={stats} />

        {/* Main Content Sections */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* View Templates Button */}
          <motion.div variants={itemVariants}>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 
                shadow-md border border-white/10 dark:border-gray-700/30 
                hover:bg-white/90 dark:hover:bg-gray-700/80 transition-all duration-300
                text-gray-900 dark:text-white font-medium flex items-center justify-center gap-2"
            >
              {showTemplates ? 'Hide Templates' : 'View Templates'}
              <BsArrowUpRight className={`transform transition-transform duration-300 ${showTemplates ? 'rotate-180' : ''}`} />
            </button>
          </motion.div>

          {/* Goal Templates */}
          <AnimatePresence>
            {showTemplates && (
              <motion.div 
                variants={itemVariants}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 shadow-md border border-white/10 dark:border-gray-700/30">
                  <GoalTemplates onSelect={handleTemplateSelect} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Goal Management Section */}
          <motion.div variants={itemVariants}>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 shadow-md border border-white/10 dark:border-gray-700/30">
              <GoalManagementSection
                goals={getFilteredGoals(goals)}
                stats={{
                  totalGoals: stats.totalGoals,
                  completedGoals: stats.completedGoals,
                  inProgressGoals: stats.inProgressGoals,
                  pendingGoals: stats.pendingGoals
                }}
                selectedEmployee={selectedEmployee}
                selectedStatus={selectedStatus}
                onEmployeeChange={setSelectedEmployee}
                onStatusChange={setSelectedStatus}
                users={users}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCreate={() => setIsCreateModalOpen(true)}
              />
            </div>
          </motion.div>
        </motion.div>

        <Notification
          show={showNotification}
          type={notificationType}
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
        />

        <GoalModals
          isCreateModalOpen={isCreateModalOpen}
          isEditModalOpen={isEditModalOpen}
          isViewModalOpen={isViewModalOpen}
          isDeleteModalOpen={isDeleteModalOpen}
          selectedGoal={selectedGoal}
          viewedGoal={viewedGoal}
          goalToDelete={goalToDelete}
          users={users}
          loading={loading}
          onCloseCreate={() => setIsCreateModalOpen(false)}
          onCloseEdit={() => setIsEditModalOpen(false)}
          onCloseView={() => {
            setIsViewModalOpen(false);
            setViewedGoal(null);
          }}
          onCloseDelete={() => {
            setIsDeleteModalOpen(false);
            setGoalToDelete(null);
          }}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleConfirmDelete}
          setSelectedGoal={setSelectedGoal}
          setGoalToDelete={setGoalToDelete}
          setIsEditModalOpen={setIsEditModalOpen}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
        />
      </div>
    </div>
  );
}

export default function AdminGoalSettingPage() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <DashboardLayout type="admin">
        <Toaster 
          position="top-center"
          richColors
          closeButton
          theme="dark"
          toastOptions={{
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
            duration: 4000,
            className: 'modern-toast'
          }}
        />
        <AdminGoalSettingPageContent />
      </DashboardLayout>
    </Suspense>
  );
} 