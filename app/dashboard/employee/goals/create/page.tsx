'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { SelfCreateGoalModal } from '@/app/components/shared/SelfCreateGoalModal';
import { BsPlus } from 'react-icons/bs';
import { GoalTemplates } from './components/GoalTemplates';
import { HeroSection } from './components/HeroSection';
import { GoalsList } from './components/GoalsList';
import { GoalDetailsModal } from './components/modals/GoalDetailsModal';
import { Goal, NewGoal } from './types';

function GoalsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [selectedViewGoal, setSelectedViewGoal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState<NewGoal>({
    title: '',
    description: '',
    category: 'PROFESSIONAL',
    dueDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals/self');
      if (response.ok) {
        const data = await response.json();
        const sortedGoals = data.goals.sort((a: Goal, b: Goal) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setGoals(sortedGoals);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      showNotificationWithTimeout('Failed to load goals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotificationWithTimeout = (message: string, type: 'success' | 'error') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleSubmit = async (goalData: NewGoal) => {
    setLoading(true);
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create goal: ${errorData.error || response.statusText}`);
      }

      setIsCreateModalOpen(false);
      showNotificationWithTimeout('Goal created successfully!', 'success');
      fetchGoals();
      setNewGoal({
        title: '',
        description: '',
        category: 'PROFESSIONAL',
        dueDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error submitting goal:', error);
      showNotificationWithTimeout(
        `Failed to create goal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate completed goals for HeroSection
  const completedGoals = goals.filter(g => g.status === 'APPROVED').length;

  if (loading) {
    return (
      <DashboardLayout type="employee">
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-2 border-indigo-300/20 border-t-indigo-500 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl"
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="employee">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 p-6 space-y-8">
          {/* Hero Section */}
          <HeroSection
            onCreateClick={() => setIsCreateModalOpen(true)}
            totalGoals={goals.length}
            completedGoals={completedGoals}
          />

          {/* Notification Toast */}
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-[90%] md:max-w-md backdrop-blur-xl border border-white/20 ${
                notificationType === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'
              } text-white`}
            >
              <span className="text-sm md:text-base font-medium">{notificationMessage}</span>
            </motion.div>
          )}

          {/* Main Content */}
          <motion.div 
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            initial="hidden"
            animate="visible"
            className="w-full space-y-4"
          >
            <GoalTemplates onSelectTemplate={(goal) => {
              setNewGoal(goal);
              setIsCreateModalOpen(true);
            }} />
          </motion.div>

          {/* Goals List */}
          <GoalsList
            goals={goals}
            selectedStatus={selectedStatus}
            selectedCategory={selectedCategory}
            setSelectedStatus={setSelectedStatus}
            setSelectedCategory={setSelectedCategory}
            onViewGoal={setSelectedViewGoal}
          />
        </div>
      </div>

      {/* Modals */}
      <SelfCreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleSubmit}
        loading={loading}
        goal={newGoal}
        setGoal={setNewGoal}
      />

      <GoalDetailsModal
        goal={selectedViewGoal}
        isOpen={!!selectedViewGoal}
        onClose={() => setSelectedViewGoal(null)}
      />
    </DashboardLayout>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoalsPageContent />
    </Suspense>
  );
} 