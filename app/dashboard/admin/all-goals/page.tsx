'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import AdminGoalsTable from '../components/AdminGoalsTable';
import { DeleteConfirmationModal } from '@/app/components/shared/DeleteConfirmationModal';
import LoadingComponent from '@/app/components/LoadingScreen';
import { Goal, User as UserType } from '@/app/components/shared/types';
import { motion } from 'framer-motion';
import { showToast } from '@/app/utils/toast';
import HeroSection from './components/HeroSection';
import StatsSection from './components/StatsSection';
import Filters from './components/Filters';

export default function AllGoalsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [goalsToBulkDelete, setGoalsToBulkDelete] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchData();
  }, [session, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [goalsRes, usersRes] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/users'),
      ]);

      if (!goalsRes.ok || !usersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [goalsData, usersData] = await Promise.all([
        goalsRes.json(),
        usersRes.ok ? usersRes.json() : { users: [] },
      ]);

      setGoals(goalsData.goals || []);
      setUsers(usersData.users || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGoals = goals.filter(goal => {
    const matchesUser = selectedUser === 'all' || goal.employee?.id === selectedUser;
    const matchesStatus = selectedStatus === 'all' || goal.status === selectedStatus;
    const matchesPriority = !selectedPriority || goal.priority === selectedPriority;
    const matchesCategory = selectedCategory === 'all' || goal.category === selectedCategory;
    
    return matchesUser && matchesStatus && matchesPriority && matchesCategory;
  });

  // Handle delete goal
  const handleDeleteGoal = (goal: Goal) => {
    setGoalToDelete(goal);
    setShowDeleteModal(true);
  };

  // Confirm delete goal
  const confirmDeleteGoal = async () => {
    if (!goalToDelete) return;
    
    try {
      // Optimistically update goals immediately
      setGoals(prev => prev.filter(g => g.id !== goalToDelete.id));

      const response = await fetch(`/api/goals/${goalToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      setShowDeleteModal(false);
      setGoalToDelete(null);
      showToast.success('Goal Deleted!', 'The goal has been deleted successfully');
      fetchData(); // Refresh goals
    } catch (error) {
      console.error('Error deleting goal:', error);
      // Revert optimistic update on error
      fetchData();
      showToast.error('Error', error instanceof Error ? error.message : 'Failed to delete goal');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = (goalIds: string[]) => {
    setGoalsToBulkDelete(goalIds);
    setShowBulkDeleteModal(true);
  };

  // Confirm bulk delete
  const confirmBulkDelete = async () => {
    if (goalsToBulkDelete.length === 0) return;

    try {
      // Optimistically update goals immediately
      setGoals(prev => prev.filter(g => !goalsToBulkDelete.includes(g.id)));

      // Delete goals in parallel
      const deletePromises = goalsToBulkDelete.map(goalId =>
        fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
      );

      const results = await Promise.allSettled(deletePromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const failed = results.length - successful;

      if (successful > 0) {
        showToast.success(
          'Goals Deleted!', 
          `Successfully deleted ${successful} goal${successful !== 1 ? 's' : ''}${failed > 0 ? ` (${failed} failed)` : ''}`
        );
      }

      if (failed > 0 && successful === 0) {
        showToast.error('Error', `Failed to delete ${failed} goal${failed !== 1 ? 's' : ''}`);
      }

      setShowBulkDeleteModal(false);
      setGoalsToBulkDelete([]);
      
      // Refresh goals from server to ensure sync
      fetchData();
    } catch (error) {
      console.error('Error bulk deleting goals:', error);
      // Revert optimistic update on error
      fetchData();
      showToast.error('Error', 'Failed to delete goals');
    }
  };

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <DashboardLayout type="admin">
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
            <StatsSection goals={goals} />
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Filters
              selectedUser={selectedUser}
              onUserChange={setSelectedUser}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedPriority={selectedPriority}
              onPriorityChange={setSelectedPriority}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              users={users}
            />
          </motion.div>

          {/* Goals Table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl shadow-xl">
              <div className="p-4">
                <AdminGoalsTable
                  goals={filteredGoals}
                  selectedStatus={selectedStatus === 'all' ? '' : selectedStatus}
                  onStatusChange={(status) => setSelectedStatus(status === '' ? 'all' : status)}
                  onGoalClick={(goal) => setSelectedGoal(goal)}
                  onDelete={handleDeleteGoal}
                  onBulkDelete={handleBulkDelete}
                  showEmployee={true}
                  showManager={true}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Goal Detail Modal */}
      {selectedGoal && (
        <GoalDetailModal
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)}
        />
      )}

      {/* Single Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setGoalToDelete(null);
        }}
        onConfirm={confirmDeleteGoal}
        title="Delete Goal"
        message={goalToDelete ? `Are you sure you want to delete "${goalToDelete.title}"? This action cannot be undone.` : 'Are you sure you want to delete this goal? This action cannot be undone.'}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => {
          setShowBulkDeleteModal(false);
          setGoalsToBulkDelete([]);
        }}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Goals"
        message={`Are you sure you want to delete ${goalsToBulkDelete.length} selected goal${goalsToBulkDelete.length !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
      />
    </DashboardLayout>
  );
}
