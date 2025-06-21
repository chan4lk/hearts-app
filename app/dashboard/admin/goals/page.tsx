'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { IconType } from 'react-icons';
import { BsPeople, BsFilter, BsArrowUpRight, BsGear, BsBell, BsBullseye, BsCheckCircle, BsClock, BsPause, BsFileText } from 'react-icons/bs';
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
                    Goal Management
                  </h1>
                  <p className="text-xl text-indigo-100/90">Set, track, and manage team objectives</p>
                </div>
                <div className="mt-6 lg:mt-0 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-6 py-3 flex items-center gap-2 hover:bg-white/30 transition-all duration-300"
                  >
                    <BsBullseye className="text-lg" />
                    Create Goal
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-6 py-3 flex items-center gap-2 hover:bg-white/30 transition-all duration-300"
                  >
                    <BsGear className="text-lg" />
                    Settings
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={itemVariants} className="group">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-gray-700/50 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300">
                  <BsBullseye className="text-2xl text-white" />
                </div>
                <BsArrowUpRight className="text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.totalGoals}</h3>
              <p className="text-gray-600 dark:text-gray-300">Total Goals</p>
              <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                />
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="group">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-gray-700/50 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl group-hover:from-green-600 group-hover:to-green-700 transition-all duration-300">
                  <BsCheckCircle className="text-2xl text-white" />
                </div>
                <BsArrowUpRight className="text-gray-400 group-hover:text-green-500 transition-colors" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.completedGoals}</h3>
              <p className="text-gray-600 dark:text-gray-300">Completed</p>
              <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.totalGoals > 0 ? (stats.completedGoals / stats.totalGoals) * 100 : 0}%` }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                />
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="group">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-gray-700/50 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl group-hover:from-purple-600 group-hover:to-purple-700 transition-all duration-300">
                  <BsClock className="text-2xl text-white" />
                </div>
                <BsArrowUpRight className="text-gray-400 group-hover:text-purple-500 transition-colors" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.inProgressGoals}</h3>
              <p className="text-gray-600 dark:text-gray-300">In Progress</p>
              <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.totalGoals > 0 ? (stats.inProgressGoals / stats.totalGoals) * 100 : 0}%` }}
                  transition={{ duration: 1, delay: 0.7 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                />
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="group">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-gray-700/50 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl group-hover:from-orange-600 group-hover:to-orange-700 transition-all duration-300">
                  <BsFileText className="text-2xl text-white" />
                </div>
                <BsArrowUpRight className="text-gray-400 group-hover:text-orange-500 transition-colors" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.pendingGoals}</h3>
              <p className="text-gray-600 dark:text-gray-300">Pending</p>
              <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.totalGoals > 0 ? (stats.pendingGoals / stats.totalGoals) * 100 : 0}%` }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content Sections */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Goal Creation Section */}
          <motion.div variants={itemVariants}>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
              <GoalCreationSection onCreate={() => setIsCreateModalOpen(true)} />
            </div>
          </motion.div>

          {/* Goal Templates */}
          <motion.div variants={itemVariants}>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
              <GoalTemplates onSelect={handleTemplateSelect} />
            </div>
          </motion.div>

          {/* Goal Management Section */}
          <motion.div variants={itemVariants}>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Goal Management
                    <span className="bg-blue-500/10 p-2 rounded-xl text-blue-600 dark:text-blue-400 text-sm font-normal">
                      {getFilteredGoals(goals).length} Goals
                    </span>
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track all assigned goals</p>
                </div>
                <div className="flex items-center gap-4">
                  <Select
                    value={selectedEmployee}
                    onValueChange={setSelectedEmployee}
                  >
                    <SelectTrigger className="w-[180px] bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <BsPeople className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span>{selectedEmployee === 'all' ? 'All Users' : users.find(u => u.id === selectedEmployee)?.name}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50">
                      <SelectItem value="all" className="focus:bg-gray-100 dark:focus:bg-gray-700">
                        <div className="flex items-center gap-2">
                          <BsPeople className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span>All Users</span>
                        </div>
                      </SelectItem>
                      {users
                        .filter(user => user.role !== 'ADMIN')
                        .map((user) => (
                          <SelectItem 
                            key={user.id} 
                            value={user.id}
                            className="focus:bg-gray-100 dark:focus:bg-gray-700"
                          >
                            <div className="flex items-center gap-2">
                              <BsPeople className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span>{user.name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">({user.role})</span>
                            </div>
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="w-[180px] bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <BsFilter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span>{selectedStatus === 'all' ? 'All Statuses' : selectedStatus}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50">
                      <SelectItem value="all" className="focus:bg-gray-100 dark:focus:bg-gray-700">
                        <div className="flex items-center gap-2">
                          <BsFilter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span>All Statuses</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="DRAFT" className="focus:bg-gray-100 dark:focus:bg-gray-700">
                        <span>Draft</span>
                      </SelectItem>
                      <SelectItem value="PENDING" className="focus:bg-gray-100 dark:focus:bg-gray-700">
                        <span>Pending</span>
                      </SelectItem>
                      <SelectItem value="APPROVED" className="focus:bg-gray-100 dark:focus:bg-gray-700">
                        <span>Approved</span>
                      </SelectItem>
                      <SelectItem value="COMPLETED" className="focus:bg-gray-100 dark:focus:bg-gray-700">
                        <span>Completed</span>
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
          </motion.div>
        </motion.div>

        {/* Notification */}
        <Notification
          show={showNotification}
          type={notificationType}
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
        />

        {/* Modals */}
        <AnimatePresence>
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
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function AdminGoalSettingPage() {
  return (
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
              borderRadius: '12px',
              padding: '16px 24px',
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'center',
              width: 'auto',
              maxWidth: '400px',
              margin: '0 auto',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
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