'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import type { IconType } from 'react-icons';
import { BsPeople, BsFilter } from 'react-icons/bs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';

import { User as UserType, Goal, GoalStats } from './types';
import { StatsCard } from './components/StatsCard';
import GoalTemplates from '@/app/components/shared/GoalTemplates';
import { GoalManagementSection } from './components/GoalManagementSection';
import { GoalCreationSection } from './components/GoalCreationSection';
import { GoalModals } from './components/GoalModals';
import { Notification } from './components/Notification';

function AdminGoalSettingPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserType[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
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

  const getFilteredGoals = (goals: Goal[]) => {
    // First filter out self-created goals and admin users
    const assignedGoals = goals.filter(goal => 
      goal.manager?.id !== goal.employee?.id && 
      goal.employee && users.find(u => u.id === goal.employee?.id)?.role !== 'ADMIN'
    );
    
    // Then apply filters
    return assignedGoals.filter(goal => {
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
          completedGoals: filteredGoals.filter(g => g.status === 'COMPLETED').length,
          pendingGoals: filteredGoals.filter(g => g.status === 'PENDING').length,
          draftGoals: filteredGoals.filter(g => g.status === 'DRAFT').length,
          inProgressGoals: filteredGoals.filter(g => g.status === 'APPROVED').length
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
      <GoalTemplates onSelect={handleTemplateSelect} />
      <StatsCard stats={stats} />

      <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Goal Management
              <span className="bg-blue-500/10 p-1 rounded text-blue-400 text-sm font-normal">
                {getFilteredGoals(goals).length} Goals
              </span>
            </h2>
            <p className="text-gray-400 mt-1">Manage and track all assigned goals</p>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
            >
              <SelectTrigger className="w-[180px] bg-[#25262b] border-0 focus:ring-1 focus:ring-gray-500 text-white">
                <SelectValue>
                  <div className="flex items-center gap-2 text-white">
                    <BsPeople className="h-4 w-4 text-gray-400" />
                    <span className="text-white">{selectedEmployee === 'all' ? 'All Users' : users.find(u => u.id === selectedEmployee)?.name}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#25262b] border border-gray-700">
                <SelectItem value="all" className="focus:bg-gray-700">
                  <div className="flex items-center gap-2 text-white">
                    <BsPeople className="h-4 w-4 text-gray-400" />
                    <span className="text-white">All Users</span>
                  </div>
                </SelectItem>
                {users
                  .filter(user => user.role !== 'ADMIN')
                  .map((user) => (
                    <SelectItem 
                      key={user.id} 
                      value={user.id}
                      className="focus:bg-gray-700"
                    >
                      <div className="flex items-center gap-2 text-white">
                        <BsPeople className="h-4 w-4 text-gray-400" />
                        <span className="text-white">{user.name}</span>
                        <span className="text-xs text-gray-400">({user.role})</span>
                      </div>
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger className="w-[180px] bg-[#25262b] border-0 focus:ring-1 focus:ring-gray-500 text-white">
                <SelectValue>
                  <div className="flex items-center gap-2 text-white">
                    <BsFilter className="h-4 w-4 text-gray-400" />
                    <span className="text-white">{selectedStatus === 'all' ? 'All Statuses' : selectedStatus}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#25262b] border border-gray-700">
                <SelectItem value="all" className="focus:bg-gray-700">
                  <div className="flex items-center gap-2 text-white">
                    <BsFilter className="h-4 w-4 text-gray-400" />
                    <span className="text-white">All Statuses</span>
                  </div>
                </SelectItem>
                <SelectItem value="DRAFT" className="focus:bg-gray-700">
                  <span className="text-white">Draft</span>
                </SelectItem>
                <SelectItem value="PENDING" className="focus:bg-gray-700">
                  <span className="text-white">Pending</span>
                </SelectItem>
                <SelectItem value="APPROVED" className="focus:bg-gray-700">
                  <span className="text-white">Approved</span>
                </SelectItem>
                <SelectItem value="COMPLETED" className="focus:bg-gray-700">
                  <span className="text-white">Completed</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <GoalManagementSection
          goals={getFilteredGoals(goals)}
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
      </div>

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