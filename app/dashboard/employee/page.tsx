'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import StatsSection from './components/StatsSection';
import GoalsSection from './components/GoalsSection';
import GoalDetailModal from './components/GoalDetailModal';
import { Goal, GoalStats } from './components/types';
import { BsArrowUpRight, BsGear, BsBell, BsBullseye, BsCheckCircle, BsClock, BsPause, BsXCircle } from 'react-icons/bs';

export default function EmployeeDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load goals from the database
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        // Fetch assigned goals
        const assignedResponse = await fetch('/api/goals');
        if (!assignedResponse.ok) {
          throw new Error('Failed to fetch assigned goals');
        }
        const assignedData = await assignedResponse.json();
        
        // Fetch self-created goals
        const selfResponse = await fetch('/api/goals/self');
        if (!selfResponse.ok) {
          throw new Error('Failed to fetch self-created goals');
        }
        const selfData = await selfResponse.json();
        
        // Combine both sets of goals
        const allGoals = [...(assignedData.goals || []), ...(selfData.goals || [])];
        setGoals(allGoals);
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || goal.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getGoalStats = (): GoalStats => {
    const total = goals.length;
    const completed = goals.filter(g => g.status === 'COMPLETED').length;
    const modified = goals.filter(g => g.status === 'MODIFIED').length;
    const pending = goals.filter(g => g.status === 'PENDING').length;
    const approved = goals.filter(g => g.status === 'APPROVED').length;
    const rejected = goals.filter(g => g.status === 'REJECTED').length;
    
    // Calculate achievement score based on completed and approved goals
    const achievementScore = total > 0 
      ? Math.round(((completed + approved) / total) * 100) 
      : 0;
    
    return { 
      total, 
      completed, 
      modified, 
      pending, 
      approved, 
      rejected, 
      achievementScore 
    };
  };

  const handleSubmitGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'PENDING'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit goal');
      }

      // Refresh goals list
      const updatedResponse = await fetch('/api/goals', {
        credentials: 'include'
      });
      const updatedData = await updatedResponse.json();
      setGoals(updatedData.goals || []);
    } catch (error) {
      console.error('Error submitting goal:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <DashboardLayout type="employee">
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
      </DashboardLayout>
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

  const stats = getGoalStats();

  return (
    <DashboardLayout type="employee">
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
                      My Dashboard
                    </h1>
                    <p className="text-xl text-indigo-100/90">Track your goals and performance</p>
                  </div>
                  <div className="mt-6 lg:mt-0 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-6 py-3 flex items-center gap-2 hover:bg-white/30 transition-all duration-300"
                    >
                      <BsBell className="text-lg" />
                      Notifications
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
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.total}</h3>
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
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.completed}</h3>
                <p className="text-gray-600 dark:text-gray-300">Completed</p>
                <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
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
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.pending}</h3>
                <p className="text-gray-600 dark:text-gray-300">Pending</p>
                <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
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
                    <BsPause className="text-2xl text-white" />
                  </div>
                  <BsArrowUpRight className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.achievementScore}%</h3>
                <p className="text-gray-600 dark:text-gray-300">Achievement</p>
                <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.achievementScore}%` }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Goals Section */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
                <GoalsSection
                  goals={filteredGoals}
                  searchQuery={searchQuery}
                  selectedStatus={selectedStatus}
                  onSearchChange={setSearchQuery}
                  onStatusChange={setSelectedStatus}
                  onGoalClick={(goal) => {
                    setSelectedGoal(goal);
                    setShowDetailModal(true);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Goal Detail Modal */}
          <AnimatePresence>
            {showDetailModal && selectedGoal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl border border-white/20 dark:border-gray-700/50"
                >
                  <GoalDetailModal
                    goal={selectedGoal}
                    onClose={() => setShowDetailModal(false)}
                    onSubmitGoal={handleSubmitGoal}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}