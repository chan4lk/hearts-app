'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import GoalsTable from '@/app/components/shared/GoalsTable';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import LoadingComponent from '@/app/components/LoadingScreen';
import { Goal, User as UserType } from '@/app/components/shared/types';
import { motion } from 'framer-motion';
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
                <GoalsTable
                  goals={filteredGoals}
                  selectedStatus={selectedStatus === 'all' ? '' : selectedStatus}
                  onStatusChange={(status) => setSelectedStatus(status === '' ? 'all' : status)}
                  onGoalClick={(goal) => setSelectedGoal(goal)}
                  onStatusUpdate={(goalId, newStatus, updatedGoal) => {
                    setGoals(prevGoals =>
                      prevGoals.map(goal =>
                        goal.id === goalId ? { ...goal, status: updatedGoal.status } : goal
                      )
                    );
                  }}
                  showEmployee={true}
                  showManager={true}
                  disableStatusUpdate={true}
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
    </DashboardLayout>
  );
}
