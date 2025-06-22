'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { SelfCreateGoalModal } from '@/app/components/shared/SelfCreateGoalModal';
import { 
  BsCalendar, 
  BsListTask, 
  BsTag, 
  BsArrowLeft, 
  BsSearch, 
  BsBarChartLine, 
  BsCheckCircle, 
  BsClock, 
  BsXCircle,
  BsChevronRight,
  BsThreeDotsVertical,
  BsLightningCharge,
  BsBook,
  BsGraphUp,
  BsPeople,
  BsStars,
  BsTrophy,
  BsGear,
  BsArrowUpRight,
  BsRocket,
  BsLightbulb,
  BsAward,
  BsBriefcase,
  BsPlus,
  BsBullseye
} from 'react-icons/bs';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  status: string;
  createdAt: string;
  managerComments?: string;
  employee?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

const CATEGORIES = [
  { value: 'PROFESSIONAL', label: 'Professional Development' },
  { value: 'TECHNICAL', label: 'Technical Skills' },
  { value: 'LEADERSHIP', label: 'Leadership' },
  { value: 'PERSONAL', label: 'Personal Growth' },
  { value: 'TRAINING', label: 'Training' }
];

const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' }
];

const GOAL_TEMPLATES = [
  {
    id: 'project-completion',
    title: 'Project Milestone',
    category: 'PROFESSIONAL',
    icon: <BsRocket className="w-6 h-6 text-blue-400" />,
    description: 'Complete [Project Name] milestone by [Date] achieving [Specific Metrics]',
    subtitle: 'Project Excellence',
    bgGradient: 'from-blue-500/10 to-transparent'
  },
  {
    id: 'skill-mastery',
    title: 'Skill Mastery',
    category: 'TECHNICAL',
    icon: <BsLightbulb className="w-6 h-6 text-amber-400" />,
    description: 'Master [Technology/Skill] through [Training/Project] by [Date]',
    subtitle: 'Technical Growth',
    bgGradient: 'from-amber-500/10 to-transparent'
  },
  {
    id: 'leadership-initiative',
    title: 'Leadership Initiative',
    category: 'LEADERSHIP',
    icon: <BsAward className="w-6 h-6 text-purple-400" />,
    description: 'Lead [Team/Project] to achieve [Specific Outcome] by [Date]',
    subtitle: 'Leadership Development',
    bgGradient: 'from-purple-500/10 to-transparent'
  },
  {
    id: 'career-growth',
    title: 'Career Development',
    category: 'PERSONAL',
    icon: <BsGraphUp className="w-6 h-6 text-emerald-400" />,
    description: 'Achieve [Career Milestone] through [Actions] by [Date]',
    subtitle: 'Professional Growth',
    bgGradient: 'from-emerald-500/10 to-transparent'
  },
  {
    id: 'innovation-project',
    title: 'Innovation Project',
    category: 'PROFESSIONAL',
    icon: <BsStars className="w-6 h-6 text-indigo-400" />,
    description: 'Develop innovative solution for [Problem] achieving [Metrics]',
    subtitle: 'Innovation & Creativity',
    bgGradient: 'from-indigo-500/10 to-transparent'
  },
  {
    id: 'certification-goal',
    title: 'Certification Goal',
    category: 'TRAINING',
    icon: <BsBriefcase className="w-6 h-6 text-rose-400" />,
    description: 'Obtain [Certification Name] certification by [Date]',
    subtitle: 'Professional Certification',
    bgGradient: 'from-rose-500/10 to-transparent'
  }
];

function GoalsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [isTimelineView, setIsTimelineView] = useState(searchParams?.get('view') === 'timeline');
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'PROFESSIONAL',
    dueDate: new Date().toISOString().split('T')[0]
  });
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals/self', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Sort goals by creation date, most recent first
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

  const handleEditGoal = async (goal: Goal) => {
    setSelectedGoal(goal);
    setNewGoal({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      dueDate: new Date(goal.dueDate).toISOString().split('T')[0]
    });
    setIsCreateModalOpen(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    setShowDeleteConfirmation(true);
    setGoalToDelete(goalId);
  };

  const confirmDelete = async () => {
    if (!goalToDelete) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/goals/${goalToDelete}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      showNotificationWithTimeout('Goal Deleted Successfully!', 'success');
      fetchGoals();
    } catch (error) {
      console.error('Error Deleting Goal:', error);
      showNotificationWithTimeout('Failed to Delete Goal', 'error');
    } finally {
      setLoading(false);
      setShowDeleteConfirmation(false);
      setGoalToDelete(null);
    }
  };

  const handleSubmit = async (goalData: { title: string; description: string; dueDate: string; category: string }) => {
    console.log('Submitting goal data:', goalData);
    setLoading(true);

    try {
      const url = selectedGoal 
        ? `/api/goals/${selectedGoal.id}`
        : '/api/goals';
      
      const method = selectedGoal ? 'PUT' : 'POST';
      
      console.log('Making request to:', url, 'with method:', method);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(goalData)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(`Failed to ${selectedGoal ? 'update' : 'create'} goal: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('Success response:', result);

      setIsCreateModalOpen(false);
      showNotificationWithTimeout(
        `Goal ${selectedGoal ? 'updated' : 'created'} successfully!`,
        'success'
      );
      fetchGoals();
      setNewGoal({
        title: '',
        description: '',
        category: 'PROFESSIONAL',
        dueDate: new Date().toISOString().split('T')[0]
      });
      setSelectedGoal(null);
    } catch (error) {
      console.error('Error submitting goal:', error);
      showNotificationWithTimeout(
        `Failed to ${selectedGoal ? 'update' : 'create'} goal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         goal.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || goal.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || goal.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-500';
      case 'PENDING': return 'text-yellow-500';
      case 'REJECTED': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <BsCheckCircle className="w-5 h-5" />;
      case 'PENDING': return <BsClock className="w-5 h-5" />;
      case 'REJECTED': return <BsXCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowDetailsModal(true);
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'REJECTED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const renderGoalCard = (goal: Goal) => (
    <motion.div
      key={goal.id}
      variants={itemVariants}
      whileHover={{ scale: 1.02 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-gray-700/50"
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)} bg-opacity-20 flex items-center gap-2`}>
          {getStatusIcon(goal.status)}
          {goal.status}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <BsCalendar className="w-3 h-3" />
            <span>{formatDate(goal.dueDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleEditGoal(goal)}
              className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-500/10"
              title="Edit Goal"
            >
              <BsGear className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDeleteGoal(goal.id)}
              className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
              title="Delete Goal"
            >
              <BsXCircle className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
      <h3 className="text-gray-900 dark:text-white font-medium mb-2">{goal.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{goal.description}</p>
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <BsTag className="w-3 h-3" />
        <span>{goal.category}</span>
      </div>
    </motion.div>
  );

  const getGoalStats = () => {
    const totalGoals = goals.length;
    const approvedGoals = goals.filter(g => g.status === 'APPROVED').length;
    const pendingGoals = goals.filter(g => g.status === 'PENDING').length;
    const rejectedGoals = goals.filter(g => g.status === 'REJECTED').length;

    return {
      total: totalGoals,
      approved: approvedGoals,
      pending: pendingGoals,
      rejected: rejectedGoals
    };
  };

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
                      Create Goals
                    </h1>
                    <p className="text-xl text-indigo-100/90">Set and manage your personal objectives</p>
                  </div>
                  <div className="mt-6 lg:mt-0 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsCreateModalOpen(true)}
                      className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-6 py-3 flex items-center gap-2 hover:bg-white/30 transition-all duration-300"
                    >
                      <BsPlus className="text-lg" />
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

          {/* Enhanced Notification Toast */}
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
                    <BsXCircle className="w-6 h-6" />
                  }
                </div>
                <span className="text-sm md:text-base font-medium">{notificationMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Templates Section */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                      <BsLightbulb className="text-2xl text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Goal Templates</h2>
                      <p className="text-gray-600 dark:text-gray-400">Choose from predefined templates</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {GOAL_TEMPLATES.map((template) => (
                    <motion.div
                      key={template.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setNewGoal({
                          ...newGoal,
                          title: template.title,
                          description: template.description,
                          category: template.category
                        });
                        setIsCreateModalOpen(true);
                      }}
                      className="group bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-200/20 dark:border-blue-600/20 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-300">
                          {template.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-gray-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                            {template.title}
                            <BsArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.subtitle}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 line-clamp-2">{template.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Stats Section */}
            <motion.div variants={itemVariants}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                      <BsBarChartLine className="text-2xl text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Goals Overview</h2>
                      <p className="text-gray-600 dark:text-gray-400">Your goal statistics</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg">
                        <BsCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Approved</span>
                        <div className="text-xs text-green-600 dark:text-green-400">Completed goals</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{getGoalStats().approved}</span>
                      <div className="text-xs text-gray-500">{Math.round((getGoalStats().approved / getGoalStats().total) * 100) || 0}%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-lg">
                        <BsClock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Pending</span>
                        <div className="text-xs text-amber-600 dark:text-amber-400">Awaiting approval</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{getGoalStats().pending}</span>
                      <div className="text-xs text-gray-500">{Math.round((getGoalStats().pending / getGoalStats().total) * 100) || 0}%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-lg">
                        <BsXCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Rejected</span>
                        <div className="text-xs text-red-600 dark:text-red-400">Needs revision</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{getGoalStats().rejected}</span>
                      <div className="text-xs text-gray-500">{Math.round((getGoalStats().rejected / getGoalStats().total) * 100) || 0}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Goals List Section */}
          <motion.div variants={itemVariants}>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                    <BsListTask className="text-2xl text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Created Goals</h2>
                    <p className="text-gray-600 dark:text-gray-400">Goals you have created and submitted</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full sm:w-auto bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  >
                    {STATUSES.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full sm:w-auto bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="all">All Categories</option>
                    {CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {goals.length > 0 ? (
                <motion.div 
                  variants={containerVariants}
                  className="grid grid-cols-1 gap-4"
                >
                  {filteredGoals.map(renderGoalCard)}
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-100/50 to-gray-200/50 dark:from-gray-700/50 dark:to-gray-600/50 mb-4">
                    <BsListTask className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No goals created yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Start creating and tracking your goals</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg flex items-center gap-2 mx-auto"
                  >
                    <BsPlus className="w-5 h-5" />
                    Create New Goal
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Create Goal Modal */}
      <SelfCreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleSubmit}
        loading={loading}
        goal={newGoal}
        setGoal={setNewGoal}
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