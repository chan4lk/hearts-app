'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
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
  BsPlus
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
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals');
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const showNotificationWithTimeout = (message: string, type: 'success' | 'error') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newGoal)
      });

      if (!response.ok) {
        throw new Error('Failed to create goal');
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
      console.error('Error creating goal:', error);
      showNotificationWithTimeout('Failed to create goal. Please try again.', 'error');
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

  return (
    <DashboardLayout type="employee">
      <div className="space-y-6">
        {/* Notification Toast */}
        {showNotification && (
          <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
            notificationType === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
          } text-white`}>
            {notificationType === 'success' ? 
              <BsCheckCircle className="w-5 h-5" /> : 
              <BsXCircle className="w-5 h-5" />
            }
            {notificationMessage}
          </div>
        )}

        {/* Header Section */}
        <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Create New Goal
                <span className="bg-indigo-500/10 p-1 rounded text-indigo-400 text-sm font-normal">
                  Employee Portal
                </span>
              </h1>
              <p className="text-gray-400 mt-1">Define your performance goals and track your progress</p>
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <BsPlus className="w-5 h-5" />
              Quick Create
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 p-2 rounded-lg">
                    <BsLightbulb className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Goal Templates</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GOAL_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => {
                      setNewGoal({
                        ...newGoal,
                        title: template.title,
                        description: template.description,
                        category: template.category
                      });
                      setIsCreateModalOpen(true);
                    }}
                    className={`group bg-gradient-to-br ${template.bgGradient} bg-[#252832] hover:bg-[#2d2f36] border border-gray-800 hover:border-indigo-500 rounded-lg p-4 cursor-pointer transition-all duration-200`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-[#1E2028] border border-gray-700 group-hover:border-gray-600 transition-colors">
                        {template.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                          {template.title}
                          <BsArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <p className="text-sm text-gray-400 mt-1">{template.subtitle}</p>
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{template.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Goals Section */}
            <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/10 p-2 rounded-lg">
                    <BsClock className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Recent Goals</h2>
                </div>
              </div>

              {goals.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {goals.slice(0, 6).map((goal) => (
                    <div
                      key={goal.id}
                      className="bg-[#252832] rounded-lg p-4 border border-gray-800 hover:border-indigo-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(goal.status)} bg-opacity-20`}>
                          {goal.status}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <BsCalendar className="w-3 h-3" />
                          <span>{formatDate(goal.dueDate)}</span>
                        </div>
                      </div>
                      <h3 className="text-white font-medium mb-1">{goal.title}</h3>
                      <p className="text-sm text-gray-400 mb-2">{goal.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <BsTag className="w-3 h-3" />
                        <span>{goal.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#252832] mb-4">
                    <BsListTask className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No goals yet</h3>
                  <p className="text-gray-400">Create your first goal to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-[#1E2028] rounded-xl overflow-hidden border border-gray-800">
              {/* Stats Header */}
              <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/10 p-2 rounded-lg">
                      <BsBarChartLine className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Goal Statistics</h3>
                      <p className="text-sm text-gray-400">Performance Overview</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{goals.length}</div>
                    <div className="text-sm text-gray-400">Total Goals</div>
                  </div>
                </div>
              </div>

              {/* Stats Content */}
              <div className="p-6 space-y-6">
                {/* Status Overview */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                    <BsCheckCircle className="w-4 h-4" />
                    Status Overview
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#252832] rounded-lg border border-gray-800/50 hover:border-emerald-500/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/10 p-2 rounded-lg">
                          <BsCheckCircle className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Completed</span>
                          <div className="text-xs text-emerald-400/70">Approved goals</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-medium text-white">{goals.filter(g => g.status === 'APPROVED').length}</span>
                        <div className="text-xs text-gray-500">{Math.round((goals.filter(g => g.status === 'APPROVED').length / goals.length) * 100) || 0}%</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#252832] rounded-lg border border-gray-800/50 hover:border-amber-500/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-500/10 p-2 rounded-lg">
                          <BsClock className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">In Progress</span>
                          <div className="text-xs text-amber-400/70">Pending approval</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-medium text-white">{goals.filter(g => g.status === 'PENDING').length}</span>
                        <div className="text-xs text-gray-500">{Math.round((goals.filter(g => g.status === 'PENDING').length / goals.length) * 100) || 0}%</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#252832] rounded-lg border border-gray-800/50 hover:border-red-500/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-500/10 p-2 rounded-lg">
                          <BsXCircle className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Rejected</span>
                          <div className="text-xs text-red-400/70">Needs revision</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-medium text-white">{goals.filter(g => g.status === 'REJECTED').length}</span>
                        <div className="text-xs text-gray-500">{Math.round((goals.filter(g => g.status === 'REJECTED').length / goals.length) * 100) || 0}%</div>
                      </div>
                    </div>
                  </div>
                </div>

              
              </div>
            </div>
          </div>
        </div>

        {/* Create Goal Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-[#1a1c23] rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Create New Goal</h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c23] to-transparent h-8 -top-8"></div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                      Goal Title
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BsListTask className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="title"
                        value={newGoal.title}
                        onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter goal title"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={newGoal.description}
                      onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                      className="w-full px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Describe your goal in detail"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                        Category
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BsTag className="text-gray-400" />
                        </div>
                        <select
                          id="category"
                          value={newGoal.category}
                          onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          required
                        >
                          {CATEGORIES.map(category => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300 mb-2">
                        Due Date
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BsCalendar className="text-gray-400" />
                        </div>
                        <input
                          type="date"
                          id="dueDate"
                          value={newGoal.dueDate}
                          onChange={(e) => setNewGoal({ ...newGoal, dueDate: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <span>Create Goal</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
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