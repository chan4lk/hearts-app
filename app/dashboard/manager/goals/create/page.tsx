'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import GoalTemplates from '@/app/components/shared/GoalTemplates';
import { Goal, GoalTemplate } from './types';
import { CATEGORIES } from './constants';
import { Header } from './components/Header';
import { GoalCard } from '@/app/components/shared/GoalCard';
import { SelfCreateGoalModal } from '@/app/components/shared/SelfCreateGoalModal';
import {
  BsLightningCharge,
  BsStars,
  BsPeople,
  BsRocket,
  BsLightbulb,
  BsBriefcase,
  BsBullseye,
  BsArrowUpRight,
  BsTrophy,
  BsAward,
  BsGraphUp,
  BsPersonLinesFill,
  BsClipboardData,
  BsCheckCircle,
  BsBarChart,
  BsCalendar,
  BsPlus,
  BsX
} from 'react-icons/bs';

export default function ManagerGoalsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalGoalData, setModalGoalData] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    category: 'PROFESSIONAL',
  });
  const [viewedGoal, setViewedGoal] = useState<Goal | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user?.role !== 'MANAGER') {
      router.push('/dashboard');
      return;
    }

    fetchGoals();
  }, [session, router]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/goals/manager/self');
      const data = await response.json();
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
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

  const handleModalSubmit = async (formData: typeof modalGoalData) => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        assignedTo: session?.user?.id,
      };
      const response = await fetch('/api/goals/manager/self', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('Failed to create goal');
      }
      showNotificationWithTimeout('Goal created successfully!', 'success');
      fetchGoals();
      setIsCreateModalOpen(false);
      setModalGoalData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        category: 'PROFESSIONAL',
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      showNotificationWithTimeout('Failed to create goal. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCreate = () => {
    setModalGoalData({
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      category: 'PROFESSIONAL',
    });
    setIsCreateModalOpen(true);
  };

  const handleTemplateSelect = (template: GoalTemplate) => {
    setModalGoalData({
      title: template.title,
      description: template.description,
      dueDate: new Date().toISOString().split('T')[0],
      category: template.category,
    });
    setIsCreateModalOpen(true);
  };

  // View handler
  const handleView = (goal: Goal) => {
    setViewedGoal(goal);
    setIsViewModalOpen(true);
  };

  // Delete handler
  const handleDelete = async (goalId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }
      showNotificationWithTimeout('Goal deleted successfully!', 'success');
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      showNotificationWithTimeout('Failed to Delete Goal. Please Try Again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show all goals (not just self-created)
  const displayedGoals = goals;

  if (loading) {
    return (
      <DashboardLayout type="manager">
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

  return (
    <DashboardLayout type="manager">
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
                      Create Goals
                    </h1>
                    <p className="text-xl text-indigo-100/90">Set and manage your personal objectives</p>
                  </div>
                  <div className="mt-6 lg:mt-0 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleQuickCreate}
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
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Goal Creation Dashboard</h2>
                  <p className="text-gray-600 dark:text-gray-400">Create and manage your personal goals</p>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleQuickCreate}
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
                    <BsClipboardData className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Goals</div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{goals.length}</div>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm border border-emerald-200/20 dark:border-emerald-600/20 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <BsCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Completed</div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {goals.filter(g => g.status === 'COMPLETED').length}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 backdrop-blur-sm border border-amber-200/20 dark:border-amber-600/20 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <BsBarChart className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">In Progress</div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {goals.filter(g => g.status === 'PENDING').length}
                </div>
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

          {/* Goal Management Section */}
          <motion.div variants={itemVariants}>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <BsBriefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Goal Management
              </h3>
              
              {displayedGoals.length === 0 ? (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/20 dark:border-gray-700/50 shadow-lg">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-100/50 to-gray-200/50 dark:from-gray-700/50 dark:to-gray-600/50 mb-4">
                    <BsPersonLinesFill className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No goals found</h3>
                  <p className="text-gray-600 dark:text-gray-400">Create your first goal to get started</p>
                </div>
              ) : (
                <motion.div 
                  variants={containerVariants}
                  className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {displayedGoals.map(goal => (
                    <motion.div
                      key={goal.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02 }}
                      className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl"
                    >
                      <GoalCard
                        goal={goal}
                        onView={() => handleView(goal)}
                        onEdit={() => {}}
                        onDelete={() => handleDelete(goal.id)}
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
          <SelfCreateGoalModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleModalSubmit}
            loading={loading}
            goal={modalGoalData}
            setGoal={setModalGoalData}
          />

          {/* View Modal */}
          {isViewModalOpen && viewedGoal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 dark:border-gray-700/50"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Goal Details</h2>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsViewModalOpen(false)} 
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-all p-2 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-full"
                  >
                    <BsX className="w-6 h-6" />
                  </motion.button>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-2">Title</span>
                    <span className="text-gray-900 dark:text-white text-lg">{viewedGoal.title}</span>
                  </div>
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-2">Description</span>
                    <span className="text-gray-900 dark:text-white whitespace-pre-wrap">{viewedGoal.description}</span>
                  </div>
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-2">Category</span>
                    <span className="text-gray-900 dark:text-white">{viewedGoal.category}</span>
                  </div>
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-2">Due Date</span>
                    <span className="text-gray-900 dark:text-white">{viewedGoal.dueDate}</span>
                  </div>
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-2">Status</span>
                    <span className="text-gray-900 dark:text-white">{viewedGoal.status}</span>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsViewModalOpen(false)} 
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Close
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Notification */}
          <AnimatePresence>
            {showNotification && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-[90%] md:max-w-md backdrop-blur-xl border border-white/20 ${
                  notificationType === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'
                } text-white`}
              >
                <div className="flex-shrink-0">
                  {notificationType === 'success' ? 
                    <BsCheckCircle className="w-6 h-6" /> : 
                    <BsX className="w-6 h-6" />
                  }
                </div>
                <span className="text-sm md:text-base font-medium">{notificationMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
} 