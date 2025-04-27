'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import type { IconType } from 'react-icons';

import { User as UserType, Goal, GoalStats } from '@/app/components/goals/types';
import { GoalCard } from '@/app/components/goals/GoalCard';
import { GoalForm } from '@/app/components/goals/GoalForm';
import { GoalModal } from '@/app/components/goals/GoalModal';
import { DeleteConfirmationModal } from '@/app/components/goals/DeleteConfirmationModal';
import { StatsCard } from '@/app/components/goals/StatsCard';
import { GoalTemplates } from '@/app/components/goals/GoalTemplates';
import { GoalManagementSection } from '@/app/components/goals/GoalManagementSection';
import { GoalCreationSection } from '@/app/components/goals/GoalCreationSection';
import { GoalModals } from '@/app/components/goals/GoalModals';
import { Notification } from '@/app/components/goals/Notification';

function AdminGoalSettingPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserType[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [stats, setStats] = useState<GoalStats>({
    totalGoals: 0,
    completedGoals: 0,
    pendingGoals: 0,
    inProgressGoals: 0,
    totalEmployees: 0,
    totalManagers: 0,
    draftGoals: 0
  });
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewedGoal, setViewedGoal] = useState<Goal | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

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
        
        setStats(prevStats => ({
          ...prevStats,
          totalGoals: data?.stats?.total ?? 0,
          completedGoals: data?.stats?.completed ?? 0,
          pendingGoals: data?.stats?.pending ?? 0,
          draftGoals: data?.stats?.draft ?? 0,
          inProgressGoals: data?.stats?.inProgress ?? 0
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
  }, [users]);

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
      toast.success('Goal created successfully as draft');
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
      const goalData = {
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString(),
      };

      const response = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update goal');
      }

      const updatedGoal = await response.json();
      setGoals(prevGoals => 
        prevGoals.map(g => g.id === selectedGoal.id ? updatedGoal.goal : g)
      );

      setIsEditModalOpen(false);
      setSelectedGoal(null);
      toast.success('Goal updated successfully');
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
      const response = await fetch(`/api/goals/${goalToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete goal');
      }

      setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalToDelete.id));
      toast.success('Goal deleted successfully');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete goal');
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
    setSelectedGoal(goal);
    setIsEditModalOpen(true);
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedGoal({
      id: '',
      title: template.title,
      description: template.description,
      status: 'DRAFT',
      dueDate: new Date().toISOString(),
      category: template.category,
      createdAt: new Date().toISOString(),
      employee: null,
      manager: null
    });
    setIsCreateModalOpen(true);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Notification
        show={showNotification}
        type={notificationType}
        message={notificationMessage}
        onClose={() => setShowNotification(false)}
      />

      <GoalCreationSection onCreate={() => setIsCreateModalOpen(true)} />
      <GoalTemplates onTemplateSelect={handleTemplateSelect} />
      <StatsCard stats={stats} />
      <GoalManagementSection
        goals={goals}
        stats={{
          totalGoals: stats.totalGoals,
          completedGoals: stats.completedGoals,
          inProgressGoals: stats.inProgressGoals,
          pendingGoals: stats.pendingGoals
        }}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={() => setIsCreateModalOpen(true)}
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
      />
    </div>
  );
}

export default function AdminGoalSettingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardLayout type="admin">
        <Toaster 
          position="top-center"
          richColors
          closeButton
          theme="dark"
          toastOptions={{
            style: {
              background: '#1E2028',
              color: '#fff',
              border: '1px solid #374151',
              borderRadius: '0.75rem',
              padding: '1rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              textAlign: 'center',
              width: 'auto',
              maxWidth: '400px',
              margin: '0 auto',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            },
            duration: 3000,
            className: 'toast-message'
          }}
        />
        <AdminGoalSettingPageContent />
      </DashboardLayout>
    </Suspense>
  );
} 